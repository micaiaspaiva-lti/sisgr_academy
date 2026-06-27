import { Worker, Job } from "bullmq";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { aulas } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const apiKey = process.env.GEMINI_API_KEY || "";

// Instanciação do worker BullMQ
export const videoWorker = new Worker(
  "video-processing",
  async (job: Job) => {
    const { aulaId, videoUrl } = job.data;
    console.log(`[Worker] Iniciando processamento do vídeo para a aula: ${aulaId} (${videoUrl})`);

    if (!apiKey) {
      console.warn("GEMINI_API_KEY não configurada. Simulando processamento bem-sucedido.");
      await mockUpdateAula(aulaId);
      return;
    }

    let tempFilePath = "";
    let uploadedFile: any = null;
    const ai = new GoogleGenAI({ apiKey });

    try {
      // 1. Baixar o vídeo localmente para arquivo temporário se for uma URL HTTP
      if (videoUrl.startsWith("http")) {
        console.log(`[Worker] Baixando vídeo para pasta temporária local...`);
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`Falha ao baixar vídeo da URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        tempFilePath = path.join(os.tmpdir(), `video-aula-${aulaId}.mp4`);
        await fs.promises.writeFile(tempFilePath, buffer);
        console.log(`[Worker] Vídeo baixado localmente em: ${tempFilePath}`);
      } else {
        // Se já for um arquivo local
        tempFilePath = videoUrl;
      }

      // 2. Fazer upload para a Gemini File API
      console.log(`[Worker] Carregando arquivo na Gemini File API...`);
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        config: {
          mimeType: "video/mp4",
        }
      });
      console.log(`[Worker] Upload concluído. File name: ${uploadedFile.name}`);

      // 3. Aguardar o processamento do vídeo no Gemini
      let fileStatus = await ai.files.get({ name: uploadedFile.name });
      let attempts = 0;
      while (fileStatus.state === "PROCESSING" && attempts < 20) {
        console.log(`[Worker] Vídeo em processamento pelo Gemini. Aguardando 5 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        fileStatus = await ai.files.get({ name: uploadedFile.name });
        attempts++;
      }

      if (fileStatus.state !== "ACTIVE") {
        throw new Error(`Vídeo não ficou ativo no Gemini. Estado atual: ${fileStatus.state}`);
      }
      console.log(`[Worker] Vídeo está ativo e pronto no Gemini.`);

      // 4. Gerar legendas e resumo estruturado da aula
      console.log(`[Worker] Chamando modelo gemini-2.5-flash para gerar legendas e artigos...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          uploadedFile,
          "Transcreva o áudio deste vídeo em formato WebVTT completo e gere um resumo estruturado detalhado da aula em formato Markdown. Retorne uma resposta JSON com o seguinte formato exato:\n{\n  \"vtt\": \"conteúdo vtt aqui\",\n  \"markdown\": \"resumo markdown aqui\"\n}",
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "";
      let vttContent = `WEBVTT\n\n00:01.000 --> 00:08.000\nBem-vindo ao treinamento da SISGR Academy.`;
      let markdownContent = `Resumo da aula indisponível.`;

      try {
        const parsed = JSON.parse(responseText);
        vttContent = parsed.vtt || vttContent;
        markdownContent = parsed.markdown || markdownContent;
      } catch (jsonErr) {
        console.warn("Erro ao fazer parse do JSON retornado pelo Gemini. Usando texto bruto.");
        markdownContent = responseText;
      }

      // 5. Salvar a legenda VTT em um arquivo acessível publicamente (se necessário)
      // Para simplificar, salvaremos no diretório public/subtitles/
      const subtitlesDir = path.join(process.cwd(), "public", "subtitles");
      if (!fs.existsSync(subtitlesDir)) {
        fs.mkdirSync(subtitlesDir, { recursive: true });
      }
      
      const vttFilePath = path.join(subtitlesDir, `${aulaId}.vtt`);
      await fs.promises.writeFile(vttFilePath, vttContent);
      console.log(`[Worker] Legenda salva localmente em: ${vttFilePath}`);

      // 6. Atualizar a aula no banco de dados via Drizzle
      await db
        .update(aulas)
        .set({
          legendasUrl: `/subtitles/${aulaId}.vtt`,
          descricaoApoio: markdownContent,
        })
        .where(eq(aulas.id, aulaId));

      console.log(`[Worker] Aula ${aulaId} atualizada com sucesso no banco de dados.`);

    } catch (error) {
      console.error(`[Worker] Erro ao processar aula ${aulaId}:`, error);
      throw error;
    } finally {
      // Limpar arquivo temporário local
      if (tempFilePath && tempFilePath !== videoUrl && fs.existsSync(tempFilePath)) {
        try {
          await fs.promises.unlink(tempFilePath);
          console.log(`[Worker] Arquivo temporário local excluído.`);
        } catch (unlinkErr) {
          console.warn("[Worker] Falha ao excluir arquivo temporário local:", unlinkErr);
        }
      }
      // Limpar arquivo na Gemini File API
      if (uploadedFile) {
        try {
          await ai.files.delete({ name: uploadedFile.name });
          console.log(`[Worker] Arquivo excluído da Gemini File API.`);
        } catch (deleteErr) {
          console.warn("[Worker] Falha ao excluir arquivo na Gemini File API:", deleteErr);
        }
      }
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
  }
);

async function mockUpdateAula(aulaId: string) {
  try {
    // Garante que a pasta public/subtitles exista para não quebrar o mock
    const subtitlesDir = path.join(process.cwd(), "public", "subtitles");
    if (!fs.existsSync(subtitlesDir)) {
      fs.mkdirSync(subtitlesDir, { recursive: true });
    }
    const vttFilePath = path.join(subtitlesDir, `${aulaId}.vtt`);
    const mockVtt = `WEBVTT\n\n00:01.000 --> 00:05.000\n[Legendas Simuladas] Bem-vindos ao treinamento de resíduos sólidos.`;
    await fs.promises.writeFile(vttFilePath, mockVtt);

    await db
      .update(aulas)
      .set({
        legendasUrl: `/subtitles/${aulaId}.vtt`,
        descricaoApoio: `Este artigo de apoio foi gerado de forma simulada pelo worker de IA da SISGR Academy. A aula detalha os aspectos práticos da conformidade regulatória.`,
      })
      .where(eq(aulas.id, aulaId));
    console.log(`[Worker Simulado] Aula ${aulaId} atualizada via mock no banco.`);
  } catch (err) {
    console.warn("[Worker Simulado] Banco de dados indisponível para atualizar aula:", err);
  }
}

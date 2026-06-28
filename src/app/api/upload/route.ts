import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado." },
        { status: 400 }
      );
    }

    // Limite de tamanho de 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "O arquivo excede o limite máximo permitido de 25MB." },
        { status: 400 }
      );
    }

    // Bloqueio de arquivos executáveis ou scripts perigosos
    const ext = path.extname(file.name).toLowerCase();
    const dangerousExtensions = [
      ".exe", ".bat", ".sh", ".cmd", ".scr", ".js", ".vbs", 
      ".html", ".htm", ".php", ".py", ".pl", ".jar", ".msi"
    ];
    if (dangerousExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido por motivos de segurança." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Caminho da pasta public/uploads na raiz do projeto
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    // Garante que a pasta public/uploads existe no servidor
    await mkdir(uploadsDir, { recursive: true });

    // Sanitiza e gera nome único para o arquivo
    const sanitizedOriginalName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .toLowerCase();
    const filename = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadsDir, filename);

    // Grava o arquivo de imagem no disco
    await writeFile(filePath, buffer);

    // URL pública acessível pelo navegador
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Erro ao realizar upload de imagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload do arquivo." },
      { status: 500 }
    );
  }
}

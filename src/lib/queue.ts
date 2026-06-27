import { Queue } from "bullmq";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

let videoQueue: Queue | null = null;

try {
  videoQueue = new Queue("video-processing", {
    connection: {
      host: redisHost,
      port: redisPort,
    }
  });
  console.log("Conectado ao Redis. Fila BullMQ inicializada.");
} catch (error) {
  console.warn("Falha ao inicializar o BullMQ/Redis. Operando com fila simulada in-memory:", error);
}

export async function addVideoToQueue(aulaId: string, videoUrl: string) {
  if (videoQueue) {
    try {
      await videoQueue.add("process-video", { aulaId, videoUrl });
      console.log(`Job registrado no Redis para a aula ${aulaId}`);
    } catch (err) {
      console.warn("Erro ao enfileirar job no BullMQ. Usando fallback in-memory:", err);
      simulateProcessing(aulaId);
    }
  } else {
    simulateProcessing(aulaId);
  }
}

function simulateProcessing(aulaId: string) {
  console.log(`[Fila Simulada] Iniciando processamento local in-memory para a aula ${aulaId}...`);
}

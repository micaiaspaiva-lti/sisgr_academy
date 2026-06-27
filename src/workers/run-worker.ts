import { loadEnvConfig } from "@next/env";

// Carrega as variáveis de ambiente usando o utilitário nativo do Next.js
loadEnvConfig(process.cwd());

import { videoWorker } from "./videoWorker";

console.log("=================================================");
console.log("SISGR Academy - Worker BullMQ Iniciado");
console.log("Monitorando a fila 'video-processing' no Redis...");
console.log("=================================================");

videoWorker.on("active", (job) => {
  console.log(`[Worker] Job ${job.id} está ativo.`);
});

videoWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} finalizado com sucesso!`);
});

videoWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou com o erro:`, err);
});

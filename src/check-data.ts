import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// Carrega .env manualmente
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      process.env[key] = val;
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log("\n=== CURSOS REGISTROS ===");
  const cursosRegs = await client.query("SELECT id, titulo, tipo, imagem_capa FROM cursos");
  console.table(cursosRegs.rows);

  console.log("\n=== AULAS REGISTROS ===");
  const aulasRegs = await client.query("SELECT id, titulo, video_url, imagem_capa, demonstrative, ativo, modulo_id FROM aulas");
  console.table(aulasRegs.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

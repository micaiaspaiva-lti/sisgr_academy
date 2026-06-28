import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adicionando colunas tipo e senha à tabela alunos...");
  await db.execute(sql`
    ALTER TABLE alunos 
    ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'normal' NOT NULL,
    ADD COLUMN IF NOT EXISTS senha VARCHAR(255);
  `);
  console.log("Colunas tipo e senha adicionadas com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

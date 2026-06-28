import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adicionando coluna updated_at à tabela cursos...");
  await db.execute(sql`
    ALTER TABLE cursos 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
  `);
  console.log("Coluna adicionada com sucesso!");
  process.exit(0);
}

main().catch(console.error);

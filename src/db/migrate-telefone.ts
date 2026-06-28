import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adicionando coluna telefone à tabela alunos...");
  await db.execute(sql`
    ALTER TABLE alunos 
    ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
  `);
  console.log("Coluna telefone adicionada com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

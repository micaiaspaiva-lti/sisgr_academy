import { db } from "./index";
import { cursos } from "./schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Iniciando migração da tabela cursos...");

  // 1. Adiciona as colunas no banco de dados se não existirem
  console.log("Executando ALTER TABLE...");
  await db.execute(sql`
    ALTER TABLE cursos ADD COLUMN IF NOT EXISTS destaque boolean NOT NULL DEFAULT false;
    ALTER TABLE cursos ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;
  `);

  // 2. Busca todos os cursos existentes
  console.log("Buscando cursos para definir ordem inicial...");
  const allCourses = await db.select().from(cursos).orderBy(cursos.createdAt);
  
  // 3. Atualiza a ordem de cada um
  console.log(`Encontrados ${allCourses.length} cursos. Atualizando ordens...`);
  for (let i = 0; i < allCourses.length; i++) {
    const course = allCourses[i];
    await db
      .update(cursos)
      .set({ ordem: i + 1 })
      .where(sql`id = ${course.id}`);
    console.log(`Curso "${course.titulo}" definido com ordem = ${i + 1}`);
  }

  console.log("Migração concluída com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});

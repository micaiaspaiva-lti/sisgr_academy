import { db } from "@/db";
import { aulas, modulos, cursos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import DemonstrativoClient from "./DemonstrativoClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DemonstrativoPage({ params }: PageProps) {
  const { id: lessonId } = await params;

  // 1. Buscar a aula correspondente no banco de dados
  const currentLesson = await db.query.aulas.findFirst({
    where: eq(aulas.id, lessonId),
  });

  if (!currentLesson) {
    redirect("/");
  }

  // Se a aula não for marcada como demonstrativa, redireciona o visitante de volta
  if (!currentLesson.demonstrative) {
    redirect("/");
  }

  // 2. Buscar o módulo e curso correspondente
  const currentModule = await db.query.modulos.findFirst({
    where: eq(modulos.id, currentLesson.moduloId),
  });

  if (!currentModule) {
    redirect("/");
  }

  const currentCourse = await db.query.cursos.findFirst({
    where: eq(cursos.id, currentModule.cursoId),
  });

  if (!currentCourse) {
    redirect("/");
  }

  const mappedLesson = {
    id: currentLesson.id,
    titulo: currentLesson.titulo,
    descricaoApoio: currentLesson.descricaoApoio || "",
    videoUrl: currentLesson.videoUrl,
  };

  return (
    <DemonstrativoClient
      lesson={mappedLesson}
      courseTitle={currentCourse.titulo}
    />
  );
}

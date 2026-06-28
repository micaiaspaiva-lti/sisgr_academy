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

  if (!currentLesson || !currentLesson.ativo) {
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

  if (!currentCourse || !currentCourse.ativo) {
    redirect("/");
  }

  if (currentCourse.tipo === "vip") {
    redirect("/login");
  }

  // Buscar todos os módulos deste curso
  const courseModules = await db.query.modulos.findMany({
    where: eq(modulos.cursoId, currentCourse.id),
  });

  const moduleIds = courseModules.map(m => m.id);

  // Buscar todas as aulas dos módulos e filtrar as acessíveis (demonstrativas ou todas se curso for público)
  let visibleLessons: any[] = [];
  if (moduleIds.length > 0) {
    const allLessons = await db.query.aulas.findMany({
      where: eq(aulas.ativo, true),
      orderBy: (aulas, { asc }) => [asc(aulas.ordem)],
    });
    visibleLessons = allLessons
      .filter(a => moduleIds.includes(a.moduloId) && (currentCourse.tipo === "publico" || a.demonstrative))
      .map(a => ({
        id: a.id,
        titulo: a.titulo,
        videoUrl: a.videoUrl,
        imagemCapa: a.imagemCapa,
      }));
  }

  const mappedLesson = {
    id: currentLesson.id,
    titulo: currentLesson.titulo,
    descricaoApoio: currentLesson.descricaoApoio || "",
    videoUrl: currentLesson.videoUrl,
    imagemCapa: currentLesson.imagemCapa,
  };

  return (
    <DemonstrativoClient
      lesson={mappedLesson}
      courseTitle={currentCourse.titulo}
      lessons={visibleLessons}
    />
  );
}

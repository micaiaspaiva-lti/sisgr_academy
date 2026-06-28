import { db } from "@/db";
import { aulas, modulos, cursos, progressoAulas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifySSOToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlayerClient from "./PlayerClient";

export const metadata = {
  title: "Player de Aula - SISGR Academy",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PageProps) {
  const { id: lessonId } = await params;

  // 1. SSO Session validation
  const cookieStore = await cookies();
  const token = cookieStore.get("sso_token")?.value || "";
  const session = verifySSOToken(token);

  if (!session) {
    redirect("/login");
  }

  // 2. Fetch the active lesson
  const currentLesson = await db.query.aulas.findFirst({
    where: eq(aulas.id, lessonId),
  });

  if (!currentLesson) {
    // Se a aula não existir, tenta obter qualquer aula ou redireciona
    const firstLesson = await db.query.aulas.findFirst({
      orderBy: (aulas, { asc }) => [asc(aulas.ordem)],
    });
    if (firstLesson) {
      redirect(`/player/${firstLesson.id}`);
    } else {
      redirect("/dashboard");
    }
  }

  // 3. Fetch current module
  const currentModule = await db.query.modulos.findFirst({
    where: eq(modulos.id, currentLesson.moduloId),
  });

  if (!currentModule) {
    redirect("/dashboard");
  }

  // 4. Fetch the entire course with modules and lessons
  const currentCourse = await db.query.cursos.findFirst({
    where: eq(cursos.id, currentModule.cursoId),
    with: {
      modulos: {
        orderBy: (modulos, { asc }) => [asc(modulos.ordem)],
        with: {
          aulas: {
            orderBy: (aulas, { asc }) => [asc(aulas.ordem)],
          }
        }
      }
    }
  });

  if (!currentCourse) {
    redirect("/dashboard");
  }

  // 5. Fetch student completed lessons
  const completedLessons = await db
    .select({ aulaId: progressoAulas.aulaId })
    .from(progressoAulas)
    .where(
      and(
        eq(progressoAulas.alunoId, session.id),
        eq(progressoAulas.concluida, true)
      )
    );

  const completedLessonIds = completedLessons.map(p => p.aulaId);

  // Mapeia do DB para os tipos simplificados do PlayerClient
  const mappedLesson = {
    id: currentLesson.id,
    moduloId: currentLesson.moduloId,
    titulo: currentLesson.titulo,
    descricaoApoio: currentLesson.descricaoApoio,
    videoUrl: currentLesson.videoUrl,
    legendasUrl: currentLesson.legendasUrl,
    demonstrative: currentLesson.demonstrative,
    ordem: currentLesson.ordem,
  };

  const mappedCourse = {
    id: currentCourse.id,
    titulo: currentCourse.titulo,
    descricao: currentCourse.descricao || "",
    imagemCapa: currentCourse.imagemCapa || "",
    tipo: currentCourse.tipo as "publico" | "vip",
    modulos: currentCourse.modulos.map(m => ({
      id: m.id,
      cursoId: m.cursoId,
      titulo: m.titulo,
      ordem: m.ordem,
      aulas: m.aulas.map(a => ({
        id: a.id,
        moduloId: a.moduloId,
        titulo: a.titulo,
        descricaoApoio: a.descricaoApoio,
        videoUrl: a.videoUrl,
        legendasUrl: a.legendasUrl,
        demonstrative: a.demonstrative,
        ordem: a.ordem,
      })),
    })),
  };

  const mappedModule = {
    id: currentModule.id,
    cursoId: currentModule.cursoId,
    titulo: currentModule.titulo,
    ordem: currentModule.ordem,
    aulas: [],
  };

  return (
    <PlayerClient
      currentLesson={mappedLesson}
      currentCourse={mappedCourse}
      currentModule={mappedModule}
      completedLessonIds={completedLessonIds}
      studentId={session.id}
      studentTipo={session.tipo}
    />
  );
}

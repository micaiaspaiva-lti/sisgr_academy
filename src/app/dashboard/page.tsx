import Link from "next/link";
import { cookies } from "next/headers";
import { verifySSOToken } from "@/lib/auth";
import { db } from "@/db";
import { cursos, progressoAulas, aulas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  Play, BookOpen, Award, CheckCircle2, 
  Sparkles, LogOut, Clock, Lock 
} from "lucide-react";
import DashboardClient from "./DashboardClient";
import { alunoLogoutAction } from "@/app/actions";
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

function getCourseImage(course: any): string {
  // 1. Se o curso tiver uma imagem de capa customizada cadastrada, usa ela
  if (course.imagemCapa && !course.imagemCapa.includes("unsplash.com/photo-1532996122724-e3c354a0b15b")) {
    return course.imagemCapa;
  }
  // 2. Se as aulas tiverem capa customizada, usa a da primeira aula
  for (const m of course.modulos || []) {
    for (const a of m.aulas || []) {
      if (a.imagemCapa) {
        return a.imagemCapa;
      }
    }
  }
  // 3. Fallback para thumbnails do YouTube
  for (const m of course.modulos || []) {
    for (const a of m.aulas || []) {
      const ytid = getYouTubeVideoId(a.videoUrl);
      if (ytid) {
        return `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
      }
    }
  }
  return course.imagemCapa || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop";
}
export const metadata = {
  title: "Dashboard do Aluno - SISGR Academy",
  description: "Acompanhe seus cursos de gestão de resíduos, progresso de aulas e conquistas de certificados.",
};

export default async function Dashboard() {
  // Lógica SSO: Tenta decodificar o token a partir de cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("sso_token")?.value || "";
  const session = verifySSOToken(token);
  
  if (!session) {
    redirect("/login");
  }

  // 1. Buscar todos os cursos ativos, módulos e aulas
  const allCourses = await db.query.cursos.findMany({
    where: eq(cursos.ativo, true),
    with: {
      modulos: {
        orderBy: (modulos, { asc }) => [asc(modulos.ordem)],
        with: {
          aulas: {
            where: eq(aulas.ativo, true),
            orderBy: (aulas, { asc }) => [asc(aulas.ordem)],
          }
        }
      }
    }
  });

  // 2. Buscar progresso real do aluno
  const completedLessons = await db
    .select({ aulaId: progressoAulas.aulaId })
    .from(progressoAulas)
    .where(
      and(
        eq(progressoAulas.alunoId, session.id),
        eq(progressoAulas.concluida, true)
      )
    );

  const completedSet = new Set(completedLessons.map(p => p.aulaId));

  // 3. Mapear cursos calculando progresso real
  const studentCourses = allCourses.map(course => {
    let totalLessons = 0;
    let completedLessonsCount = 0;
    let firstIncompleteLessonId: string | null = null;
    let firstLessonId: string | null = null;
    let hasDemoLesson = false;

    course.modulos.forEach(modulo => {
      modulo.aulas.forEach(aula => {
        totalLessons++;
        if (!firstLessonId) firstLessonId = aula.id;
        if (aula.demonstrative) hasDemoLesson = true;
        
        if (completedSet.has(aula.id)) {
          completedLessonsCount++;
        } else if (!firstIncompleteLessonId) {
          firstIncompleteLessonId = aula.id;
        }
      });
    });

    const progresso = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
    const isLocked = session.tipo === "normal" && course.tipo === "vip";
    
    return {
      ...course,
      progresso,
      totalLessons,
      completedLessonsCount,
      isLocked,
      // Aula para continuar: primeira incompleta, ou a primeira se nada concluído, ou a última se tudo concluído
      proximaAulaId: firstIncompleteLessonId || firstLessonId,
    };
  });

  // Curso em andamento com maior progresso para sugerir retomada rápida
  const activeCourse = studentCourses.find(c => c.progresso > 0 && c.progresso < 100) || studentCourses[0];
  
  // Determina a aula de retomada
  let continueLessonId = "";
  let continueLessonTitle = "";
  let continueCourseTitle = "";

  if (activeCourse) {
    continueLessonId = activeCourse.proximaAulaId || "";
    continueCourseTitle = activeCourse.titulo;
    // Encontra o título da aula
    for (const m of activeCourse.modulos) {
      const a = m.aulas.find(aula => aula.id === continueLessonId);
      if (a) {
        continueLessonTitle = a.titulo;
        break;
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header Logado */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center hover:opacity-90 shrink-0">
            <img src="/logo.png" alt="SISGR Academy" className="h-8 md:h-12 w-auto object-contain flex-shrink-0" />
          </Link>
          <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            Área do Aluno
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-bold text-slate-800">{session.nome}</span>
              <span className="text-xs text-slate-500">{session.email}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {session.nome.charAt(0)}
            </div>
          </div>
          <form action={alunoLogoutAction} className="inline-flex">
            <button
              type="submit"
              className="rounded-lg p-2 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
              title="Sair da plataforma"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 py-10 px-6 md:px-12 max-w-none mx-auto w-full px-6 md:px-12 xl:px-16 flex flex-col gap-10">
        
        {/* Banner "Continuar de onde parei" */}
        {continueLessonId && (
          <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
              <img src="/icon.png" alt="" className="h-64 w-64 object-contain filter brightness-0 invert" />
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md">
                <Clock className="h-3 w-3" />
                Retomar Aprendizado
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                Continuar de onde parei
              </h2>
              <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
                Próxima aula: <span className="font-bold text-white">{continueLessonTitle || "Introdução"}</span> do curso "{continueCourseTitle}".
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto">
              <Link
                href={`/player/${continueLessonId}`}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-emerald-700 hover:bg-slate-50 transition-all shadow-md hover:scale-105"
                title="Retomar última aula"
              >
                <Play className="h-5 w-5 fill-current" />
                Retomar Aula
              </Link>
            </div>
          </section>
        )}

        {/* Painel Interativo com Abas, Filtros e Busca */}
        <DashboardClient session={session} courses={studentCourses} />

        {/* Banner de Dúvidas / Suporte */}
        <section className="bg-slate-100 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-slate-600 rounded-lg shadow-xs">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-bold text-sm text-slate-800">Precisando de suporte nos processos do ERP SISGR?</h4>
              <p className="text-xs text-slate-500">
                Nosso suporte está disponível de segunda a sexta, das 8h às 18h.
              </p>
            </div>
          </div>
          <a
            href="https://sisgr.com.br/suporte"
            target="_blank"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Abrir Chamado
          </a>
        </section>

      </main>
    </div>
  );
}

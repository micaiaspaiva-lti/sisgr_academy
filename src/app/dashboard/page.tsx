import Link from "next/link";
import { cookies } from "next/headers";
import { verifySSOToken } from "@/lib/auth";
import { db } from "@/db";
import { cursos, progressoAulas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  Play, BookOpen, Award, CheckCircle2, 
  Sparkles, LogOut, Clock, Lock 
} from "lucide-react";
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
      <header className="border-b border-slate-200 bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <img src="/logo.png" alt="SISGR Academy" className="h-12 w-auto" />
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
          <Link
            href="/"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 py-10 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
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

        {/* Grade de Cursos */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            Meus Cursos Matriculados
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {studentCourses.map((course) => (
              <div 
                key={course.id}
                className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video">
                  <img
                    src={getCourseImage(course)}
                    alt={course.titulo}
                    className="object-cover w-full h-full"
                  />
                  {course.isLocked && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                      <div className="bg-slate-900/95 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-800 shadow-lg">
                        <Lock className="h-4 w-4 text-amber-500" />
                        Conteúdo VIP
                      </div>
                    </div>
                  )}
                  {course.progresso === 100 && !course.isLocked && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg" title="Curso concluído!">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-850">
                      {course.titulo}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {course.descricao}
                    </p>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Progresso</span>
                      <span className="text-emerald-600">{course.progresso}% concluído</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${course.progresso}%` }}
                      />
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-6">
                    {course.isLocked ? (
                      <button
                        disabled
                        className="flex-grow inline-flex items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-450 cursor-not-allowed w-full"
                        title="Este curso é exclusivo para clientes VIP"
                      >
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        Bloqueado para Visitantes
                      </button>
                    ) : course.progresso === 100 ? (
                      <Link
                        href={`/api/certificados/emitir?cursoId=${course.id}`} // Passa o ID do curso para o certificado
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                        target="_blank"
                        title="Baixar Certificado"
                      >
                        <Award className="h-4 w-4" />
                        Baixar Certificado
                      </Link>
                    ) : (
                      <Link
                        href={`/player/${course.proximaAulaId || course.modulos[0]?.aulas[0]?.id}`}
                        className="flex-grow inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                        title="Ir para Player do Curso"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Acessar Curso
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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

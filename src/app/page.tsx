import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, BookOpen } from "lucide-react";
import { db } from "@/db";
import { cursos, aulas } from "@/db/schema";
import { eq } from "drizzle-orm";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

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
  title: "SISGR Academy - Plataforma EAD de Gestão de Resíduos",
  description: "Capacite seus colaboradores e domine a gestão de resíduos sólidos. Cursos especializados em conformidade ambiental, PNRS e emissão de MTR.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  // Busca os cursos ativos do banco de dados relacionalmente
  const activeCourses = await db.query.cursos.findMany({
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

  const isEmpty = !activeCourses || activeCourses.length === 0;

  // Header Component JSX (rendered in both states)
  const renderHeader = () => (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="SISGR Academy" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
            title="Acessar Área do Aluno"
          >
            Área do Aluno
          </Link>
          <Link
            href="/admin/cursos"
            className="rounded-xl bg-duet-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-duet-brand-hover shadow-md shadow-duet-brand/10 hover:shadow-lg transition-all"
            title="Painel Administrativo"
          >
            Painel Admin
          </Link>
        </div>
      </div>
    </header>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col font-sans bg-[#FAFAFA] min-h-screen">
        {renderHeader()}
        <section className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6 items-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <BookOpen className="h-8 w-8 text-slate-500" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Nenhum curso disponível no momento</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Você limpou os dados da plataforma. Vá para o Painel Administrativo para criar novos cursos e aulas ou resetar para o padrão.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Link
                href="/admin/cursos"
                className="inline-flex items-center justify-center rounded-xl bg-duet-brand px-5 py-3 text-xs font-bold text-white hover:bg-duet-brand-hover shadow-md transition-all w-full sm:w-auto"
              >
                Ir para o Painel Admin
              </Link>
            </div>
          </div>
        </section>
        <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-slate-400 text-xs mt-auto">
          <p>&copy; {new Date().getFullYear()} SISGR Academy. Todos os direitos reservados. Integrado ao ecossistema ERP SISGR.</p>
        </footer>
      </div>
    );
  }

  const featuredCourse = activeCourses.find(c => c.id === "c1111111-1111-4111-8111-111111111111") || activeCourses[0];
  const otherCourses = activeCourses.filter(c => c.id !== featuredCourse.id);

  // Primeira aula demonstrativa do curso em destaque
  const demoLesson = featuredCourse.modulos[0]?.aulas.find(a => a.demonstrative) || featuredCourse.modulos[0]?.aulas[0];

  return (
    <div className="flex-1 flex flex-col font-sans bg-[#FAFAFA] min-h-screen">
      {renderHeader()}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-white w-full border-b border-slate-200">
        {/* Soft Green Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-50/30 via-emerald-50/10 to-white pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
          <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
            {featuredCourse.tipo === "vip" ? (
              <span className="inline-flex max-w-fit mx-auto md:mx-0 items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
                Curso VIP (Parceiros B2B)
              </span>
            ) : (
              <span className="inline-flex max-w-fit mx-auto md:mx-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                Curso em Destaque
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 leading-tight tracking-tight">
              {featuredCourse.titulo}
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto md:mx-0 font-medium">
              {featuredCourse.descricao || "Domine novos conhecimentos e qualifique sua equipe de forma 100% prática."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {demoLesson && (
                <Link
                  href={`/demonstrativo/${demoLesson.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 font-bold text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:shadow-2xl transform hover:-translate-y-0.5 transition-all"
                  title="Assistir Aula Gratuita"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Aula Gratuita
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-3.5 font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transform hover:-translate-y-0.5 transition-all"
                title="Acessar Plataforma Completa"
              >
                Acessar com SSO
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md md:max-w-none relative aspect-video rounded-3xl overflow-hidden bg-slate-800 border-[10px] border-white shadow-2xl">
            {demoLesson ? (() => {
              const youtubeEmbedUrl = getYouTubeEmbedUrl(demoLesson.videoUrl);
              return youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={demoLesson.titulo}
                />
              ) : (
                <video
                  src={demoLesson.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  aria-label={`Player de vídeo para a aula: ${demoLesson.titulo}`}
                />
              );
            })() : (
              <img
                src={featuredCourse.imagemCapa || undefined}
                alt="Destaque Gestão de Resíduos"
                className="object-cover w-full h-full opacity-80"
              />
            )}
          </div>
        </div>
      </section>

      {/* Featured & Other Courses Grid */}
      <main className="flex-grow py-20 px-6 md:px-12 w-full max-w-7xl mx-auto">
        {/* Featured Card */}
        <div className="mb-16">
          <h2 className="text-xl font-extrabold text-slate-950 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Curso em Destaque
          </h2>
          <div className="grid md:grid-cols-12 rounded-3xl border border-emerald-100 bg-white overflow-hidden shadow-xl shadow-emerald-500/5 hover:shadow-2xl transition-shadow">
            <div className="md:col-span-5 relative aspect-video md:aspect-auto">
              <img
                src={getCourseImage(featuredCourse)}
                alt={featuredCourse.titulo}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-600 uppercase tracking-widest">
                    Mais Acessado
                  </span>
                  {featuredCourse.tipo === "vip" && (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-inset ring-amber-600/10 uppercase tracking-wider">
                      VIP
                    </span>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 leading-tight">
                  {featuredCourse.titulo}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                  {featuredCourse.descricao}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center border-t border-slate-100 pt-6">
                {demoLesson && (
                  <Link
                    href={`/demonstrativo/${demoLesson.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 transition-all"
                    title="Iniciar Aula Demonstrativa"
                  >
                    <Play className="h-4 w-5 fill-current" />
                    Experimentar Aula
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
                  title="Acessar com Login Unificado"
                >
                  Matricular-se
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Other Courses Grid */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 mb-8">
            Outras Especializações
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xl shadow-emerald-500/3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-video">
                  <img
                    src={getCourseImage(course)}
                    alt={course.titulo}
                    className="object-cover w-full h-full"
                  />
                  {course.tipo === "vip" && (
                    <span className="absolute top-3 right-3 inline-flex items-center rounded-md bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-xs font-black text-white uppercase tracking-wider shadow-md">
                      VIP
                    </span>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-base font-extrabold text-slate-950 line-clamp-1">
                      {course.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-semibold">
                      {course.descricao}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center border-t border-slate-200 pt-4">
                    <Link
                      href="/dashboard"
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 transition-all"
                      title="Acessar Curso"
                    >
                      Acessar Curso
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} SISGR Academy. Todos os direitos reservados. Integrado ao ecossistema ERP SISGR.</p>
      </footer>
    </div>
  );
}

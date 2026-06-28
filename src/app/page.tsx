import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, BookOpen, UserCheck, Tv, Award, ShieldCheck, Users } from "lucide-react";
import CoursesDirectory from "./CoursesDirectory";
import HeroCarousel from "./HeroCarousel";
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
  title: "SISGR Academy - Plataforma EAD de Gestão de Resíduos",
  description: "Capacite seus colaboradores e domine a gestão de resíduos sólidos. Cursos especializados em conformidade ambiental, PNRS e emissão de MTR.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  // Busca os cursos ativos do banco de dados relacionalmente
  const activeCourses = await db.query.cursos.findMany({
    where: eq(cursos.ativo, true),
    orderBy: (cursos, { asc, desc }) => [asc(cursos.ordem), desc(cursos.createdAt)],
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
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
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

  // Busca cursos destacados. Se não houver nenhum destacado, mostra o primeiro curso ativo como padrão.
  const featuredCoursesList = activeCourses.filter(c => c.destaque);
  const displayFeaturedList = featuredCoursesList.length > 0 ? featuredCoursesList : [activeCourses[0]];

  const featuredCoursesData = displayFeaturedList.map(course => {
    const demoLesson = course.tipo === "publico"
      ? (course.modulos[0]?.aulas.find(a => a.demonstrative) || course.modulos[0]?.aulas[0])
      : undefined;
    return {
      id: course.id,
      titulo: course.titulo,
      descricao: course.descricao,
      imagemCapa: course.imagemCapa,
      tipo: course.tipo,
      demoLesson: demoLesson ? { id: demoLesson.id } : undefined,
    };
  });

  return (
    <div className="flex-1 flex flex-col font-sans bg-[#FAFAFA] min-h-screen">
      {renderHeader()}

      {/* Hero Section (Carrossel de Cursos em Destaque) */}
      <HeroCarousel courses={featuredCoursesData} />

      {/* Courses Grid */}
      <main className="flex-grow py-12 px-6 md:px-12 w-full max-w-[1600px] mx-auto flex flex-col gap-16">
        
        {/* Seção Como Funciona e Público-Alvo (Compacta) */}
        <section className="grid lg:grid-cols-12 gap-8 scroll-mt-24">
          
          {/* Lado Esquerdo: Público e Integração (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between gap-5">
            <div>
              <span className="text-4xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">Acesso à Plataforma</span>
              <h2 className="text-lg font-black text-slate-950 mb-3">Para Quem é?</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Público Geral</h4>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                      Acesso livre a cursos públicos e aulas demonstrativas gratuitas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      Clientes ERP SISGR
                      <span className="bg-amber-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wide">SSO</span>
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                      Login unificado integrado para liberar cursos corporativos VIP.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Etapas de Certificação (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <span className="text-4xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">Passo a Passo</span>
              <h2 className="text-lg font-black text-slate-950 mb-4">Como Funciona?</h2>
              
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Passo 1 */}
                <div className="flex flex-col gap-2 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 bg-emerald-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shrink-0">1</span>
                    <span className="text-xs font-extrabold text-slate-800">Escolha o Curso</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                    Navegue ou conecte via SSO se for cliente corporativo.
                  </p>
                </div>

                {/* Passo 2 */}
                <div className="flex flex-col gap-2 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 bg-emerald-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shrink-0">2</span>
                    <span className="text-xs font-extrabold text-slate-800">Estude e Pratique</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                    Assista às aulas e baixe os arquivos de apoio.
                  </p>
                </div>

                {/* Passo 3 */}
                <div className="flex items-center sm:items-start flex-col gap-2 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 bg-emerald-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shrink-0">3</span>
                    <span className="text-xs font-extrabold text-slate-800">Certifique-se</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                    Conclua as aulas e emita seu certificado digital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CoursesDirectory courses={activeCourses} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} SISGR Academy. Todos os direitos reservados. Integrado ao ecossistema ERP SISGR.</p>
      </footer>
    </div>
  );
}

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
      <main className="flex-grow py-20 px-6 md:px-12 w-full max-w-7xl mx-auto flex flex-col gap-24">
        
        {/* Seção Como Funciona e Público-Alvo */}
        <section className="scroll-mt-24">
          
          {/* Bloco de Público-Alvo: Público Geral vs SISGR SSO */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-2xs">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Público Geral</h3>
              <p className="text-xs font-semibold text-slate-550 leading-relaxed">
                Quer alavancar sua carreira ou se especializar no setor de sustentabilidade? Explore nossos cursos públicos de alta qualidade e assista a aulas demonstrativas gratuitamente para começar imediatamente.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 bg-amber-500 text-[9px] font-black text-white px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Corporativo SSO
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-705 shadow-2xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Clientes ERP SISGR</h3>
              <p className="text-xs font-semibold text-slate-555 leading-relaxed">
                Aproveite a integração nativa com o <strong>SISGR - Sistema de Gestão de Resíduos</strong>. Faça login unificado via SSO corporativo para liberar capacitações VIP e treinamentos exclusivos para sua equipe.
              </p>
            </div>
          </div>

          {/* Bloco de Etapas / Como Funciona */}
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-3xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-2">Simples & Direto</span>
            <h2 className="text-3xl font-black text-slate-950 leading-tight mb-4">Qualifique-se em 3 Etapas</h2>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Uma trilha de aprendizado focada em resultados rápidos, materiais complementares e emissão de certificados válidos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Passo 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-3xs relative">
              <div className="absolute -top-4 bg-emerald-600 text-xs font-black text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md">
                1
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-650 mb-4 mt-2">
                <UserCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-2">1. Escolha ou Faça Login</h4>
              <p className="text-3xs font-semibold text-slate-500 leading-relaxed max-w-[220px]">
                Navegue pelas especializações públicas ou faça login corporativo (SSO) caso sua organização seja parceira do ERP SISGR.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-205 shadow-3xs relative">
              <div className="absolute -top-4 bg-emerald-600 text-xs font-black text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md">
                2
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-655 mb-4 mt-2">
                <Tv className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-2">2. Estude e Baixe Anexos</h4>
              <p className="text-3xs font-semibold text-slate-500 leading-relaxed max-w-[220px]">
                Assista às videoaulas em alta resolução no player integrado e baixe materiais e apostilas de apoio para aprofundar.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-3xs relative">
              <div className="absolute -top-4 bg-emerald-600 text-xs font-black text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md">
                3
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-660 mb-4 mt-2">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-2">3. Emita o Certificado</h4>
              <p className="text-3xs font-semibold text-slate-500 leading-relaxed max-w-[220px]">
                Conclua todas as aulas do curso para liberar o download do seu certificado digital de conclusão reconhecido pelo mercado.
              </p>
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

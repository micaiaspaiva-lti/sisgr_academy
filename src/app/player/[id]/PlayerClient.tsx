"use client";

import React, { useState, useOptimistic, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, Play, CheckCircle2, Lock, 
  Menu, X, Maximize2, Minimize2, BookOpen, MessageSquare, 
  Download, ArrowLeft, ArrowRight, Award, CheckCircle 
} from "lucide-react";
import { toast } from "sonner";
import { concluirAulaAction } from "@/app/actions";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

interface Lesson {
  id: string;
  moduloId: string;
  titulo: string;
  descricaoApoio: string | null;
  videoUrl: string;
  legendasUrl: string | null;
  imagemCapa: string | null;
  materiais: { name: string; url: string }[];
  demonstrative: boolean;
  ordem: number;
}

interface Module {
  id: string;
  cursoId: string;
  titulo: string;
  ordem: number;
  aulas: Lesson[];
}

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  imagemCapa: string;
  tipo: "publico" | "vip";
}

interface PlayerClientProps {
  currentLesson: Lesson;
  currentCourse: Course & { modulos: Module[] };
  currentModule: Module;
  completedLessonIds: string[];
  studentId: string;
  studentTipo: "normal" | "vip";
}

export default function PlayerClient({
  currentLesson,
  currentCourse,
  currentModule,
  completedLessonIds,
  studentId,
  studentTipo,
}: PlayerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados locais
  const [cinemaMode, setCinemaMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"apoio" | "forum" | "downloads">("apoio");
  
  // Lista de ID de aulas concluídas (estado base local)
  const [concluidas, setConcluidas] = useState<string[]>(completedLessonIds);

  // Estado otimista para a conclusão de aulas
  const [optimisticConcluidas, setOptimisticConcluidas] = useOptimistic(
    concluidas,
    (state, newAulaId: string) => {
      if (state.includes(newAulaId)) return state;
      return [...state, newAulaId];
    }
  );

  // Calcula todas as aulas na ordem para controle de navegação
  const allLessons = useMemo(() => {
    const list: Lesson[] = [];
    currentCourse.modulos.forEach(m => {
      m.aulas.forEach(a => list.push(a));
    });
    return list;
  }, [currentCourse]);

  const currentIndex = allLessons.findIndex(a => a.id === currentLesson.id);
  const nextLesson = allLessons[currentIndex + 1];

  const handleConcluirEAvançar = () => {
    const lessonId = currentLesson.id;
    
    // Atualização otimista imediata na UI
    startTransition(async () => {
      setOptimisticConcluidas(lessonId);
      
      // Chamada real da Server Action para gravar no banco
      const res = await concluirAulaAction(studentId, lessonId, true);
      
      if (res.success) {
        setConcluidas(prev => {
          if (prev.includes(lessonId)) return prev;
          return [...prev, lessonId];
        });
        toast.success("Aula marcada como concluída!");

        // Avança para a próxima aula se houver
        if (nextLesson) {
          router.push(`/player/${nextLesson.id}`);
        } else {
          toast.success("Parabéns! Você concluiu todas as aulas deste curso. Certificado liberado!", {
            action: {
              label: "Ver Certificado",
              onClick: () => router.push("/dashboard")
            }
          });
        }
      } else {
        toast.error("Erro ao salvar progresso.");
      }
    });
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Header Logado */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md py-4 px-4 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0" title="Voltar ao Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-bold text-slate-100 hidden md:inline truncate max-w-[150px] md:max-w-xs">{currentCourse.titulo}</span>
          <ChevronRight className="h-4 w-4 text-slate-500 hidden md:inline shrink-0" />
          <span className="text-xs font-semibold text-slate-400 truncate max-w-[140px] md:max-w-xs">{currentLesson.titulo}</span>
        </div>
        
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-900 transition-colors"
          title="Ver Módulos"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Grid Principal */}
      <div className={`flex-1 grid ${cinemaMode ? "grid-cols-1" : "lg:grid-cols-12"} w-full`}>
        
        {/* Lado Esquerdo / Vídeo e Abas */}
        <main className={`${cinemaMode ? "lg:col-span-12" : "lg:col-span-8"} flex flex-col bg-slate-950 border-r border-slate-900 overflow-y-auto`}>
          
          {/* Player Container */}
          <div className="aspect-video bg-black relative group">
            {studentTipo === "normal" && currentCourse.tipo === "vip" && !currentLesson.demonstrative ? (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full shadow-inner">
                  <Lock className="h-10 w-10 text-amber-500" />
                </div>
                <div className="flex flex-col gap-2 max-w-sm">
                  <h3 className="text-white font-extrabold text-sm tracking-tight">Conteúdo VIP Exclusivo</h3>
                  <p className="text-slate-400 text-3xs leading-relaxed font-semibold">
                    Esta aula faz parte do conteúdo avançado para parceiros e clientes do ERP SISGR. Entre em contato conosco para assinar e liberar.
                  </p>
                </div>
              </div>
            ) : (() => {
              const youtubeEmbedUrl = getYouTubeEmbedUrl(currentLesson.videoUrl);
              return (
                <>
                  {youtubeEmbedUrl ? (
                    <iframe
                      src={youtubeEmbedUrl}
                      className="w-full h-full object-contain"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentLesson.titulo}
                    />
                  ) : (
                    <video
                      src={currentLesson.videoUrl}
                      poster={currentLesson.imagemCapa || undefined}
                      controls
                      className="w-full h-full object-contain"
                      aria-label={`Player de vídeo para a aula: ${currentLesson.titulo}`}
                    />
                  )}
                  {/* Botão de Modo Cinema no Overlay */}
                  <button
                    onClick={() => setCinemaMode(!cinemaMode)}
                    className="absolute top-4 right-4 p-2.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center cursor-pointer"
                    title={cinemaMode ? "Sair do Modo Cinema" : "Modo Cinema / Teatro"}
                  >
                    {cinemaMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </>
              );
            })()}
          </div>

          {/* Área de Controle e Descrição */}
          <div className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-emerald-400">{currentModule.titulo}</span>
                <h1 className="text-xl md:text-2xl font-black text-slate-100">{currentLesson.titulo}</h1>
              </div>
              <button
                onClick={handleConcluirEAvançar}
                disabled={optimisticConcluidas.includes(currentLesson.id) || isPending}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all shadow-xs shrink-0 cursor-pointer ${
                  optimisticConcluidas.includes(currentLesson.id)
                    ? "bg-emerald-955/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {optimisticConcluidas.includes(currentLesson.id) ? (
                  <>
                    <CheckCircle className="h-4 w-4 fill-current text-emerald-500" />
                    Aula Concluída
                  </>
                ) : (
                  <>
                    Concluir e Avançar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Abas Pedagógicas */}
            <div>
              <div className="flex border-b border-slate-900">
                <button
                  onClick={() => setActiveTab("apoio")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px cursor-pointer ${
                    activeTab === "apoio"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Conteúdo de Apoio
                </button>
                <button
                  onClick={() => setActiveTab("forum")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px cursor-pointer ${
                    activeTab === "forum"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Fórum de Dúvidas
                </button>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px cursor-pointer ${
                    activeTab === "downloads"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Downloads
                </button>
              </div>

              {/* Conteúdo das Abas */}
              <div className="py-6">
                {activeTab === "apoio" && (
                  <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed">
                    {currentLesson.descricaoApoio ? (
                      <div 
                        style={{ whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{ __html: currentLesson.descricaoApoio }} 
                      />
                    ) : (
                      <p className="text-slate-500 italic">Nenhum texto de apoio cadastrado para esta aula.</p>
                    )}
                  </div>
                )}

                {activeTab === "forum" && (
                  <div className="flex flex-col gap-6 text-sm">
                    <div className="border border-slate-800 rounded-xl p-4 flex gap-4 bg-slate-900/40">
                      <div className="h-8 w-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold shrink-0">J</div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">Júlio Martins</span>
                          <span className="text-xs text-slate-500">há 2 dias</span>
                        </div>
                        <p className="text-slate-350 leading-relaxed">Como gerador de resíduos, eu preciso emitir MTR mesmo se for transportar dentro do próprio município com veículo próprio?</p>
                      </div>
                    </div>

                    <div className="border border-emerald-950/40 rounded-xl p-4 flex gap-4 bg-emerald-950/10 border-emerald-800/20">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">I</div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">Instrutor SISGR</span>
                          <span className="inline-flex items-center rounded-md bg-emerald-950 text-2xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Equipe</span>
                          <span className="text-xs text-slate-500">há 1 dia</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">Olá Júlio! Sim, a PNRS e as diretrizes do SINIR exigem a emissão de MTR para todos os resíduos industriais, comerciais e de serviços de saúde, mesmo em transportes municipais internos. O sistema nacional precisa rastrear todo o fluxo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "downloads" && (
                  <div className="flex flex-col gap-4 text-xs font-semibold animate-in fade-in duration-200">
                    {currentLesson.materiais && currentLesson.materiais.length > 0 ? (
                      currentLesson.materiais.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="border border-slate-800 rounded-xl p-4 flex justify-between items-center bg-slate-900/30 hover:bg-slate-900/60 transition-colors shadow-2xs group w-full"
                          title={`Baixar ${file.name}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg group-hover:bg-emerald-900/60 transition-colors shrink-0">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="text-left min-w-0">
                              <h4 className="font-extrabold text-slate-200 text-sm truncate max-w-[150px] sm:max-w-md">
                                {file.name}
                              </h4>
                              <span className="text-3xs text-slate-500 uppercase font-black tracking-wider block">Clique para baixar</span>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                        </a>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm font-semibold p-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        Nenhum arquivo para download anexado a esta aula.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Lado Direito / Lista de Módulos (Sidebar Ocultável no Cinema Mode) */}
        {!cinemaMode && (
          <aside className="hidden lg:flex lg:col-span-4 flex-col bg-slate-950 text-white overflow-y-auto max-h-[100vh] sticky top-0 border-l border-slate-900">
            {/* Header Sidebar */}
            <div className="p-6 border-b border-slate-900 flex items-center gap-3 shrink-0">
              <span className="font-black text-sm uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                Módulos do Curso
              </span>
            </div>

            {/* Lista de Módulos e Aulas */}
            <div className="flex flex-col">
              {currentCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border-b border-slate-900">
                  <div className="bg-slate-900/40 px-6 py-3.5 text-[10px] font-black tracking-wider text-slate-400 uppercase border-y border-slate-900/50">
                    {modulo.titulo}
                  </div>
                  <div className="flex flex-col">
                    {modulo.aulas.map((aula) => {
                      const isActive = aula.id === currentLesson.id;
                      const isConcluida = optimisticConcluidas.includes(aula.id);
                      return (
                        <Link
                          key={aula.id}
                          href={`/player/${aula.id}`}
                          className={`flex items-center justify-between px-6 py-4 border-b border-slate-900/30 text-xs transition-colors relative ${
                            isActive 
                              ? "bg-slate-900/80 text-emerald-400 font-bold border-l-4 border-emerald-500 pl-[20px]" 
                              : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {isConcluida ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 fill-current bg-slate-950 rounded-full" />
                            ) : (
                              <Play className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-emerald-500 fill-emerald-500/20" : "text-slate-500"}`} />
                            )}
                            <span className="truncate">{aula.titulo}</span>
                          </div>
                          {studentTipo === "normal" && currentCourse.tipo === "vip" && !aula.demonstrative && (
                            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Drawer lateral para mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-950 text-white w-4/5 max-w-xs h-full flex flex-col shadow-2xl relative border-r border-slate-900 animate-in slide-in-from-left duration-200">
            {/* Fechar */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              title="Fechar Menu"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 border-b border-slate-900 flex items-center gap-3 shrink-0">
              <span className="font-black text-sm uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                Módulos
              </span>
            </div>

            <div className="flex-grow overflow-y-auto">
              {currentCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border-b border-slate-900">
                  <div className="bg-slate-900/40 px-6 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase border-y border-slate-900/50">
                    {modulo.titulo}
                  </div>
                  <div className="flex flex-col">
                    {modulo.aulas.map((aula) => {
                      const isActive = aula.id === currentLesson.id;
                      const isConcluida = optimisticConcluidas.includes(aula.id);
                      return (
                        <Link
                          key={aula.id}
                          href={`/player/${aula.id}`}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center justify-between px-6 py-4 border-b border-slate-900/30 text-xs transition-colors relative ${
                            isActive 
                              ? "bg-slate-900/80 text-emerald-400 font-bold border-l-4 border-emerald-500 pl-[20px]" 
                              : "text-slate-300 hover:bg-slate-900/50 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {isConcluida ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 fill-current bg-slate-950 rounded-full" />
                            ) : (
                              <Play className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-emerald-500 fill-emerald-500/20" : "text-slate-500"}`} />
                            )}
                            <span className="truncate">{aula.titulo}</span>
                          </div>
                          {studentTipo === "normal" && currentCourse.tipo === "vip" && !aula.demonstrative && (
                            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

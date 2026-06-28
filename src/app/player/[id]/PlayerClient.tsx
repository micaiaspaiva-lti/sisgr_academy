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
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header Logado */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Voltar ao Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-bold text-slate-800 hidden md:inline truncate max-w-xs">{currentCourse.titulo}</span>
          <ChevronRight className="h-4 w-4 text-slate-400 hidden md:inline" />
          <span className="text-xs font-semibold text-slate-500 truncate max-w-xs">{currentLesson.titulo}</span>
        </div>
        
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 transition-colors"
          title="Ver Módulos"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Grid Principal */}
      <div className={`flex-1 grid ${cinemaMode ? "grid-cols-1" : "lg:grid-cols-12"} w-full`}>
        
        {/* Lado Esquerdo / Vídeo e Abas */}
        <main className={`${cinemaMode ? "lg:col-span-12" : "lg:col-span-8"} flex flex-col bg-white border-r border-slate-200 overflow-y-auto`}>
          
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-emerald-600">{currentModule.titulo}</span>
                <h1 className="text-xl md:text-2xl font-black text-slate-950">{currentLesson.titulo}</h1>
              </div>
              <button
                onClick={handleConcluirEAvançar}
                disabled={optimisticConcluidas.includes(currentLesson.id) || isPending}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all shadow-xs shrink-0 ${
                  optimisticConcluidas.includes(currentLesson.id)
                    ? "bg-emerald-100 text-emerald-855 border border-emerald-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {optimisticConcluidas.includes(currentLesson.id) ? (
                  <>
                    <CheckCircle className="h-4 w-4 fill-current text-emerald-600" />
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
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("apoio")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px ${
                    activeTab === "apoio"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Conteúdo de Apoio
                </button>
                <button
                  onClick={() => setActiveTab("forum")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px ${
                    activeTab === "forum"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Fórum de Dúvidas
                </button>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-semibold transition-all -mb-px ${
                    activeTab === "downloads"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Downloads
                </button>
              </div>

              {/* Conteúdo das Abas */}
              <div className="py-6">
                {activeTab === "apoio" && (
                  <div className="prose max-w-none text-sm text-slate-650 leading-relaxed">
                    {currentLesson.descricaoApoio ? (
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.descricaoApoio }} />
                    ) : (
                      <p className="text-slate-400 italic">Nenhum texto de apoio cadastrado para esta aula.</p>
                    )}
                  </div>
                )}

                {activeTab === "forum" && (
                  <div className="flex flex-col gap-6 text-sm">
                    <div className="border border-slate-200 rounded-xl p-4 flex gap-4 bg-slate-50">
                      <div className="h-8 w-8 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold">J</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Júlio Martins</span>
                          <span className="text-xs text-slate-400">há 2 dias</span>
                        </div>
                        <p className="text-slate-600">Como gerador de resíduos, eu preciso emitir MTR mesmo se for transportar dentro do próprio município com veículo próprio?</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 flex gap-4 bg-emerald-50/20 border-emerald-100">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">I</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-800">Instrutor SISGR</span>
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-2xs font-semibold text-emerald-800">Equipe</span>
                          <span className="text-xs text-slate-400">há 1 dia</span>
                        </div>
                        <p className="text-slate-600">Olá Júlio! Sim, a PNRS e as diretrizes do SINIR exigem a emissão de MTR para todos os resíduos industriais, comerciais e de serviços de saúde, mesmo em transportes municipais internos. O sistema nacional precisa rastrear todo o fluxo.</p>
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
                          className="border border-slate-205 rounded-xl p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors shadow-2xs group"
                          title={`Baixar ${file.name}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-100 transition-colors">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate max-w-xs sm:max-w-md">
                                {file.name}
                              </h4>
                              <span className="text-3xs text-slate-450 uppercase font-black tracking-wider">Clique para baixar o material</span>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-slate-450 group-hover:text-emerald-600 transition-colors" />
                        </a>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm font-semibold p-4 text-center border border-dashed border-slate-205 rounded-xl bg-slate-50/50">
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
          <aside className="hidden md:flex md:col-span-4 flex-col bg-slate-900 text-white overflow-y-auto max-h-[100vh] sticky top-0">
            {/* Header Sidebar */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <img src="/icon.png" alt="" className="h-6 w-6 object-contain" />
              <span className="font-black text-sm uppercase tracking-wider">Módulos do Curso</span>
            </div>

            {/* Lista de Módulos e Aulas */}
            <div className="flex flex-col">
              {currentCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border-b border-slate-800">
                  <div className="bg-slate-950 px-6 py-3 text-xs font-black tracking-wider text-slate-400 uppercase">
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
                          className={`flex items-center justify-between px-6 py-4 border-b border-slate-800/40 text-xs transition-colors ${
                            isActive 
                              ? "bg-slate-850 text-white font-bold" 
                              : "text-slate-300 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {isConcluida ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 fill-current bg-white rounded-full" />
                            ) : (
                              <Play className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600 fill-current" : "text-slate-500"}`} />
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

      {/* Drawer responsivo lateral para mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 text-white w-4/5 max-w-xs h-full flex flex-col shadow-2xl relative animate-in slide-in-from-left duration-200">
            {/* Fechar */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              title="Fechar Menu"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <img src="/icon.png" alt="" className="h-6 w-6 object-contain" />
              <span className="font-black text-sm uppercase tracking-wider">Módulos</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border-b border-slate-800">
                  <div className="bg-slate-950 px-6 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
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
                          className={`flex items-center justify-between px-6 py-4 border-b border-slate-800/40 text-xs transition-colors ${
                            isActive 
                              ? "bg-slate-800 text-white font-bold" 
                              : "text-slate-300 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {isConcluida ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Play className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
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

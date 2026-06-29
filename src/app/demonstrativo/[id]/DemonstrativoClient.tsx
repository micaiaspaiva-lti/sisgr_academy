"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, Lock, Sparkles, User, Bot, Send, Award, Loader2, ArrowLeft, Key, Play, BookOpen, Download
} from "lucide-react";
import { toast, Toaster } from "sonner";
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
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
  titulo: string;
  descricaoApoio: string;
  videoUrl: string;
  imagemCapa: string | null;
  materiais: { name: string; url: string }[];
}

interface VisibleLesson {
  id: string;
  titulo: string;
  videoUrl: string;
  imagemCapa?: string | null;
  materiais?: { name: string; url: string }[];
}

interface DemonstrativoClientProps {
  lesson: Lesson;
  courseTitle: string;
  lessons?: VisibleLesson[];
}

export default function DemonstrativoClient({ lesson, courseTitle, lessons = [] }: DemonstrativoClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; quiz?: boolean }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [quizStep, setQuizStep] = useState<"idle" | "ready" | "active" | "submitting" | "completed">("idle");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"aulas" | "chat">("aulas");
  const [hasStarted, setHasStarted] = useState(false);

  // Form de Captura de Leads com campo Senha
  const [leadForm, setLeadForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
  });

  // Quiz de Fixação
  const quizQuestions = [
    {
      id: "q1",
      pergunta: "Qual é o principal objetivo da triagem de resíduos sólidos no início do processo?",
      opcoes: [
        "Aumentar o volume de resíduos em aterros sanitários.",
        "Separar materiais recicláveis por tipo para otimizar a reciclagem.",
        "Incinerar materiais inflamáveis imediatamente.",
        "Substituir o uso de EPIs pelos operadores."
      ],
      respostaCorreta: "Separar materiais recicláveis por tipo para otimizar a reciclagem."
    },
    {
      id: "q2",
      pergunta: "A Política Nacional de Resíduos Sólidos (PNRS) estabelece que a responsabilidade pelos resíduos é:",
      opcoes: [
        "Exclusivamente do Governo Federal.",
        "Exclusivamente do consumidor final.",
        "Compartilhada entre fabricantes, importadores, distribuidores, comerciantes, cidadãos e poder público.",
        "Exclusivamente das cooperativas de reciclagem."
      ],
      respostaCorreta: "Compartilhada entre fabricantes, importadores, distribuidores, comerciantes, cidadãos e poder público."
    },
    {
      id: "q3",
      pergunta: "O que representa a sigla MTR no transporte de resíduos?",
      opcoes: [
        "Manifesto de Transporte de Resíduos.",
        "Manual de Tratamento de Resíduos Sólidos.",
        "Metodologia de Triagem Rápida.",
        "Mecanismo de Transição Reversa."
      ],
      respostaCorreta: "Manifesto de Transporte de Resíduos."
    }
  ];

  // Mensagem inicial da IA
  useEffect(() => {
    setVideoEnded(false);
    setHasStarted(false);
    setChatMessages([
      {
        sender: "bot",
        text: `Olá! Sou o Assistente de IA da SISGR Academy. Assista à aula demonstrativa "${lesson.titulo}" no player ao lado. Quando finalizar, poderei aplicar um quiz rápido sobre o conteúdo e liberar seu mini-certificado!`
      }
    ]);
  }, [lesson.id]);

  // Carrega e gerencia a API do YouTube para monitorar o vídeo
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    let player: any;
    let mounted = true;

    const initPlayer = () => {
      const videoId = getYouTubeVideoId(lesson.videoUrl);
      if (!videoId || !mounted) return;

      const el = document.getElementById("youtube-player");
      if (!el) {
        setTimeout(initPlayer, 100);
        return;
      }

      player = new window.YT.Player("youtube-player", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1) {
              setHasStarted(true);
            }
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              handleVideoEnded();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    }

    return () => {
      mounted = false;
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [lesson.id, lesson.videoUrl]);

  const handleVideoEnded = () => {
    setVideoEnded(true);
    setQuizStep("ready");
    setActiveRightTab("chat");
    setChatMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "Parabéns por concluir a aula! Vi que você assistiu até o final. Vamos testar seus conhecimentos com um quiz de fixação de 3 perguntas? Clique no botão abaixo para começar!",
        quiz: true
      }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInputMessage("");

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Estou focado no seu quiz e treinamento de resíduos. Assista ao vídeo e conclua o quiz para emitir seu mini-certificado de participação!"
        }
      ]);
    }, 1000);
  };

  const startQuiz = () => {
    setQuizStep("active");
    setActiveQuestionIndex(0);
    setSelectedAnswers({});
    setActiveRightTab("chat");
  };

  const handleAnswerSelect = (option: string) => {
    const currentQuestion = quizQuestions[activeQuestionIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const nextQuestion = () => {
    if (activeQuestionIndex < quizQuestions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    } else {
      setQuizStep("submitting");
      setIsLeadModalOpen(true);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    setLeadForm(prev => ({ ...prev, telefone: formatted.slice(0, 15) }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome.trim() || !leadForm.email.trim() || !leadForm.telefone.trim() || !leadForm.senha.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmittingLead(true);

    let acertos = 0;
    quizQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.respostaCorreta) {
        acertos++;
      }
    });
    const nota = Math.round((acertos / quizQuestions.length) * 100);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: leadForm.nome,
          email: leadForm.email,
          telefone: leadForm.telefone,
          senha: leadForm.senha,
          aulaOrigemId: lesson.id,
          respostasQuiz: Object.entries(selectedAnswers).map(([perguntaId, respostaSelecionada]) => ({
            perguntaId,
            respostaSelecionada
          })),
          notaQuiz: nota
        })
      });

      if (response.ok) {
        setQuizStep("completed");
        setIsLeadModalOpen(false);
        toast.success("Cadastro realizado com sucesso! Mini-certificado emitido.");
        setChatMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `Quiz Concluído! Você acertou ${acertos} de ${quizQuestions.length} perguntas (${nota}% de aproveitamento). Seu cadastro gratuito foi realizado e seu mini-certificado foi emitido com sucesso! Você foi logado no sistema.`
          }
        ]);
        
        // Redireciona o usuário para o dashboard após cadastro e login automático
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      } else {
        const errData = await response.json();
        toast.error(errData.error || "Erro ao salvar cadastro.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white py-4 px-4 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link href="/" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-655 transition-colors shrink-0" title="Voltar ao início">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-bold text-slate-800 hidden sm:inline truncate max-w-[150px] md:max-w-xs">{courseTitle}</span>
          <ChevronRight className="h-4 w-4 text-slate-450 hidden sm:inline shrink-0" />
          <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px] sm:max-w-xs">{lesson.titulo}</span>
        </div>
        <Link
          href="/"
          className="hidden sm:inline-flex rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-xs"
        >
          Voltar ao Início
        </Link>
      </header>

      {/* Container Principal */}
      <div className="flex-grow grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* Lado Esquerdo: Player de Vídeo */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            {/* Player de Vídeo */}
            <div className="aspect-video bg-black relative">
              {(() => {
                const isYouTube = !!getYouTubeVideoId(lesson.videoUrl);
                return isYouTube ? (
                  <div className="w-full h-full relative">
                    <div id="youtube-player" className="w-full h-full" />
                    {hasStarted && !videoEnded && (
                      <button
                        onClick={handleVideoEnded}
                        className="absolute bottom-4 right-4 z-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer animate-in fade-in zoom-in duration-200"
                      >
                        Liberar Quiz de Fixação
                      </button>
                    )}
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    poster={lesson.imagemCapa || undefined}
                    controls
                    onPlay={() => setHasStarted(true)}
                    onEnded={handleVideoEnded}
                    className="w-full h-full object-contain"
                    aria-label={`Player de vídeo para a aula: ${lesson.titulo}`}
                  />
                );
              })()}
            </div>
            
            {/* Detalhes da Aula */}
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-100 uppercase tracking-wide">
                Aula Gratuita Demonstrativa
              </span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {lesson.titulo}
              </h1>
              <div 
                className="text-slate-650 leading-relaxed font-medium text-sm prose prose-sm max-w-none"
                style={{ whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: lesson.descricaoApoio }}
              />

              {/* Material de Apoio */}
              {lesson.materiais && lesson.materiais.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {lesson.materiais.map((file, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-205 bg-white shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-3xs text-slate-400">Material de apoio da aula</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          toast.info("Cadastre-se gratuitamente respondendo o quiz para baixar o material de apoio!");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-3xs font-extrabold cursor-pointer uppercase tracking-wider shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              )}
  
              {/* Banner de Aviso de Área Privada */}
              <div className="mt-6 flex items-start gap-4 rounded-2xl bg-amber-50/20 border border-amber-250 p-4">
                <Lock className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-extrabold text-slate-800 text-sm">Esta é uma aula demonstrativa aberta.</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Cadastrando-se ao final do quiz de fixação ou entrando como parceiro do ERP SISGR, você garante acesso ao seu mini-certificado e suporte pedagógico.
                  </p>
                  <Link 
                    href="/login" 
                    className="text-xs font-black text-emerald-600 hover:underline mt-2 flex items-center gap-1"
                  >
                    Acessar Área do Aluno <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Lado Direito: Assistente de IA e Quiz */}
        <aside className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px] lg:h-auto animate-in fade-in duration-300">
          {/* Header com Abas */}
          <div className="bg-slate-50 border-b border-slate-200 flex">
            <button
              onClick={() => setActiveRightTab("aulas")}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeRightTab === "aulas"
                  ? "border-emerald-600 text-emerald-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30"
              }`}
            >
              Aulas ({lessons.length})
            </button>
            <button
              onClick={() => setActiveRightTab("chat")}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeRightTab === "chat"
                  ? "border-emerald-600 text-emerald-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 fill-emerald-50" />
              Chat com IA
            </button>
          </div>

          {/* Renderização Condicional do Conteúdo da Sidebar */}
          {activeRightTab === "aulas" ? (
            <div className="flex-grow overflow-y-auto flex flex-col divide-y divide-slate-100 bg-white">
              {lessons.map((a, i) => {
                const isActive = a.id === lesson.id;
                return (
                  <Link
                    key={a.id}
                    href={`/demonstrativo/${a.id}`}
                    className={`flex items-center justify-between px-6 py-4 text-xs transition-colors border-b border-slate-100 ${
                      isActive
                        ? "bg-emerald-50/20 text-emerald-800 font-bold border-l-4 border-l-emerald-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="truncate">{a.titulo}</span>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border border-emerald-100">
                        Reproduzindo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                        Grátis
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <>
              {/* Área de Mensagens / Quiz */}
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 bg-white">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                        msg.sender === "user" ? "bg-slate-655" : "bg-emerald-650"
                      }`}
                    >
                      {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                        msg.sender === "user"
                          ? "bg-slate-650 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-150"
                      }`}
                    >
                      <p>{msg.text}</p>
                      
                      {/* Botão de Trigger do Quiz */}
                      {msg.quiz && quizStep === "ready" && (
                        <button
                          onClick={startQuiz}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-650 py-2 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Começar Quiz de Fixação
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Quiz Ativo */}
                {quizStep === "active" && (
                  <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50/10 p-4 flex flex-col gap-4 mt-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-3xs font-extrabold text-emerald-600 uppercase">Pergunta {activeQuestionIndex + 1} de {quizQuestions.length}</span>
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                    
                    <h3 className="font-extrabold text-xs text-slate-800 leading-relaxed">
                      {quizQuestions[activeQuestionIndex].pergunta}
                    </h3>
                    
                    <div className="flex flex-col gap-2">
                      {quizQuestions[activeQuestionIndex].opcoes.map((opcao, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswerSelect(opcao)}
                          className={`w-full text-left p-3 rounded-lg border text-3xs leading-relaxed transition-all cursor-pointer ${
                            selectedAnswers[quizQuestions[activeQuestionIndex].id] === opcao
                              ? "border-emerald-650 bg-emerald-50/30 text-emerald-800 font-bold shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={!selectedAnswers[quizQuestions[activeQuestionIndex].id]}
                      onClick={nextQuestion}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 px-4 text-xs font-bold text-white hover:bg-emerald-750 disabled:bg-slate-350 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {activeQuestionIndex < quizQuestions.length - 1 ? "Próxima Pergunta" : "Finalizar Quiz"}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Input de Mensagem */}
              {quizStep === "idle" && (
                <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Tire uma dúvida sobre a aula..."
                    className="flex-grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                    title="Enviar mensagem"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Modal de Captura de Leads com campo Senha */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 border border-slate-200 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-2 text-center items-center">
              <div className="p-3 bg-purple-50 text-purple-650 rounded-full border border-purple-100">
                <Award className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                Parabéns! Quiz Finalizado
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Crie sua conta preenchendo os dados abaixo para emitir o seu **Mini-Certificado** gratuito e acessar o Conteúdo de Apoio no EAD!
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-nome" className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Nome Completo</label>
                <input
                  id="lead-nome"
                  type="text"
                  required
                  value={leadForm.nome}
                  onChange={e => setLeadForm({ ...leadForm, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  className="rounded-lg border border-slate-350 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-650 focus:ring-1 focus:ring-emerald-655"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-email" className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">E-mail</label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="nome@empresa.com"
                  className="rounded-lg border border-slate-355 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-650 focus:ring-1 focus:ring-emerald-650"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-tel" className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Telefone (Obrigatório)</label>
                <input
                  id="lead-tel"
                  type="tel"
                  required
                  value={leadForm.telefone}
                  onChange={handlePhoneChange}
                  placeholder="(99) 99999-9999"
                  className="rounded-lg border border-slate-350 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-650 focus:ring-1 focus:ring-emerald-650"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-senha" className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Definir Senha</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    id="lead-senha"
                    type="password"
                    required
                    value={leadForm.senha}
                    onChange={e => setLeadForm({ ...leadForm, senha: e.target.value })}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-350 focus:outline-hidden focus:border-emerald-650 focus:ring-1 focus:ring-emerald-650"
                  />
                </div>
                <span className="text-[10px] text-slate-450 font-bold italic">Você usará este e-mail e senha para logar novamente depois.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLead}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 font-bold text-white hover:bg-emerald-700 disabled:bg-slate-350 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
              >
                {isSubmittingLead ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Cadastrar e Emitir Certificado
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronRight, Lock, Sparkles, User, Bot, Send, Award, Loader2
} from "lucide-react";
import { mockCourses, Lesson } from "@/lib/mockData";

export default function AulaDemonstrativa() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Busca a aula demonstrativa
  let currentLesson: Lesson | undefined;
  let currentCourseTitle = "";
  
  for (const course of mockCourses) {
    for (const modulo of course.modulos) {
      const found = modulo.aulas.find(a => a.id === id);
      if (found) {
        currentLesson = found;
        currentCourseTitle = course.titulo;
        break;
      }
    }
    if (currentLesson) break;
  }

  // Fallback se não encontrar
  if (!currentLesson) {
    currentLesson = mockCourses[0].modulos[0].aulas[0];
    currentCourseTitle = mockCourses[0].titulo;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; quiz?: boolean }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [quizStep, setQuizStep] = useState<"idle" | "ready" | "active" | "submitting" | "completed">("idle");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Form de Captura de Leads
  const [leadForm, setLeadForm] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  // Quiz Simulado (Gerado baseado na aula)
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
    setChatMessages([
      {
        sender: "bot",
        text: `Olá! Sou o Assistente de IA da SISGR Academy. Assista à aula demonstrativa "${currentLesson?.titulo}" no player ao lado. Quando finalizar, poderei aplicar um quiz rápido sobre o conteúdo e liberar seu mini-certificado!`
      }
    ]);
  }, [id]);

  // Captura o término do vídeo
  const handleVideoEnded = () => {
    setVideoEnded(true);
    setQuizStep("ready");
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

    // Resposta simulada simples
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
      // Finalizou as respostas, abre o modal de lead para emitir o certificado
      setQuizStep("submitting");
      setIsLeadModalOpen(true);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome || !leadForm.email) return;

    setIsSubmittingLead(true);

    // Calcular nota
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
          aulaOrigemId: currentLesson?.id,
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
        setChatMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `Quiz Concluído! Você acertou ${acertos} de ${quizQuestions.length} perguntas (${nota}% de aproveitamento). Seu cadastro gratuito foi realizado e seu mini-certificado foi emitido com sucesso!`
          }
        ]);
      } else {
        alert("Erro ao enviar seus dados. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <img src="/logo.png" alt="SISGR Academy" className="h-12 w-auto" />
          </Link>
          <ChevronRight className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-500 hidden sm:inline">{currentCourseTitle}</span>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Voltar ao Início
        </Link>
      </header>

      {/* Container Principal */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* Lado Esquerdo: Player de Vídeo e Detalhes da Aula */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            {/* Player de Vídeo */}
            <div className="aspect-video bg-black relative">
              <video
                ref={videoRef}
                src={currentLesson.videoUrl}
                controls
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
                aria-label={`Player de vídeo para a aula: ${currentLesson.titulo}`}
              />
            </div>
            
            {/* Detalhes da Aula */}
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-duet-green-light px-2.5 py-0.5 text-xs font-semibold text-duet-green">
                Aula Gratuita Demonstrativa
              </span>
              <h1 className="text-2xl font-black text-duet-text-primary">
                {currentLesson.titulo}
              </h1>
              <p className="text-duet-text-secondary leading-relaxed">
                {currentLesson.descricaoApoio}
              </p>
 
              {/* Banner de Aviso de Área Privada */}
              <div className="mt-6 flex items-start gap-4 rounded-xl bg-duet-brand-light border border-duet-border p-4">
                <Lock className="h-6 w-6 text-duet-brand shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-duet-text-primary text-sm">Esta é uma aula demonstrativa.</h3>
                  <p className="text-xs text-duet-text-secondary leading-relaxed">
                    Alunos e parceiros cadastrados do ERP SISGR têm acesso a módulos avançados, suporte pedagógico completo, fórum de dúvidas exclusivo e emissão de certificados oficiais.
                  </p>
                  <Link 
                    href="/dashboard" 
                    className="text-xs font-extrabold text-duet-brand hover:underline mt-2 flex items-center gap-1"
                  >
                    Acessar área privada com SSO <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Lado Direito: Assistente de IA e Quiz */}
        <aside className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden h-[600px] lg:h-auto">
          {/* Header do Chat */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-sm">Assistente Acadêmico IA</span>
            </div>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>

          {/* Área de Mensagens / Quiz */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                    msg.sender === "user" ? "bg-slate-600" : "bg-duet-brand"
                  }`}
                >
                  {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-slate-600 text-white rounded-tr-none"
                      : "bg-slate-100 text-slate-800 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {/* Botão de Trigger do Quiz */}
                  {msg.quiz && quizStep === "ready" && (
                    <button
                      onClick={startQuiz}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-duet-brand py-2 px-4 text-xs font-semibold text-white hover:bg-duet-brand-hover transition-colors shadow-sm"
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
              <div className="rounded-xl border-2 border-duet-brand bg-blue-50/50 p-4 flex flex-col gap-4 mt-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-duet-brand">Pergunta {activeQuestionIndex + 1} de {quizQuestions.length}</span>
                  <Sparkles className="h-4 w-4 text-duet-brand" />
                </div>
                
                <h3 className="font-bold text-sm text-duet-text-primary leading-relaxed">
                  {quizQuestions[activeQuestionIndex].pergunta}
                </h3>
                
                <div className="flex flex-col gap-2">
                  {quizQuestions[activeQuestionIndex].opcoes.map((opcao, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerSelect(opcao)}
                      className={`w-full text-left p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                        selectedAnswers[quizQuestions[activeQuestionIndex].id] === opcao
                          ? "border-duet-brand bg-blue-100 text-duet-brand font-semibold shadow-xs"
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
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-duet-brand py-2 px-4 text-xs font-semibold text-white hover:bg-duet-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:border-duet-brand focus:ring-1 focus:ring-duet-brand"
              />
              <button
                type="submit"
                className="rounded-lg bg-duet-brand p-2 text-white hover:bg-duet-brand-hover transition-colors"
                title="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </aside>
      </div>

      {/* Modal de Captura de Leads */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 border border-slate-200 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-2 text-center items-center">
              <div className="p-3 bg-purple-100 text-duet-purple rounded-full">
                <Award className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-duet-text-primary mt-2">
                Parabéns! Quiz Finalizado
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para visualizar a pontuação obtida e emitir o seu **Mini-Certificado de Participação** gratuito, preencha o cadastro abaixo.
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lead-nome" className="text-xs font-bold text-slate-700">Nome Completo</label>
                <input
                  id="lead-nome"
                  type="text"
                  required
                  value={leadForm.nome}
                  onChange={e => setLeadForm({ ...leadForm, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-duet-brand focus:ring-1 focus:ring-duet-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="lead-email" className="text-xs font-bold text-slate-700">E-mail de Trabalho</label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="nome@empresa.com"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-duet-brand focus:ring-1 focus:ring-duet-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="lead-tel" className="text-xs font-bold text-slate-700">Telefone / WhatsApp</label>
                <input
                  id="lead-tel"
                  type="tel"
                  value={leadForm.telefone}
                  onChange={e => setLeadForm({ ...leadForm, telefone: e.target.value })}
                  placeholder="(00) 90000-0000"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-duet-brand focus:ring-1 focus:ring-duet-brand"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLead}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-duet-brand py-2.5 px-4 font-semibold text-white hover:bg-duet-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmittingLead ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Emitir Meu Certificado Gratuito
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

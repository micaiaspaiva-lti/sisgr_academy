"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Play, BookOpen, Award, CheckCircle2, Lock, 
  Search, SlidersHorizontal, BookMarked, GraduationCap, 
  Sparkles, ShieldAlert, Clock, MessageSquare, HelpCircle, X, ChevronDown, ChevronUp, Check
} from "lucide-react";
import { UserSession } from "@/lib/auth";
import { toast } from "sonner";
import { criarSolicitacaoVipAction, criarChamadoAction } from "@/app/actions";

interface Course {
  id: string;
  titulo: string;
  descricao: string | null;
  imagemCapa: string | null;
  ativo: boolean;
  tipo: string;
  destaque: boolean;
  ordem: number;
  createdAt: Date;
  updatedAt: Date;
  progresso: number;
  totalLessons: number;
  completedLessonsCount: number;
  isLocked: boolean;
  isRequested?: boolean;
  proximaAulaId: string | null;
  modulos: any[];
}

interface Chamado {
  id: string;
  assunto: string;
  mensagem: string;
  status: "aberto" | "respondido" | "fechado";
  resposta: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardClientProps {
  session: UserSession;
  courses: Course[];
  initialChamados?: Chamado[];
}

export default function DashboardClient({ session, courses, initialChamados = [] }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "meus" | "disponiveis" | "vip">("todos");
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);

  // Modal State for VIP Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Support Tickets States
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [chamadosList, setChamadosList] = useState<Chamado[]>(initialChamados);
  const [supportAssunto, setSupportAssunto] = useState("");
  const [supportMensagem, setSupportMensagem] = useState("");
  const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);
  const [expandedChamadoId, setExpandedChamadoId] = useState<string | null>(null);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportAssunto.trim() || !supportMensagem.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSupportSubmitting(true);
    try {
      const res = await criarChamadoAction(supportAssunto, supportMensagem);
      if (res.success && res.chamado) {
        toast.success("Chamado aberto com sucesso! Nosso time responderá em breve.");
        const newTicket: Chamado = {
          id: res.chamado.id,
          assunto: res.chamado.assunto,
          mensagem: res.chamado.mensagem,
          status: res.chamado.status as "aberto" | "respondido" | "fechado",
          resposta: res.chamado.resposta || "",
          createdAt: res.chamado.createdAt.toISOString(),
          updatedAt: res.chamado.updatedAt.toISOString(),
        };
        setChamadosList(prev => [newTicket, ...prev]);
        setSupportAssunto("");
        setSupportMensagem("");
      } else {
        toast.error(res.error || "Erro ao abrir chamado.");
      }
    } catch (err) {
      toast.error("Falha ao enviar chamado.");
      console.error(err);
    } finally {
      setIsSupportSubmitting(false);
    }
  };

  const handleOpenRequestModal = (course: Course) => {
    setSelectedCourse(course);
    setEmpresaNome("");
    setCnpj("");
    setIsModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!empresaNome.trim() || !cnpj.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await criarSolicitacaoVipAction(selectedCourse.id, empresaNome, cnpj);
      if (res.success) {
        toast.success("Solicitação de acesso VIP enviada! O administrador irá validar seus dados.");
        setLocalCourses(prev => prev.map(c => {
          if (c.id === selectedCourse.id) {
            return { ...c, isRequested: true };
          }
          return c;
        }));
        handleCloseRequestModal();
      } else {
        toast.error(res.error || "Erro ao enviar solicitação.");
      }
    } catch (err) {
      toast.error("Falha ao processar solicitação.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to resolve course image
  function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  }

  function getCourseImage(course: Course): string {
    if (course.imagemCapa && !course.imagemCapa.includes("unsplash.com/photo-1532996122724-e3c354a0b15b")) {
      return course.imagemCapa;
    }
    for (const m of course.modulos || []) {
      for (const a of m.aulas || []) {
        if (a.imagemCapa) return a.imagemCapa;
      }
    }
    for (const m of course.modulos || []) {
      for (const a of m.aulas || []) {
        const ytid = getYouTubeVideoId(a.videoUrl);
        if (ytid) return `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
      }
    }
    return course.imagemCapa || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop";
  }

  // Categories of courses for counts
  const categorizedCourses = useMemo(() => {
    const meus = localCourses.filter(c => c.progresso > 0);
    const disponiveis = localCourses.filter(c => c.progresso === 0 && !c.isLocked);
    const vip = localCourses.filter(c => c.isLocked);
    
    return {
      todos: localCourses,
      meus,
      disponiveis,
      vip
    };
  }, [localCourses]);

  // Filtered courses based on selected tab and search query
  const filteredCourses = useMemo(() => {
    const activeList = categorizedCourses[activeTab];
    if (!searchQuery.trim()) return activeList;

    const query = searchQuery.toLowerCase().trim();
    return activeList.filter(c => 
      c.titulo.toLowerCase().includes(query) || 
      (c.descricao && c.descricao.toLowerCase().includes(query))
    );
  }, [categorizedCourses, activeTab, searchQuery]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search and Tabs Control Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por título ou descrição do curso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-55/70 border border-slate-200 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Limpar
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold self-end md:self-auto">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros Rápidos</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "todos"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/85 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Todos os Cursos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              activeTab === "todos" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}>
              {categorizedCourses.todos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("meus")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "meus"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/85 hover:text-slate-800"
            }`}
          >
            <BookMarked className="h-4 w-4" />
            Meus Cursos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              activeTab === "meus" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}>
              {categorizedCourses.meus.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("disponiveis")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "disponiveis"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/85 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Disponíveis para Você
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              activeTab === "disponiveis" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}>
              {categorizedCourses.disponiveis.length}
            </span>
          </button>

          {/* Somente exibe a aba de cursos VIP bloqueados se houver algum no perfil */}
          {categorizedCourses.vip.length > 0 && (
            <button
              onClick={() => setActiveTab("vip")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "vip"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/85 hover:text-slate-800"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Ofertas VIP (Bloqueados)
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeTab === "vip" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {categorizedCourses.vip.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid View */}
      <div>
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="flex flex-col rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xl shadow-emerald-500/3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Capa */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img
                    src={getCourseImage(course)}
                    alt={course.titulo}
                    className="absolute inset-0 w-full h-full object-cover"
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
                
                {/* Conteúdo */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        course.tipo === "vip" 
                          ? "bg-purple-100 text-purple-700 border border-purple-200/50" 
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200/50"
                      }`}>
                        {course.tipo}
                      </span>
                      {course.progresso > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {course.completedLessonsCount}/{course.totalLessons} aulas
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950 line-clamp-1" title={course.titulo}>
                      {course.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-semibold">
                      {course.descricao || "Sem descrição disponível."}
                    </p>
                  </div>

                  {/* Barra de Progresso */}
                  {course.progresso > 0 && (
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
                  )}

                  {/* Botões de Ação */}
                  <div className="flex gap-4 items-center border-t border-slate-200 pt-4">
                    {course.isLocked ? (
                      course.isRequested ? (
                        <button
                          disabled
                          className="flex-grow inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-400 border border-slate-200 transition-all text-center cursor-not-allowed"
                          title="Sua solicitação de acesso VIP está pendente de análise"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-450" />
                          Solicitação Pendente
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenRequestModal(course)}
                          className="flex-grow inline-flex items-center justify-center gap-2 rounded-xl bg-purple-50 hover:bg-purple-100 px-4 py-2.5 text-xs font-bold text-purple-750 border border-purple-200/55 transition-all text-center cursor-pointer"
                          title="Fale conosco ou solicite a liberação deste curso VIP"
                        >
                          <Lock className="h-3.5 w-3.5 text-purple-650" />
                          Solicitar Acesso VIP
                        </button>
                      )
                    ) : course.progresso === 100 ? (
                      <Link
                        href={`/api/certificados/emitir?cursoId=${course.id}`}
                        className="flex-grow inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-md shadow-purple-500/10"
                        target="_blank"
                        title="Baixar Certificado"
                      >
                        <Award className="h-4 w-4" />
                        Baixar Certificado
                      </Link>
                    ) : (
                      <Link
                        href={course.progresso > 0 
                          ? `/player/${course.proximaAulaId}`
                          : `/player/${course.proximaAulaId || (course.modulos[0]?.aulas[0]?.id)}`
                        }
                        className="flex-grow inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/10"
                        title={course.progresso > 0 ? "Continuar Curso" : "Iniciar Curso"}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        {course.progresso > 0 ? "Continuar Curso" : "Iniciar Curso"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto shadow-xs">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Nenhum curso encontrado</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Não encontramos nenhum curso que atenda a este filtro ou termo de pesquisa. Tente refazer a busca ou limpar os filtros.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("todos");
              }}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Resetar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de Solicitação VIP */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-scaleUp">
            
            {/* Cabeçalho */}
            <div className="flex flex-col gap-2 text-center relative">
              <div className="mx-auto bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Solicitar Acesso VIP</h3>
                <p className="text-3xs font-bold text-purple-600 uppercase tracking-widest mt-1">Verificação de Cliente</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold px-2 mt-1">
                Você solicitou liberação para o curso: <br />
                <strong className="text-slate-800">"{selectedCourse.titulo}"</strong>.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Nome fantasia da sua empresa"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-purple-500/10 transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">CNPJ</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => {
                    const val = e.target.value;
                    const digits = val.replace(/\D/g, "");
                    let formatted = digits;
                    if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
                    if (digits.length > 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
                    if (digits.length > 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
                    if (digits.length > 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
                    setCnpj(formatted.slice(0, 18));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-purple-500/10 transition-all font-semibold"
                />
              </div>

              <p className="text-[10px] text-slate-400 font-semibold leading-normal pl-1">
                * Nosso administrador utilizará estas informações para verificar o contrato ativo e liberar sua conta corporativa como VIP.
              </p>

              {/* Botões */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCloseRequestModal}
                  className="py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner de Dúvidas / Suporte */}
      <section className="bg-slate-100 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white text-slate-650 rounded-lg shadow-xs">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="font-bold text-sm text-slate-800">Precisando de suporte no SISGR Academy?</h4>
            <p className="text-xs text-slate-500">
              Nosso suporte está disponível de segunda a sexta, das 8h às 18h.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSupportModalOpen(true)}
          className="rounded-lg border border-slate-350 bg-white px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer"
        >
          Abrir Chamado
        </button>
      </section>

      {/* Modal de Suporte Técnico */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-650 rounded-xl border border-purple-100">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">Suporte Técnico</h2>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">SISGR Academy</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid de Conteúdo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden flex-1">
              
              {/* Lado Esquerdo: Formulário */}
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-extrabold text-xs text-slate-800">Abrir Novo Chamado</h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Descreva sua dúvida, problema ou solicitação. Retornaremos o contato em breve.
                  </p>
                </div>

                <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Assunto / Tópico</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dúvida sobre certificado, Problema no vídeo..."
                      value={supportAssunto}
                      onChange={(e) => setSupportAssunto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Sua Mensagem</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Descreva detalhadamente o que precisa..."
                      value={supportMensagem}
                      onChange={(e) => setSupportMensagem(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSupportSubmitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSupportSubmitting ? "Enviando..." : "Enviar Chamado"}
                  </button>
                </form>
              </div>

              {/* Lado Direito: Histórico */}
              <div className="flex flex-col gap-4 overflow-y-auto pl-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 max-h-[45vh] md:max-h-none">
                <div className="flex justify-between items-center shrink-0">
                  <h3 className="font-extrabold text-xs text-slate-800">Seus Chamados Anteriores</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {chamadosList.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                  {chamadosList.length > 0 ? (
                    chamadosList.map((c) => {
                      const isExpanded = expandedChamadoId === c.id;
                      return (
                        <div key={c.id} className="border border-slate-150 rounded-2xl overflow-hidden shadow-3xs bg-slate-50/20">
                          {/* Header Accordion */}
                          <button
                            type="button"
                            onClick={() => setExpandedChamadoId(isExpanded ? null : c.id)}
                            className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                          >
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-xs font-extrabold text-slate-800 truncate">{c.assunto}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                c.status === "aberto"
                                  ? "bg-amber-100 text-amber-800"
                                  : c.status === "respondido"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}>
                                {c.status}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>
                          </button>

                          {/* Content Accordion */}
                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3 text-3xs font-semibold leading-relaxed text-slate-655">
                              <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sua Mensagem:</span>
                                <p className="text-slate-700 whitespace-pre-wrap">{c.mensagem}</p>
                              </div>
                              
                              {c.resposta ? (
                                <div className="flex flex-col gap-1 bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100">
                                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Resposta do Suporte:
                                  </span>
                                  <p className="text-slate-700 whitespace-pre-wrap">{c.resposta}</p>
                                </div>
                              ) : (
                                <div className="text-[9px] text-slate-400 font-medium italic pl-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Aguardando resposta do suporte...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                      Nenhum chamado aberto ainda.
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

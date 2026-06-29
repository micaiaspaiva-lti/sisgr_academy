"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  MessageSquare, Users, Building2, BarChart3, LogOut, ArrowLeft,
  CheckCircle2, Clock, Search, Send, Check
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { logoutAdminAction } from "@/lib/auth-admin";
import { responderChamadoAction, fecharChamadoAction } from "@/app/actions";

interface Chamado {
  id: string;
  alunoNome: string;
  alunoEmail: string;
  assunto: string;
  mensagem: string;
  status: "aberto" | "respondido" | "fechado";
  resposta: string;
  createdAt: string;
  updatedAt: string;
}

interface SuporteClientProps {
  initialChamados: Chamado[];
}

export default function SuporteClient({ initialChamados }: SuporteClientProps) {
  const [chamadosList, setChamadosList] = useState<Chamado[]>(initialChamados);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "aberto" | "respondido" | "fechado">("todos");
  const [selectedChamadoId, setSelectedChamadoId] = useState<string | null>(
    initialChamados.length > 0 ? initialChamados[0].id : null
  );

  const [respostaTexto, setRespostaTexto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogout = async () => {
    const res = await logoutAdminAction();
    if (res.success) {
      toast.success("Sessão administrativa encerrada.");
      window.location.href = "/admin/login";
    }
  };

  const selectedChamado = useMemo(() => {
    return chamadosList.find(c => c.id === selectedChamadoId) || null;
  }, [selectedChamadoId, chamadosList]);

  // Filtragem
  const filteredChamados = useMemo(() => {
    return chamadosList.filter(c => {
      const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
      const matchesSearch = 
        c.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
        c.alunoEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.assunto.toLowerCase().includes(search.toLowerCase()) ||
        c.mensagem.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [chamadosList, statusFilter, search]);

  // Enviar Resposta
  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChamadoId || !respostaTexto.trim()) {
      toast.error("Por favor, digite uma resposta válida.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await responderChamadoAction(selectedChamadoId, respostaTexto);
      if (res.success && res.chamado) {
        toast.success("Resposta enviada com sucesso!");
        setChamadosList(prev => prev.map(item => {
          if (item.id === selectedChamadoId) {
            return {
              ...item,
              status: "respondido",
              resposta: respostaTexto.trim(),
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        }));
        setRespostaTexto("");
      } else {
        toast.error(res.error || "Erro ao responder chamado.");
      }
    } catch (err) {
      toast.error("Falha ao enviar resposta.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fechar Chamado
  const handleFecharChamado = async () => {
    if (!selectedChamadoId) return;

    if (!confirm("Deseja realmente marcar este chamado como resolvido/fechado?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fecharChamadoAction(selectedChamadoId);
      if (res.success) {
        toast.success("Chamado fechado com sucesso.");
        setChamadosList(prev => prev.map(item => {
          if (item.id === selectedChamadoId) {
            return {
              ...item,
              status: "fechado",
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        }));
      } else {
        toast.error(res.error || "Erro ao fechar chamado.");
      }
    } catch (err) {
      toast.error("Falha ao fechar chamado.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Header Admin */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/alunos" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-605 transition-colors" title="Voltar para Alunos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center hover:opacity-90 shrink-0">
            <img src="/logo.png" alt="SISGR Academy" className="h-8 md:h-12 w-auto object-contain flex-shrink-0" />
          </Link>
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
            Suporte Técnico
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/admin/cursos" 
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
          >
            Editar Cursos
          </Link>

          <Link 
            href="/admin/alunos" 
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Gerenciar Alunos"
          >
            <Users className="h-4 w-4" />
            Alunos
          </Link>

          <Link 
            href="/admin/empresas" 
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Gerenciar Empresas"
          >
            <Building2 className="h-4 w-4" />
            Empresas
          </Link>

          <Link 
            href="/admin/metricas" 
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Relatórios B2B"
          >
            <BarChart3 className="h-4 w-4" />
            Métricas B2B
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Ver como Aluno
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-655 hover:border-red-200 transition-colors bg-white cursor-pointer"
            title="Sair do Painel"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-none mx-auto w-full px-6 md:px-12 xl:px-16">
        
        {/* Lado Esquerdo: Lista de Chamados */}
        <main className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
            
            {/* Cabeçalho e Busca */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg text-purple-700">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h2 className="font-extrabold text-slate-800 text-xs">Chamados de Suporte</h2>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {filteredChamados.length}
                </span>
              </div>

              {/* Input Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar chamado ou aluno..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-205 focus:border-purple-500/50 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Filtros Status */}
              <div className="flex gap-1 border-t border-slate-150/60 pt-2 text-[10px] font-bold">
                {(["todos", "aberto", "respondido", "fechado"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md transition-colors capitalize cursor-pointer ${
                      statusFilter === status
                        ? "bg-purple-650 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "todos" ? "Todos" : status === "aberto" ? "Abertos" : status === "respondido" ? "Respondidos" : "Fechados"}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Scroll */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredChamados.length > 0 ? (
                filteredChamados.map((c) => {
                  const isSelected = c.id === selectedChamadoId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChamadoId(c.id)}
                      className={`w-full text-left p-4 transition-colors flex flex-col gap-2 ${
                        isSelected ? "bg-purple-50/30 border-l-4 border-l-purple-600" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-extrabold text-slate-900 text-xs truncate max-w-[70%]">
                          {c.alunoNome}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          c.status === "aberto"
                            ? "bg-amber-100 text-amber-800"
                            : c.status === "respondido"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-slate-700 text-3xs line-clamp-1">{c.assunto}</span>
                        <span className="text-slate-450 text-[10px] line-clamp-1 leading-normal">{c.mensagem}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold self-end">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")} às {new Date(c.createdAt).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 font-medium italic">
                  Nenhum chamado encontrado.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Lado Direito: Visualização e Resposta */}
        <aside className="lg:col-span-7">
          {selectedChamado ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-6 h-[calc(100vh-220px)] min-h-[480px]">
              
              {/* Cabeçalho do Detalhe */}
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                <span className={`inline-flex max-w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  selectedChamado.status === "aberto"
                    ? "bg-amber-100 text-amber-800"
                    : selectedChamado.status === "respondido"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {selectedChamado.status === "aberto" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  Chamado {selectedChamado.status}
                </span>

                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {selectedChamado.assunto}
                </h2>
                
                <div className="flex flex-col text-[11px] text-slate-500 font-medium mt-1">
                  <span>Aluno: <strong className="text-slate-750">{selectedChamado.alunoNome}</strong> ({selectedChamado.alunoEmail})</span>
                  <span>Data de Abertura: {new Date(selectedChamado.createdAt).toLocaleDateString("pt-BR")} às {new Date(selectedChamado.createdAt).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}</span>
                </div>
              </div>

              {/* Corpo da Mensagem (Aluno) */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-5">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mensagem do Aluno</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold white-space-pre-line">
                    {selectedChamado.mensagem}
                  </p>
                </div>

                {/* Resposta Anterior (se houver) */}
                {selectedChamado.resposta && (
                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Resposta do Suporte (Enviada)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      {selectedChamado.resposta}
                    </p>
                    <span className="text-[9px] text-slate-400 font-semibold self-end">
                      Respondido em: {new Date(selectedChamado.updatedAt).toLocaleDateString("pt-BR")} às {new Date(selectedChamado.updatedAt).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações (Responder/Fechar) */}
              {selectedChamado.status !== "fechado" ? (
                <form onSubmit={handleEnviarResposta} className="border-t border-slate-100 pt-4 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Sua Resposta</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Escreva a resposta para o aluno..."
                      value={respostaTexto}
                      onChange={(e) => setRespostaTexto(e.target.value)}
                      className="w-full border border-slate-205 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-purple-500 bg-white font-medium"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !respostaTexto.trim()}
                      className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar Resposta
                    </button>
                    <button
                      type="button"
                      onClick={handleFecharChamado}
                      disabled={isSubmitting}
                      className="py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-655 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-450" />
                      Resolver Chamado
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-450 font-bold shrink-0 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Este chamado foi resolvido e fechado.
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center gap-3 h-[calc(100vh-220px)] min-h-[480px]">
              <MessageSquare className="h-8 w-8 text-slate-300 animate-bounce" />
              <p className="text-xs text-slate-400 font-semibold italic">Selecione um chamado da lista para ver os detalhes e responder.</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

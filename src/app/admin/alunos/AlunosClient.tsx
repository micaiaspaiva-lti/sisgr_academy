"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  Building2, 
  UserCheck, 
  LogOut, 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Shield,
  Sparkles,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { 
  createAlunoAction, 
  deleteAlunoAction, 
  simularSessaoAlunoAction, 
  limparSessaoSimuladaAction 
} from "@/app/actions";

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: "normal" | "vip";
  createdAt: string;
  empresa: {
    id: string;
    nomeFantasia: string;
  } | null;
}

interface Empresa {
  id: string;
  nomeFantasia: string;
}

interface AlunosClientProps {
  initialAlunos: Aluno[];
  empresas: Empresa[];
  activeSessionId: string | null;
}

export default function AlunosClient({ initialAlunos, empresas, activeSessionId }: AlunosClientProps) {
  const [alunosList, setAlunosList] = useState<Aluno[]>(initialAlunos);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<"normal" | "vip">("normal");
  const [empresaId, setEmpresaId] = useState("");

  // Formatação de telefone em tempo real
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
    setTelefone(formatted.slice(0, 15));
  };

  // Filtragem de Alunos
  const filteredAlunos = alunosList.filter(a => 
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.telefone.includes(search)
  );

  // Cadastro de Aluno
  const handleCreateAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (tipo === "vip" && !empresaId) {
      toast.error("Por favor, selecione a empresa associada ao aluno VIP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAlunoAction(nome, email, telefone, tipo, tipo === "vip" ? empresaId : null);
      if (res.success && res.aluno) {
        const empresaObj = tipo === "vip" 
          ? empresas.find(e => e.id === empresaId) || null 
          : null;

        const newAluno: Aluno = {
          id: res.aluno.id,
          nome: res.aluno.nome,
          email: res.aluno.email,
          telefone: res.aluno.telefone || "",
          tipo: (res.aluno.tipo || "normal") as "normal" | "vip",
          createdAt: res.aluno.createdAt.toISOString(),
          empresa: empresaObj ? { id: empresaObj.id, nomeFantasia: empresaObj.nomeFantasia } : null
        };

        setAlunosList(prev => [newAluno, ...prev]);
        toast.success("Aluno cadastrado com sucesso!");
        
        // Limpa formulário
        setNome("");
        setEmail("");
        setTelefone("");
        setTipo("normal");
        setEmpresaId("");
      } else {
        toast.error(res.error || "Erro ao cadastrar aluno.");
      }
    } catch (err) {
      toast.error("Ocorreu uma falha ao cadastrar.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclusão de Aluno
  const handleDeleteAluno = async (id: string) => {
    if (!confirm("Deseja realmente excluir este aluno do sistema?")) return;

    try {
      const res = await deleteAlunoAction(id);
      if (res.success) {
        setAlunosList(prev => prev.filter(a => a.id !== id));
        toast.success("Aluno removido com sucesso!");
      } else {
        toast.error(res.error || "Erro ao excluir aluno.");
      }
    } catch (err) {
      toast.error("Falha ao excluir.");
      console.error(err);
    }
  };

  // Simular Sessão
  const handleSimularSessao = async (id: string) => {
    toast.info("Iniciando simulação de sessão...");
    try {
      const res = await simularSessaoAlunoAction(id);
      if (res.success) {
        toast.success("Sessão simulada com sucesso! Você está navegando como este aluno.");
        // Pequeno delay para recarregar a página e re-ler o cookie
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(res.error || "Erro ao simular sessão.");
      }
    } catch (err) {
      toast.error("Falha ao iniciar simulação.");
      console.error(err);
    }
  };

  // Encerrar Simulação
  const handleLimparSimulacao = async () => {
    try {
      const res = await limparSessaoSimuladaAction();
      if (res.success) {
        toast.success("Simulação de sessão encerrada. Retornando ao Arthur Pendragon padrão.");
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(res.error || "Erro ao limpar simulação.");
      }
    } catch (err) {
      toast.error("Falha ao encerrar simulação.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 pb-12">
      {/* Header Admin */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/cursos" 
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" 
            title="Voltar ao CMS"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-600/10">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">Administração de Alunos</h1>
              <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wide">Controle e Classificação B2B/B2C</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeSessionId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-semibold">Simulação de Aluno Ativa</span>
              <button 
                onClick={handleLimparSimulacao}
                className="bg-amber-600/10 text-amber-800 hover:bg-amber-600/20 px-2 py-0.5 rounded-md font-bold text-3xs transition-colors flex items-center gap-1 ml-1 cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                Sair
              </button>
            </div>
          )}

          <Link 
            href="/admin/cursos" 
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
          >
            Editar Cursos
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
            Ir para o EAD
          </Link>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* Lado Esquerdo: Listagem de Alunos */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filtros da Tabela */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, email ou tel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Exibindo <strong>{filteredAlunos.length}</strong> de <strong>{alunosList.length}</strong> alunos
              </span>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 text-3xs font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">Aluno / Cadastro</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Classificação</th>
                    <th className="px-6 py-4">Empresa (B2B)</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlunos.length > 0 ? (
                    filteredAlunos.map((aluno) => {
                      const isActive = activeSessionId === aluno.id;
                      return (
                        <tr 
                          key={aluno.id} 
                          className={`hover:bg-slate-50/50 transition-colors group ${
                            isActive ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                              }`}>
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                                  {aluno.nome}
                                  {isActive && (
                                    <span className="bg-amber-100 text-amber-800 text-3xs font-bold px-2 py-0.5 rounded-full border border-amber-250 animate-pulse">
                                      Simulando
                                    </span>
                                  )}
                                </div>
                                <div className="text-3xs text-slate-400 font-medium mt-0.5">
                                  Cadastrado em {new Date(aluno.createdAt).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="text-slate-600 flex items-center gap-1 font-medium">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {aluno.email}
                              </span>
                              <span className="text-slate-500 flex items-center gap-1 font-medium">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {aluno.telefone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {aluno.tipo === "vip" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-3xs font-extrabold border border-emerald-100 uppercase tracking-wide">
                                <Sparkles className="h-3 w-3" />
                                Aluno VIP
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-3xs font-extrabold border border-slate-150 uppercase tracking-wide">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {aluno.tipo === "vip" && aluno.empresa ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                {aluno.empresa.nomeFantasia}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => handleSimularSessao(aluno.id)}
                                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isActive
                                    ? "bg-amber-600 border-amber-600 text-white"
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                                }`}
                                title="Simular navegação como este aluno no EAD"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Simular</span>
                              </button>

                              <button
                                onClick={() => handleDeleteAluno(aluno.id)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-100 transition-colors cursor-pointer"
                                title="Excluir aluno"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold italic bg-slate-50/20">
                        Nenhum aluno encontrado correspondente à pesquisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Lado Direito: Formulário de Cadastro */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5 sticky top-24">
            <div className="flex flex-col gap-1.5">
              <span className="text-3xs font-extrabold text-emerald-600 uppercase tracking-wider">Ações Administrativas</span>
              <h2 className="font-extrabold text-slate-800 text-sm">Cadastrar Novo Aluno</h2>
            </div>

            <form onSubmit={handleCreateAluno} className="flex flex-col gap-4">
              {/* Campo Nome */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nome do Aluno"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo E-mail */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="aluno@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo Telefone */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Telefone (Obrigatório)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="(99) 99999-9999"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tipo de Aluno */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Classificação de Acesso</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setTipo("normal")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tipo === "normal"
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Aluno Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("vip")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tipo === "vip"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Aluno VIP B2B
                  </button>
                </div>
              </div>

              {/* Selecionar Empresa (Apenas se VIP) */}
              {tipo === "vip" && (
                <div className="flex flex-col gap-1 animate-fadeIn">
                  <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Empresa Parceira</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <select
                      required
                      value={empresaId}
                      onChange={(e) => setEmpresaId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Selecione uma empresa...</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nomeFantasia}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Cadastrando..." : "Cadastrar Aluno"}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

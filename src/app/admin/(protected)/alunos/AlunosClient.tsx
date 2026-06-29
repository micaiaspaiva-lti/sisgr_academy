"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  BarChart3,
  Key,
  Pencil,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { 
  createAlunoAction, 
  updateAlunoAction,
  deleteAlunoAction, 
  simularSessaoAlunoAction, 
  limparSessaoSimuladaAction,
  aprovarSolicitacaoVipAction,
  rejeitarSolicitacaoVipAction
} from "@/app/actions";
import { logoutAdminAction } from "@/lib/auth-admin";

interface SearchableSelectProps {
  options: { id: string; nomeFantasia: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

function SearchableSelect({ options, value, onChange, placeholder = "Selecione...", className = "", icon }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);

  const filteredOptions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter(o => o.nomeFantasia.toLowerCase().includes(query));
  }, [search, options]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full text-left px-3.5 py-2 text-xs rounded-xl border border-slate-205 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer flex items-center justify-between shadow-3xs hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-slate-800">
          {icon}
          <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
            {selectedOption ? selectedOption.nomeFantasia : placeholder}
          </span>
        </span>
        <span className="text-slate-400 ml-1 text-[8px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-hidden flex flex-col animate-scaleUp">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              placeholder="Pesquisar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-205 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 rounded-lg bg-white font-medium"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-40">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors font-semibold border-b border-slate-50 last:border-0 ${
                    value === opt.id ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-700"
                  }`}
                >
                  {opt.nomeFantasia}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-slate-400 text-center font-medium italic">
                Nenhuma empresa encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

interface Solicitacao {
  id: string;
  alunoId: string;
  alunoNome: string;
  alunoEmail: string;
  cursoId: string;
  cursoTitulo: string;
  empresaNome: string;
  cnpj: string;
  createdAt: string;
}

interface AlunosClientProps {
  initialAlunos: Aluno[];
  empresas: Empresa[];
  activeSessionId: string | null;
  initialSolicitacoes: Solicitacao[];
}

export default function AlunosClient({ 
  initialAlunos, 
  empresas, 
  activeSessionId,
  initialSolicitacoes
}: AlunosClientProps) {
  const [alunosList, setAlunosList] = useState<Aluno[]>(initialAlunos);
  const [solicitacoesList, setSolicitacoesList] = useState<Solicitacao[]>(initialSolicitacoes);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);

  // Estados locais para empresas
  const [empresasList, setEmpresasList] = useState<Empresa[]>(empresas);

  // Pré-selecionar empresa por correspondência de nome
  const [selectedEmpresas, setSelectedEmpresas] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialSolicitacoes.forEach(s => {
      const matched = empresas.find(e => 
        e.nomeFantasia.toLowerCase().includes(s.empresaNome.toLowerCase()) ||
        s.empresaNome.toLowerCase().includes(e.nomeFantasia.toLowerCase())
      );
      initial[s.id] = matched ? matched.id : "";
    });
    return initial;
  });

  // Aprovar Solicitação VIP
  const handleAprovarSolicitacao = async (solicId: string) => {
    const empresaId = selectedEmpresas[solicId];
    if (!empresaId) {
      toast.error("Por favor, selecione uma empresa parceira para associar este aluno.");
      return;
    }

    toast.info("Processando aprovação...");
    try {
      const res = await aprovarSolicitacaoVipAction(solicId, empresaId);
      if (res.success) {
        toast.success("Solicitação aprovada! O aluno agora é VIP e está vinculado à empresa.");
        
        // Remove da lista de solicitações pendentes
        setSolicitacoesList(prev => prev.filter(s => s.id !== solicId));
        
        // Atualiza a lista de alunos para refletir a nova classificação
        const empresaObj = empresasList.find(e => e.id === empresaId);
        const solicObj = solicitacoesList.find(s => s.id === solicId);
        if (solicObj) {
          setAlunosList(prev => prev.map(a => {
            if (a.id === solicObj.alunoId) {
              return {
                ...a,
                tipo: "vip",
                empresa: empresaObj ? { id: empresaObj.id, nomeFantasia: empresaObj.nomeFantasia } : null
              };
            }
            return a;
          }));
        }
      } else {
        toast.error(res.error || "Erro ao aprovar solicitação.");
      }
    } catch (err) {
      toast.error("Falha ao aprovar.");
      console.error(err);
    }
  };

  // Rejeitar Solicitação VIP
  const handleRejeitarSolicitacao = async (solicId: string) => {
    if (!confirm("Deseja realmente rejeitar esta solicitação de acesso VIP?")) return;

    try {
      const res = await rejeitarSolicitacaoVipAction(solicId);
      if (res.success) {
        toast.success("Solicitação rejeitada com sucesso.");
        setSolicitacoesList(prev => prev.filter(s => s.id !== solicId));
      } else {
        toast.error(res.error || "Erro ao rejeitar solicitação.");
      }
    } catch (err) {
      toast.error("Falha ao rejeitar.");
      console.error(err);
    }
  };

  // Form State
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<"normal" | "vip">("normal");
  const [empresaId, setEmpresaId] = useState("");
  const [senha, setSenha] = useState("");

  // Funções de Edição
  const handleEditClick = (aluno: Aluno) => {
    setEditingAlunoId(aluno.id);
    setNome(aluno.nome);
    setEmail(aluno.email);
    setTelefone(aluno.telefone);
    setTipo(aluno.tipo);
    setEmpresaId(aluno.empresa?.id || "");
    setSenha(""); // Deixa vazio; só altera a senha se preenchido
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingAlunoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setTipo("normal");
    setEmpresaId("");
    setSenha("");
  };

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
      if (editingAlunoId) {
        // Modo Edição
        const res = await updateAlunoAction(
          editingAlunoId,
          nome,
          email,
          telefone,
          tipo,
          tipo === "vip" ? empresaId : null,
          senha.trim() ? senha : undefined
        );

        if (res.success && res.aluno) {
          const empresaObj = tipo === "vip" 
            ? empresas.find(e => e.id === empresaId) || null 
            : null;

          setAlunosList(prev => prev.map(a => {
            if (a.id === editingAlunoId) {
              return {
                ...a,
                nome: res.aluno.nome,
                email: res.aluno.email,
                telefone: res.aluno.telefone || "",
                tipo: (res.aluno.tipo || "normal") as "normal" | "vip",
                empresa: empresaObj ? { id: empresaObj.id, nomeFantasia: empresaObj.nomeFantasia } : null
              };
            }
            return a;
          }));

          toast.success("Aluno atualizado com sucesso!");
          handleCancelEdit();
        } else {
          toast.error(res.error || "Erro ao atualizar aluno.");
        }
      } else {
        // Modo Cadastro
        const res = await createAlunoAction(
          nome, 
          email, 
          telefone, 
          tipo, 
          tipo === "vip" ? empresaId : null,
          senha.trim() ? senha : undefined
        );
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
          setSenha("");
        } else {
          toast.error(res.error || "Erro ao cadastrar aluno.");
        }
      }
    } catch (err) {
      toast.error("Ocorreu uma falha no processamento.");
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

  const handleAdminLogout = async () => {
    const res = await logoutAdminAction();
    if (res.success) {
      toast.success("Sessão administrativa encerrada.");
      window.location.href = "/admin/login";
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
            href="/admin/suporte" 
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Suporte Técnico"
          >
            <MessageSquare className="h-4 w-4" />
            Suporte
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Ir para o EAD
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition-colors bg-white cursor-pointer"
            title="Sair do Painel Administrativo"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-none mx-auto w-full px-6 md:px-12 xl:px-16">
        {/* Lado Esquerdo: Listagem de Alunos & Solicitações */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {/* Solicitações de Acesso VIP */}
          {solicitacoesList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-slate-100 bg-purple-50/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600 p-1.5 rounded-lg text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Solicitações de Acesso VIP Pendentes</h3>
                    <p className="text-4xs font-bold text-purple-600 uppercase tracking-wider mt-0.5">Validação de Contrato</p>
                  </div>
                </div>
                <span className="text-3xs font-extrabold bg-purple-100 text-purple-750 px-2 py-0.5 rounded-full">
                  {solicitacoesList.length} pendentes
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 text-3xs font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4">Aluno / Curso</th>
                      <th className="px-6 py-4">Dados Informados (Aluno)</th>
                      <th className="px-6 py-4">Associar Empresa EAD</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitacoesList.map((solic) => (
                      <tr key={solic.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-extrabold text-slate-900">{solic.alunoNome}</span>
                            <span className="text-3xs text-slate-400 font-medium">{solic.alunoEmail}</span>
                            <span className="text-3xs font-bold text-purple-600 mt-1 uppercase tracking-wider bg-purple-50 self-start px-2 py-0.5 rounded-md">
                              {solic.cursoTitulo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-slate-700 font-bold flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              {solic.empresaNome}
                            </span>
                            <span className="text-slate-500 font-semibold pl-4.5">
                              CNPJ: {solic.cnpj}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <SearchableSelect
                            options={empresasList}
                            value={selectedEmpresas[solic.id] || ""}
                            onChange={(val) => setSelectedEmpresas(prev => ({
                              ...prev,
                              [solic.id]: val
                            }))}
                            placeholder="Selecione a empresa..."
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleAprovarSolicitacao(solic.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                              title="Aprovar e classificar aluno como VIP"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejeitarSolicitacao(solic.id)}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-650 hover:border-red-100 text-slate-500 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              title="Rejeitar solicitação"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listagem de Alunos */}
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
                                onClick={() => handleEditClick(aluno)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-emerald-600 hover:border-slate-350 transition-colors cursor-pointer"
                                title="Editar aluno"
                              >
                                <Pencil className="h-3.5 w-3.5" />
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
              <h2 className="font-extrabold text-slate-800 text-sm">
                {editingAlunoId ? "Editar Aluno" : "Cadastrar Novo Aluno"}
              </h2>
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

              {/* Campo Senha */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Se vazio, padrão será 123456"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
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
                  <SearchableSelect
                    options={empresasList}
                    value={empresaId}
                    onChange={setEmpresaId}
                    placeholder="Selecione uma empresa..."
                    icon={<Building2 className="h-3.5 w-3.5 text-slate-400" />}
                  />
                </div>
              )}

              {/* Botão de Envio */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingAlunoId ? <UserCheck className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSubmitting 
                    ? (editingAlunoId ? "Salvando..." : "Cadastrando...") 
                    : (editingAlunoId ? "Salvar Alterações" : "Cadastrar Aluno")}
                </button>
                
                {editingAlunoId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-2 border border-slate-300 hover:border-slate-405 text-slate-600 hover:bg-slate-50 transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

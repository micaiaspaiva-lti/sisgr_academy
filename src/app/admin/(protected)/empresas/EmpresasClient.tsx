"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, Users, Trash2, Search, LogOut, ArrowLeft, 
  Pencil, Plus, FileText, BarChart3, BookOpen
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { 
  createEmpresaAction, 
  updateEmpresaAction, 
  deleteEmpresaAction 
} from "@/app/actions";
import { logoutAdminAction } from "@/lib/auth-admin";

interface Empresa {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  createdAt: string;
  qtdColaboradores: number;
}

interface EmpresasClientProps {
  initialEmpresas: Empresa[];
}

export default function EmpresasClient({ initialEmpresas }: EmpresasClientProps) {
  const [empresasList, setEmpresasList] = useState<Empresa[]>(initialEmpresas);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);

  // Form State
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");

  const handleAdminLogout = async () => {
    const res = await logoutAdminAction();
    if (res.success) {
      toast.success("Sessão administrativa encerrada.");
      window.location.href = "/admin/login";
    }
  };

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length > 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length > 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    if (digits.length > 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    return formatted.slice(0, 18);
  };

  // Filtragem local
  const filteredEmpresas = useMemo(() => {
    if (!search.trim()) return empresasList;
    const query = search.toLowerCase().trim();
    return empresasList.filter(e => 
      e.nomeFantasia.toLowerCase().includes(query) || 
      e.cnpj.includes(query)
    );
  }, [search, empresasList]);

  // Editar Click
  const handleEditClick = (emp: Empresa) => {
    setEditingEmpresaId(emp.id);
    setNomeFantasia(emp.nomeFantasia);
    // Formata o CNPJ salvo no banco (que está cru com 14 dígitos)
    setCnpj(formatCNPJ(emp.cnpj));
  };

  // Cancelar Edição
  const handleCancelEdit = () => {
    setEditingEmpresaId(null);
    setNomeFantasia("");
    setCnpj("");
  };

  // Criar ou Atualizar Empresa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim() || !cnpj.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      toast.error("O CNPJ deve conter exatamente 14 dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEmpresaId) {
        // Modo Edição
        const res = await updateEmpresaAction(editingEmpresaId, nomeFantasia, cleanCnpj);
        if (res.success && res.empresa) {
          toast.success("Empresa atualizada com sucesso!");
          setEmpresasList(prev => prev.map(item => {
            if (item.id === editingEmpresaId) {
              return {
                ...item,
                nomeFantasia: res.empresa!.nomeFantasia,
                cnpj: res.empresa!.cnpj,
              };
            }
            return item;
          }));
          handleCancelEdit();
        } else {
          toast.error(res.error || "Erro ao atualizar empresa.");
        }
      } else {
        // Modo Criação
        const res = await createEmpresaAction(nomeFantasia, cleanCnpj);
        if (res.success && res.empresa) {
          toast.success("Empresa cadastrada com sucesso!");
          const newEmpresa: Empresa = {
            id: res.empresa.id,
            nomeFantasia: res.empresa.nomeFantasia,
            cnpj: res.empresa.cnpj,
            createdAt: new Date().toISOString(),
            qtdColaboradores: 0,
          };
          setEmpresasList(prev => [newEmpresa, ...prev]);
          handleCancelEdit();
        } else {
          toast.error(res.error || "Erro ao cadastrar empresa.");
        }
      }
    } catch (error) {
      toast.error("Falha ao salvar dados.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir Empresa
  const handleDelete = async (emp: Empresa) => {
    if (emp.qtdColaboradores > 0) {
      if (!confirm(`A empresa "${emp.nomeFantasia}" possui ${emp.qtdColaboradores} alunos vinculados. Ao excluí-la, o vínculo de todos os colaboradores será desfeito e eles deixarão de acessar os cursos VIP. Deseja continuar?`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja realmente excluir a empresa "${emp.nomeFantasia}"?`)) {
        return;
      }
    }

    try {
      const res = await deleteEmpresaAction(emp.id);
      if (res.success) {
        toast.success("Empresa excluída com sucesso.");
        setEmpresasList(prev => prev.filter(item => item.id !== emp.id));
        if (editingEmpresaId === emp.id) {
          handleCancelEdit();
        }
      } else {
        toast.error(res.error || "Erro ao excluir empresa.");
      }
    } catch (error) {
      toast.error("Falha ao excluir.");
      console.error(error);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Header Admin */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/alunos" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Voltar para Alunos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center hover:opacity-90 shrink-0">
            <img src="/logo.png" alt="SISGR Academy" className="h-8 md:h-12 w-auto object-contain flex-shrink-0" />
          </Link>
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
            Empresas B2B
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
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition-colors bg-white cursor-pointer"
            title="Sair do Painel"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-none mx-auto w-full px-6 md:px-12 xl:px-16">
        
        {/* Lado Esquerdo: Lista de Empresas */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Cabeçalho da Listagem */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm">Empresas Parceiras</h2>
                  <p className="text-3xs font-bold text-purple-600 uppercase tracking-wider mt-0.5">Parcerias e Acessos Corporativos</p>
                </div>
              </div>
              
              {/* Barra de Pesquisa */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-205 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-purple-500/10 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Tabela de Empresas */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="bg-slate-55/60 border-b border-slate-150 text-slate-400 text-3xs font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">Nome da Empresa</th>
                    <th className="px-6 py-4">CNPJ</th>
                    <th className="px-6 py-4">Colaboradores</th>
                    <th className="px-6 py-4">Data Cadastro</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmpresas.length > 0 ? (
                    filteredEmpresas.map((emp) => {
                      const formattedCnpj = emp.cnpj.replace(
                        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                        "$1.$2.$3/$4-$5"
                      );
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{emp.nomeFantasia}</td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-500">{formattedCnpj}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-3xs font-bold px-2 py-0.5 rounded-full ring-1 ring-purple-600/10">
                              <Users className="h-3 w-3" />
                              {emp.qtdColaboradores}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                            {new Date(emp.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleEditClick(emp)}
                                className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 bg-white rounded-lg transition-all cursor-pointer shadow-3xs"
                                title="Editar dados da empresa"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(emp)}
                                className="p-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-650 bg-white rounded-lg transition-all cursor-pointer shadow-3xs"
                                title="Excluir empresa"
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
                        Nenhuma empresa encontrada correspondente à pesquisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>

        {/* Lado Direito: Formulário de Cadastro/Edição */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5 sticky top-24">
            <div className="flex flex-col gap-1.5">
              <span className="text-3xs font-extrabold text-purple-600 uppercase tracking-wider">Ações Administrativas</span>
              <h2 className="font-extrabold text-slate-800 text-sm">
                {editingEmpresaId ? "Editar Empresa" : "Cadastrar Nova Empresa"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Campo Nome Fantasia */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Nome Fantasia / Razão Social</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: EcoRecicla S/A"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Campo CNPJ */}
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingEmpresaId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSubmitting 
                    ? (editingEmpresaId ? "Salvando..." : "Cadastrando...") 
                    : (editingEmpresaId ? "Salvar Alterações" : "Cadastrar Empresa")}
                </button>

                {editingEmpresaId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-2 border border-slate-300 hover:border-slate-400 text-slate-600 hover:bg-slate-50 transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
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

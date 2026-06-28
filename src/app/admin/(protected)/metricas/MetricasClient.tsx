"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Users, Clock, 
  Award, TrendingUp, Database, RefreshCw, CheckCircle2, LogOut 
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { logoutAdminAction } from "@/lib/auth-admin";

interface EmployeeMetric {
  id: string;
  nome: string;
  email: string;
  tempoAssistido: string;
  progresso: number;
  notaQuiz: number;
  status: "Ativo" | "Concluído";
}

interface CompanyMetrics {
  totalColaboradores: number;
  horasAssistidas: number;
  mediaNotas: number;
  conclusaoGeral: number;
  colaboradores: EmployeeMetric[];
}

interface MetricasClientProps {
  companies: { id: string; nome: string }[];
  metricsData: Record<string, CompanyMetrics>;
}

export default function MetricasClient({ companies, metricsData }: MetricasClientProps) {
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.id || "");
  const [cacheStatus, setCacheStatus] = useState<"hit" | "miss">("hit");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentMetrics = metricsData[selectedCompany] || {
    totalColaboradores: 0,
    horasAssistidas: 0,
    mediaNotas: 0,
    conclusaoGeral: 0,
    colaboradores: []
  };

  const handleRefreshCache = () => {
    setIsRefreshing(true);
    setCacheStatus("miss");
    toast.info("Limpando cache do Redis e recalculando métricas...");
    
    // Simula atualização do cache Redis
    setTimeout(() => {
      setIsRefreshing(false);
      setCacheStatus("hit");
      toast.success("Cache Redis atualizado com sucesso!");
    }, 1500);
  };

  const handleAdminLogout = async () => {
    const res = await logoutAdminAction();
    if (res.success) {
      toast.success("Sessão administrativa encerrada.");
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Header Admin */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/cursos" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Voltar ao CMS">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="hover:opacity-90 flex items-center">
            <img src="/logo.png" alt="SISGR Academy" className="h-12 w-auto" />
          </Link>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            Relatórios B2B
          </span>
        </div>

        {/* Cache Indicator */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-3xs font-bold ring-1 ring-inset ${
            cacheStatus === "hit" 
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
              : "bg-amber-50 text-amber-700 ring-amber-600/20"
          }`}>
            <Database className="h-3 w-3" />
            {cacheStatus === "hit" ? "CACHE REDIS: HIT" : "CACHE REDIS: MISS / REVALIDANDO"}
          </span>
          <button
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-all bg-white cursor-pointer"
            title="Atualizar Métricas"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

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

      {/* Conteúdo Principal */}
      <main className="flex-grow py-10 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Filtro por Empresa */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black text-slate-900">Métricas Corporativas</h1>
            <p className="text-xs text-slate-500">Filtrar taxa de engajamento e conclusão de colaboradores por parceiro.</p>
          </div>
          
          {companies.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="company-select" className="text-xs font-bold text-slate-600 shrink-0">Empresa:</label>
              <select
                id="company-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        {companies.length === 0 ? (
          <section className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md shadow-sm">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 text-sm mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-xs text-slate-500">Redefina o banco de dados para os valores padrão no Painel Admin para gerar as empresas e alunos de teste.</p>
            </div>
          </section>
        ) : (
          <>
            {/* Grid de KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Alunos */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-slate-400">
                  <Users className="h-5 w-5" />
                  <span className="text-3xs font-bold uppercase tracking-wider">Total</span>
                </div>
                <span className="text-2xl font-black text-slate-900">{currentMetrics.totalColaboradores}</span>
                <span className="text-xs text-slate-500 font-semibold">Alunos Matriculados</span>
              </div>

              {/* Card 2: Horas */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-slate-400">
                  <Clock className="h-5 w-5" />
                  <span className="text-3xs font-bold uppercase tracking-wider">Tempo</span>
                </div>
                <span className="text-2xl font-black text-slate-900">{currentMetrics.horasAssistidas}h</span>
                <span className="text-xs text-slate-500 font-semibold">Horas de Vídeo Assistidas</span>
              </div>

              {/* Card 3: Aproveitamento */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-slate-400">
                  <Award className="h-5 w-5 text-purple-650" />
                  <span className="text-3xs font-bold uppercase tracking-wider">Aproveitamento</span>
                </div>
                <span className="text-2xl font-black text-purple-650">{currentMetrics.mediaNotas}%</span>
                <span className="text-xs text-slate-500 font-semibold">Média Geral nos Quizzes</span>
              </div>

              {/* Card 4: Taxa Conclusão */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-slate-400">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="text-3xs font-bold uppercase tracking-wider">Taxa</span>
                </div>
                <span className="text-2xl font-black text-emerald-600">{currentMetrics.conclusaoGeral}%</span>
                <span className="text-xs text-slate-500 font-semibold">Conclusão de Cursos</span>
              </div>

            </section>

            {/* Tabela de Colaboradores */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-extrabold text-slate-800 text-sm">Progresso Detalhado</h3>
                <span className="text-3xs text-slate-400 uppercase font-black tracking-wider">Atualizado a cada 10 min</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-3xs border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Colaborador</th>
                      <th className="px-6 py-3">Tempo Assistido</th>
                      <th className="px-6 py-3">Média Quizzes</th>
                      <th className="px-6 py-3">Progresso Geral</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentMetrics.colaboradores.map((colab) => (
                      <tr key={colab.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{colab.nome}</span>
                            <span className="text-slate-400 text-3xs">{colab.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{colab.tempoAssistido}</td>
                        <td className="px-6 py-4 font-semibold text-purple-600">{colab.notaQuiz}%</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 w-40">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-1.5 rounded-full" 
                                style={{ width: `${colab.progresso}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-3xs">{colab.progresso}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-3xs font-extrabold ring-1 ring-inset ${
                            colab.status === "Concluído"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-blue-50 text-blue-700 ring-blue-600/20"
                          }`}>
                            {colab.status === "Concluído" && <CheckCircle2 className="h-3 w-3" />}
                            {colab.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {currentMetrics.colaboradores.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                          Nenhum colaborador matriculado nesta empresa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}

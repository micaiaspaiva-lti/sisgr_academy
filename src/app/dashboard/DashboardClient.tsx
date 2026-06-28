"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Play, BookOpen, Award, CheckCircle2, Lock, 
  Search, SlidersHorizontal, BookMarked, GraduationCap, 
  Sparkles, ShieldAlert 
} from "lucide-react";
import { UserSession } from "@/lib/auth";

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
  proximaAulaId: string | null;
  modulos: any[];
}

interface DashboardClientProps {
  session: UserSession;
  courses: Course[];
}

export default function DashboardClient({ session, courses }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "meus" | "disponiveis" | "vip">("todos");

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
    const meus = courses.filter(c => c.progresso > 0);
    const disponiveis = courses.filter(c => c.progresso === 0 && !c.isLocked);
    const vip = courses.filter(c => c.isLocked);
    
    return {
      todos: courses,
      meus,
      disponiveis,
      vip
    };
  }, [courses]);

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
                      <a
                        href="https://sisgr.com.br/contato"
                        target="_blank"
                        className="flex-grow inline-flex items-center justify-center gap-2 rounded-xl bg-slate-150 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-purple-750 border border-purple-200/30 transition-all text-center"
                        title="Fale conosco para liberar o conteúdo VIP"
                      >
                        <Lock className="h-3.5 w-3.5 text-purple-650" />
                        Liberar Acesso VIP
                      </a>
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
    </div>
  );
}

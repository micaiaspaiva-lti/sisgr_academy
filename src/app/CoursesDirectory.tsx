"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface Lesson {
  id: string;
  moduloId: string;
  titulo: string;
  descricaoApoio: string | null;
  videoUrl: string;
  imagemCapa: string | null;
  demonstrative: boolean;
  ativo: boolean;
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
  descricao: string | null;
  imagemCapa: string | null;
  ativo: boolean;
  tipo: string;
  destaque: boolean;
  ordem: number;
  modulos: Module[];
}

interface CoursesDirectoryProps {
  courses: Course[];
}

const ITEMS_PER_PAGE = 20;

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
      if (a.imagemCapa) {
        return a.imagemCapa;
      }
    }
  }
  for (const m of course.modulos || []) {
    for (const a of m.aulas || []) {
      const ytid = getYouTubeVideoId(a.videoUrl);
      if (ytid) {
        return `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
      }
    }
  }
  return course.imagemCapa || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop";
}

export default function CoursesDirectory({ courses }: CoursesDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"todos" | "publico" | "vip">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const directoryRef = useRef<HTMLDivElement>(null);

  // Filtra os cursos com base na busca e filtros selecionados
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.descricao || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === "todos" || course.tipo === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [courses, searchQuery, selectedFilter]);

  // Calcula paginação
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  
  // Garante que a página atual seja válida caso o filtro mude
  const activePage = Math.min(currentPage, totalPages);

  const paginatedCourses = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCourses, activePage]);

  // Handler para mudança de página com scroll suave
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={directoryRef} className="flex flex-col gap-8 w-full scroll-mt-24">
      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-5 md:px-6 shadow-sm">
        
        {/* Barra de Pesquisa */}
        <div className="relative flex-grow max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por curso, tema ou descrição..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reseta para primeira página ao buscar
            }}
            className="w-full rounded-2xl border border-slate-205 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedFilter("todos");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-3xs font-extrabold uppercase tracking-wider cursor-pointer transition-all border ${
              selectedFilter === "todos"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter("publico");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-3xs font-extrabold uppercase tracking-wider cursor-pointer transition-all border ${
              selectedFilter === "publico"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
            }`}
          >
            Públicos
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter("vip");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-3xs font-extrabold uppercase tracking-wider cursor-pointer transition-all border ${
              selectedFilter === "vip"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
            }`}
          >
            VIP
          </button>
        </div>

      </div>

      {/* Grid de Cursos */}
      {paginatedCourses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xl shadow-emerald-500/3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-video">
                <img
                  src={getCourseImage(course)}
                  alt={course.titulo}
                  className="object-cover w-full h-full"
                />
                {course.tipo === "vip" && (
                  <span className="absolute top-3 right-3 inline-flex items-center rounded-md bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-xs font-black text-white uppercase tracking-wider shadow-md">
                    VIP
                  </span>
                )}
                {course.destaque && (
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-md bg-purple-600/95 backdrop-blur-xs px-2.5 py-1 text-xs font-black text-white uppercase tracking-wider shadow-md">
                    ★ Destaque
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-extrabold text-slate-950 line-clamp-1" title={course.titulo}>
                    {course.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-semibold">
                    {course.descricao || "Sem descrição disponível."}
                  </p>
                </div>
                <div className="flex gap-4 items-center border-t border-slate-200 pt-4">
                  <Link
                    href="/dashboard"
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 transition-all"
                    title={`Acessar curso: ${course.titulo}`}
                  >
                    Acessar Curso
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
            <BookOpen className="h-6 w-6 text-slate-450" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">Nenhum curso encontrado</h3>
          <p className="text-xs text-slate-550 max-w-xs font-semibold">
            Não encontramos correspondência para "{searchQuery}". Tente usar palavras-chave mais genéricas.
          </p>
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-6 border-t border-slate-200">
          
          {/* Botão Anterior */}
          <button
            type="button"
            disabled={activePage === 1}
            onClick={() => handlePageChange(activePage - 1)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-250 bg-white text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {/* Números das Páginas */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePage === pageNum
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10 font-black"
                      : "border border-slate-200 bg-white text-slate-650 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Botão Próximo */}
          <button
            type="button"
            disabled={activePage === totalPages}
            onClick={() => handlePageChange(activePage + 1)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-250 bg-white text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>

        </div>
      )}
    </div>
  );
}

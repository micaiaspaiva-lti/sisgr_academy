"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedCourseItem {
  id: string;
  titulo: string;
  descricao: string | null;
  imagemCapa: string | null;
  tipo: string;
  demoLesson?: {
    id: string;
  };
}

interface HeroCarouselProps {
  courses: FeaturedCourseItem[];
}

export default function HeroCarousel({ courses }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicia / para temporizador de auto-play
  useEffect(() => {
    if (courses.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % courses.length);
    }, 6000); // Muda a cada 6 segundos

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [courses.length, isHovered]);

  if (!courses || courses.length === 0) return null;

  const currentCourse = courses[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % courses.length);
  };

  return (
    <section 
      className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-white w-full border-b border-slate-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft Green Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-50/30 via-emerald-50/10 to-white pointer-events-none" />

      {/* Grid Content Wrapper */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
        
        {/* Lado Esquerdo: Textos do Slide Atual com transição suave */}
        <div 
          key={`text-${currentCourse.id}`} 
          className="flex-1 flex flex-col gap-6 text-center md:text-left animate-in fade-in slide-in-from-left-4 duration-500"
        >
          {currentCourse.tipo === "vip" ? (
            <span className="inline-flex max-w-fit mx-auto md:mx-0 items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10">
              Curso VIP (Parceiros B2B)
            </span>
          ) : (
            <span className="inline-flex max-w-fit mx-auto md:mx-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              Curso em Destaque
            </span>
          )}
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 leading-tight tracking-tight min-h-[96px] md:min-h-[144px]">
            {currentCourse.titulo}
          </h1>
          
          <p className="text-base md:text-lg text-slate-605 leading-relaxed max-w-xl mx-auto md:mx-0 font-medium min-h-[72px]">
            {currentCourse.descricao || "Domine novos conhecimentos e qualifique sua equipe de forma 100% prática."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-2">
            {currentCourse.demoLesson && (
              <Link
                href={`/demonstrativo/${currentCourse.demoLesson.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 font-bold text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:shadow-2xl transform hover:-translate-y-0.5 transition-all cursor-pointer"
                title="Assistir Aula Gratuita"
              >
                <Play className="h-5 w-5 fill-current" />
                Aula Gratuita
              </Link>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-205 bg-white px-8 py-3.5 font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transform hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Acessar Área do Aluno"
            >
              Área do Aluno
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        
        {/* Lado Direito: Imagem e link de preview do Slide Atual com transição suave */}
        <div 
          key={`img-${currentCourse.id}`}
          className="flex-1 w-full max-w-md md:max-w-none relative aspect-video rounded-3xl overflow-hidden bg-slate-800 border-[10px] border-white shadow-2xl group animate-in fade-in slide-in-from-right-4 duration-500"
        >
          <img
            src={currentCourse.imagemCapa || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop"}
            alt={currentCourse.titulo}
            className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-550"
          />
          {currentCourse.demoLesson && (
            <Link 
              href={`/demonstrativo/${currentCourse.demoLesson.id}`}
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer"
              title="Assistir Aula Demonstrativa"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300">
                <Play className="h-6 w-6 fill-current translate-x-0.5" />
              </div>
            </Link>
          )}
        </div>

      </div>

      {/* Controles de Navegação Lateral (Visíveis ao pairar ou em dispositivos móveis se houver múltiplos slides) */}
      {courses.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            style={{ opacity: isHovered ? 1 : 0 }}
            title="Slide Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            style={{ opacity: isHovered ? 1 : 0 }}
            title="Próximo Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Indicadores de Slide (Dots) */}
      {courses.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {courses.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                activeIndex === idx 
                  ? "w-8 bg-emerald-600 shadow-md shadow-emerald-500/20" 
                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

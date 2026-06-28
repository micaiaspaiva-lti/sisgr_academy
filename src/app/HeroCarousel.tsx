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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % courses.length);
  };

  return (
    <section 
      className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-white w-full border-b border-slate-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft Green Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-50/30 via-emerald-50/10 to-white pointer-events-none" />

      {/* Slider Window Container (Wider layout matching the page width) */}
      <div className="max-w-[1600px] mx-auto relative z-10 w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${activeIndex * (100 / courses.length)}%)`,
            width: `${courses.length * 100}%`
          }}
        >
          {courses.map((course) => {
            const demoLesson = course.demoLesson;
            return (
              <div 
                key={course.id} 
                className="shrink-0 grid md:grid-cols-12 gap-12 items-center min-h-[380px] md:min-h-[340px] pb-4 px-6 md:px-12"
                style={{ width: `${100 / courses.length}%` }}
              >
                {/* Lado Esquerdo: Textos com min-heights calculados para tamanho fixo */}
                <div className="md:col-span-6 flex flex-col gap-5 text-center md:text-left justify-center h-full">
                  <div>
                    {course.tipo === "vip" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10 mb-3">
                        Curso VIP (Parceiros B2B)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 mb-3">
                        Curso em Destaque
                      </span>
                    )}
                    
                    {/* Altura mínima rígida para o título para evitar redimensionamentos de layout */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 leading-tight tracking-tight line-clamp-2 min-h-[72px] md:min-h-[96px] lg:min-h-[120px]">
                      {course.titulo}
                    </h1>
                  </div>
                  
                  {/* Altura mínima rígida para a descrição */}
                  <p className="text-xs md:text-sm text-slate-550 leading-relaxed font-semibold line-clamp-3 min-h-[54px] md:min-h-[60px]">
                    {course.descricao || "Domine novos conhecimentos e qualifique sua equipe de forma 100% prática."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mt-2">
                    {demoLesson && (
                      <Link
                        href={`/demonstrativo/${demoLesson.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/15 hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
                        title="Assistir Aula Gratuita"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Aula Gratuita
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-205 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transform hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
                      title="Acessar Área do Aluno"
                    >
                      Área do Aluno
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Lado Direito: Imagem de Capa (Aspect Ratio fixo de vídeo) */}
                <div className="md:col-span-6 w-full relative aspect-video rounded-3xl overflow-hidden bg-slate-800 border-[8px] border-white shadow-xl group">
                  <img
                    src={course.imagemCapa || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop"}
                    alt={course.titulo}
                    className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-500"
                  />
                  {demoLesson && (
                    <Link 
                      href={`/demonstrativo/${demoLesson.id}`}
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer"
                      title="Assistir Aula Demonstrativa"
                    >
                      <div className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transform scale-95 group-hover:scale-100 transition-all duration-300">
                        <Play className="h-5 w-5 fill-current translate-x-0.5" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controles de Navegação Lateral (Overlay) */}
      {courses.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-all cursor-pointer opacity-0 md:group-hover:opacity-100"
            style={{ opacity: isHovered ? 1 : 0 }}
            title="Slide Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-all cursor-pointer opacity-0 md:group-hover:opacity-100"
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

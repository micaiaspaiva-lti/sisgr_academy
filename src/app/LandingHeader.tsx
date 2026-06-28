"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, BookOpen, ExternalLink, X, Building2 } from "lucide-react";

export default function LandingHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all h-20 flex items-center">
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
              {/* object-contain e flex-shrink-0 impedem qualquer deformação/esticamento do logo */}
              <img 
                src="/logo.png" 
                alt="SISGR Academy" 
                className="h-8 md:h-12 w-auto object-contain flex-shrink-0" 
              />
            </Link>
            
            {/* Navegação de Informações no Desktop (Versão em Pílula Destaque) */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="hover:bg-emerald-100 hover:text-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 text-emerald-750 border border-emerald-200 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider"
              >
                <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                O que é o SISGR?
              </button>
              <a 
                href="https://sisgr.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-extrabold text-[11px] text-slate-500 uppercase tracking-wider"
              >
                Conhecer ERP SISGR
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Pílula "O que é o SISGR?" visível também no mobile para máxima clareza */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-emerald-100 transition-all shrink-0 cursor-pointer"
            >
              <Info className="h-3 w-3 text-emerald-600 shrink-0" />
              Sobre o SISGR
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-205 bg-white px-3 py-1.5 md:px-5 md:py-2.5 text-[10px] md:text-sm font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shrink-0"
              title="Acessar Área do Aluno"
            >
              Área do Aluno
            </Link>
            
            {/* Painel Admin ocultado no mobile para despoluir e evitar quebras */}
            <Link
              href="/admin/cursos"
              className="hidden md:inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 shrink-0"
              title="Painel Admin"
            >
              Painel Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Glassmorphic Interativo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content Card */}
          <div className="relative bg-white/95 rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 max-w-2xl w-full z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SISGR Academy" className="h-10 w-auto object-contain" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l border-slate-350 pl-3">Apresentação</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* ERP SISGR */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">O ERP SISGR</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    O <strong>SISGR</strong> é um ERP Cloud completo e inovador criado especificamente para facilitar os processos operacionais de <strong>Gerenciadoras de Resíduos</strong>. Ele automatiza agendamentos de coletas, emissão de manifestos e transportes de resíduos com total conformidade ambiental.
                  </p>
                </div>

                {/* SISGR Academy */}
                <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <BookOpen className="h-5 w-5" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">SISGR Academy</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    O <strong>SISGR Academy</strong> é o portal de capacitação oficial. Preparamos profissionais de gestão ambiental e treinamos colaboradores das empresas gerenciadoras que utilizam o ERP SISGR, garantindo máxima eficiência nos fluxos e emissão de certificados válidos.
                  </p>
                </div>
              </div>

              {/* Ações / Links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 justify-end">
                <a
                  href="https://sisgr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all cursor-pointer font-bold"
                >
                  Conhecer site do SISGR
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-250 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Voltar aos Cursos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

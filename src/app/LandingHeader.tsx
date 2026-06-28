"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, BookOpen, ExternalLink, X, Building2 } from "lucide-react";

export default function LandingHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="SISGR Academy" className="h-14 w-auto" />
            </Link>
            
            {/* Navegação de Informações */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0 font-bold"
              >
                <Info className="h-3.5 w-3.5 text-slate-400" />
                Sobre o SISGR & Academy
              </button>
              <a 
                href="https://sisgr.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-bold"
              >
                Conhecer ERP SISGR
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão Mobile para o Sobre */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 transition-all"
              title="Sobre o SISGR"
            >
              <Info className="h-4 w-4" />
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
              title="Acessar Área do Aluno"
            >
              Área do Aluno
            </Link>
            <Link
              href="/admin/cursos"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10"
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
                <img src="/logo.png" alt="SISGR Academy" className="h-10 w-auto" />
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

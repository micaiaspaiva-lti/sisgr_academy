import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { certificados } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  ShieldCheck, ShieldAlert, Award, 
  Calendar, User, BookOpen, Building, 
  CheckCircle2, Search, ArrowLeft 
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Validador de Certificados - SISGR Academy",
  description: "Verifique a autenticidade e validade dos certificados emitidos pela SISGR Academy.",
};

export default async function ValidarCertificadoPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const codigo = typeof resolvedParams.codigo === "string" ? resolvedParams.codigo.trim() : "";

  let certData = null;
  let errorMsg = null;

  if (codigo) {
    try {
      const cert = await db.query.certificados.findFirst({
        where: eq(certificados.codigoAutenticidade, codigo),
        with: {
          aluno: {
            with: {
              empresa: true
            }
          },
          curso: true
        }
      });

      if (cert) {
        certData = cert;
      } else {
        errorMsg = "Código de autenticidade inválido ou certificado não encontrado em nossos registros.";
      }
    } catch (error) {
      console.error("Erro ao validar certificado:", error);
      errorMsg = "Erro interno ao validar o certificado. Tente novamente mais tarde.";
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 antialiased font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center border-b border-slate-100 pb-5">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-emerald-600">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              SISGR Academy
            </h1>
            <p className="text-4xs font-extrabold text-emerald-600 uppercase tracking-widest mt-1">
              Validador de Certificados Oficial
            </p>
          </div>
        </div>

        {/* State A: Result Screen */}
        {codigo ? (
          <div className="flex flex-col gap-5">
            {certData ? (
              /* Success Card */
              <div className="flex flex-col gap-5">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-emerald-800 text-sm">
                      Certificado Autêntico & Válido
                    </h3>
                    <p className="text-xs text-emerald-700/90 leading-relaxed mt-0.5">
                      Este certificado foi validado com sucesso e corresponde a um registro oficial emitido por nossa plataforma.
                    </p>
                  </div>
                </div>

                {/* Details List */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Aluno</span>
                      <span className="text-sm font-bold text-slate-800">{certData.aluno.nome}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Curso Concluído</span>
                      <span className="text-sm font-bold text-slate-800">{certData.curso.titulo}</span>
                    </div>
                  </div>

                  {certData.aluno.empresa && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Empresa</span>
                        <span className="text-sm font-bold text-slate-800">{certData.aluno.empresa.nomeFantasia}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Data de Emissão</span>
                      <span className="text-sm font-bold text-slate-800">
                        {certData.emitidoEm.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-medium">
                  Código de Autenticação: <span className="font-mono font-bold text-slate-600">{certData.codigoAutenticidade}</span>
                </div>
              </div>
            ) : (
              /* Error Card */
              <div className="flex flex-col gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-3 text-left">
                  <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-red-800 text-sm">
                      Certificado não Validado
                    </h3>
                    <p className="text-xs text-red-700 leading-relaxed mt-1">
                      {errorMsg}
                    </p>
                  </div>
                </div>
                <p className="text-2xs text-slate-400 text-center font-medium leading-relaxed px-4">
                  Por favor, certifique-se de que o código digitado está correto ou tente escanear o QR Code impresso no certificado original.
                </p>
              </div>
            )}

            <Link
              href="/validar"
              className="mt-2 w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Verificar Outro Código
            </Link>
          </div>
        ) : (
          /* State B: Search Form */
          <form action="/validar" method="GET" className="flex flex-col gap-4">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed text-center px-2">
              Insira o código de autenticação impresso no rodapé do certificado para validar sua emissão.
            </p>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Código de Autenticação</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="codigo"
                  required
                  placeholder="Ex: SISGR-1A2B3C4D"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl py-3.5 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Validar Certificado
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ← Ir para o Dashboard do Aluno
          </Link>
        </div>
      </div>
    </div>
  );
}

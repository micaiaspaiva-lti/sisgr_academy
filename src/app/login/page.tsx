"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, LogIn, GraduationCap, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { alunoLoginAction } from "@/app/actions";

export default function AlunoLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await alunoLoginAction(email, password);
      if (res.success) {
        toast.success("Login efetuado com sucesso!");
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "E-mail ou senha incorretos.");
        toast.error(res.error || "Falha na autenticação.");
      }
    } catch (err) {
      setError("Erro de conexão no servidor. Tente novamente.");
      toast.error("Erro ao conectar.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4 antialiased font-sans">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-duet-brand-light/40 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-duet-brand-light/20 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col gap-6 relative z-10">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-duet-brand-light p-3.5 rounded-2xl border border-duet-brand/10 text-duet-brand">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">EAD SISGR Academy</h1>
            <p className="text-3xs font-extrabold text-duet-brand uppercase tracking-widest mt-1">Portal do Aluno & Visitante</p>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-750 text-xs px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="aluno@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-duet-brand/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-duet-brand/10 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-duet-brand/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-duet-brand/10 transition-all font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-duet-brand hover:bg-duet-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Acessar Plataforma"}
          </button>
        </form>

        {/* Voltar para o Site Principal */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            ← Voltar ao site principal
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { loginAdminAction } from "@/lib/auth-admin";

export default function AdminLoginPage() {
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
      const res = await loginAdminAction(email, password);
      if (res.success) {
        toast.success("Autenticação realizada com sucesso!");
        router.push("/admin/cursos");
        router.refresh();
      } else {
        setError(res.error || "Credenciais inválidas.");
        toast.error(res.error || "Falha ao entrar no painel.");
      }
    } catch (err) {
      setError("Ocorreu um erro no servidor. Tente novamente.");
      toast.error("Erro ao conectar com o servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 to-slate-950 flex items-center justify-center p-4 antialiased font-sans">
      {/* Container Principal Glassmorphic */}
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Detalhe de Luz Decorativo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-duet-brand/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-duet-brand/5 blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-duet-brand/10 p-3 rounded-2xl border border-duet-brand/20 text-duet-brand shadow-inner">
            <ShieldCheck className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">SISGR Academy</h1>
            <p className="text-3xs font-extrabold text-duet-brand uppercase tracking-widest mt-1">Acesso Restrito ao Administrador</p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Input Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">E-mail Administrativo</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-duet-brand/50 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:ring-4 focus:ring-duet-brand/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Input Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-duet-brand/50 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:ring-4 focus:ring-duet-brand/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-duet-brand hover:bg-duet-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Acessar Painel"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-3xs text-slate-600 font-bold border-t border-slate-850 pt-5 mt-2 uppercase tracking-wider">
          Protegido por Criptografia SSL & JWT
        </div>
      </div>
    </div>
  );
}

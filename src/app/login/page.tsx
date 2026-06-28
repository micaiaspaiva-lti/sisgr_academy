"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, LogIn, GraduationCap, AlertCircle, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { alunoLoginAction, alunoRegisterAction } from "@/app/actions";

export default function AlunoLoginPage() {
  const [activeMode, setActiveMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    setTelefone(formatted.slice(0, 15));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeMode === "login") {
      if (!email.trim() || !password.trim()) {
        setError("Por favor, preencha todos os campos.");
        return;
      }
      setLoading(true);
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
    } else {
      if (!nome.trim() || !email.trim() || !password.trim()) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      setLoading(true);
      try {
        const res = await alunoRegisterAction(nome, email, password, telefone);
        if (res.success) {
          toast.success("Conta criada e login efetuado com sucesso!");
          router.push("/dashboard");
          router.refresh();
        } else {
          setError(res.error || "Erro ao criar conta.");
          toast.error(res.error || "Falha no cadastro.");
        }
      } catch (err) {
        setError("Erro de conexão no servidor. Tente novamente.");
        toast.error("Erro ao conectar.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4 antialiased font-sans">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/20 blur-3xl"></div>
      </div>

      {/* Login / Register Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col gap-6 relative z-10">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-emerald-600">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">EAD SISGR Academy</h1>
            <p className="text-3xs font-extrabold text-emerald-600 uppercase tracking-widest mt-1">Portal do Aluno & Visitante</p>
          </div>
        </div>

        {/* Alternância de Abas (Entrar / Cadastrar) */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveMode("login");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeMode === "login"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode("register");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeMode === "register"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-750 text-xs px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome Completo (Apenas no Modo Cadastro) */}
          {activeMode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                />
              </div>
            </div>
          )}

          {/* E-mail */}
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
                className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Telefone (Apenas no Modo Cadastro - Opcional) */}
          {activeMode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Telefone (Opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                />
              </div>
            </div>
          )}

          {/* Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder={activeMode === "register" ? "Escolha uma senha" : "Digite sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {loading 
              ? (activeMode === "login" ? "Entrando..." : "Criando conta...") 
              : (activeMode === "login" ? "Acessar Plataforma" : "Criar Conta & Acessar")
            }
          </button>
        </form>

        {/* Voltar para o Site Principal */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ← Voltar ao site principal
          </Link>
        </div>
      </div>
    </div>
  );
}

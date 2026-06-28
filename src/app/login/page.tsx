"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, LogIn, GraduationCap, AlertCircle, User, Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { alunoLoginAction, alunoRegisterAction, alunoResetPasswordAction } from "@/app/actions";

export default function AlunoLoginPage() {
  const [activeMode, setActiveMode] = useState<"login" | "register" | "forgot">("login");
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
    } else if (activeMode === "register") {
      if (!nome.trim() || !email.trim() || !password.trim() || !telefone.trim()) {
        setError("Por favor, preencha todos os campos. O telefone é obrigatório para recuperação de senha.");
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
    } else if (activeMode === "forgot") {
      if (!email.trim() || !telefone.trim() || !password.trim()) {
        setError("Por favor, preencha todos os campos.");
        return;
      }
      setLoading(true);
      try {
        const res = await alunoResetPasswordAction(email, telefone, password);
        if (res.success) {
          toast.success("Senha alterada com sucesso! Login efetuado.");
          router.push("/dashboard");
          router.refresh();
        } else {
          setError(res.error || "Erro ao redefinir senha.");
          toast.error(res.error || "Falha ao resetar.");
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
            {activeMode === "forgot" ? (
              <KeyRound className="h-8 w-8" />
            ) : (
              <GraduationCap className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeMode === "forgot" ? "Recuperar Senha" : "SISGR Academy"}
            </h1>
            <p className="text-3xs font-extrabold text-emerald-600 uppercase tracking-widest mt-1">
              {activeMode === "forgot" ? "Redefinição Instantânea" : "Portal do Aluno"}
            </p>
          </div>
        </div>

        {/* Alternância de Abas (Apenas no Modo Comum - Ocultado em Esqueci a Senha) */}
        {activeMode !== "forgot" ? (
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveMode("login");
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeMode === "login"
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
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeMode === "register"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Cadastrar-se
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-semibold leading-relaxed text-center px-4 -mt-2">
            Confirme seu e-mail e telefone cadastrados para cadastrar uma nova senha imediatamente.
          </p>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-750 text-xs px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="font-semibold leading-relaxed text-left">{error}</span>
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

          {/* Telefone (Opcional/Obrigatório dependendo do modo) */}
          {(activeMode === "register" || activeMode === "forgot") && (
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                {activeMode === "register" ? "Telefone (Obrigatório p/ recuperação)" : "Telefone Cadastrado"}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                />
              </div>
            </div>
          )}

          {/* Senha / Nova Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider pl-1 font-extrabold">
              {activeMode === "forgot" ? "Escolha a Nova Senha" : "Senha"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder={
                  activeMode === "forgot"
                    ? "Nova senha (mín. 4 caracteres)"
                    : (activeMode === "register" ? "Escolha uma senha" : "Digite sua senha")
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Link Esqueci Minha Senha (Apenas no Modo Login) */}
          {activeMode === "login" && (
            <div className="text-right -mt-1 pl-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("forgot");
                  setError(null);
                  setPassword(""); // Limpa a senha
                }}
                className="text-[10px] font-black text-slate-450 hover:text-emerald-700 transition-colors bg-transparent border-0 cursor-pointer uppercase tracking-wider"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {loading
              ? (activeMode === "login" ? "Entrando..." : (activeMode === "register" ? "Criando conta..." : "Redefinindo..."))
              : (activeMode === "login" ? "Acessar Plataforma" : (activeMode === "register" ? "Criar Conta & Acessar" : "Redefinir Senha & Entrar"))
            }
          </button>
        </form>

        {/* Voltar para o Site Principal ou Voltar para Login */}
        <div className="text-center pt-2 border-t border-slate-100 flex flex-col gap-2">
          {activeMode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setActiveMode("login");
                setError(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ← Voltar ao login
            </button>
          ) : (
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ← Voltar ao site principal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

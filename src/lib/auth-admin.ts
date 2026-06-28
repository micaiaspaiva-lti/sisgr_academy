"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ADMIN_PASSWORD || "admin-fallback-secret-key-123";

export async function verificarSessaoAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    const envEmail = process.env.ADMIN_EMAIL || "admin@residuosparceiro.com";
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return decoded && decoded.email === envEmail && decoded.role === "admin";
  } catch (error) {
    return false;
  }
}

export async function loginAdminAction(email: string, password: string) {
  try {
    const envEmail = process.env.ADMIN_EMAIL || "admin@residuosparceiro.com";
    const envPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (email.trim().toLowerCase() !== envEmail.trim().toLowerCase()) {
      return { success: false, error: "E-mail administrativo incorreto." };
    }

    if (password !== envPassword) {
      return { success: false, error: "Senha administrativa incorreta." };
    }

    const token = jwt.sign(
      { email: envEmail, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      maxAge: 24 * 60 * 60, // 24 horas
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao autenticar administrador:", error);
    return { success: false, error: "Falha na autenticação administrativa." };
  }
}

export async function logoutAdminAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return { success: true };
  } catch (error) {
    console.error("Erro ao efetuar logout:", error);
    return { success: false, error: "Falha ao efetuar logout." };
  }
}

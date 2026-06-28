import { NextResponse } from "next/server";
import { db } from "@/db";
import { leadsEad, alunos } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { signTestToken } from "@/lib/auth";
import { cookies } from "next/headers";

const createLeadSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().min(8),
  senha: z.string().min(4),
  aulaOrigemId: z.string(),
  respostasQuiz: z.any().optional(),
  notaQuiz: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação estrita do payload via Zod
    const parsed = createLeadSchema.parse(body);

    const formattedEmail = parsed.email.trim().toLowerCase();

    // 1. Inserir na tabela de leads
    const [newLead] = await db.insert(leadsEad).values({
      nome: parsed.nome,
      email: formattedEmail,
      telefone: parsed.telefone,
      aulaOrigemId: parsed.aulaOrigemId,
      respostasQuiz: parsed.respostasQuiz,
      notaQuiz: parsed.notaQuiz,
    }).returning();

    // 2. Verificar se já existe como aluno
    let dbAluno = await db.query.alunos.findFirst({
      where: eq(alunos.email, formattedEmail),
    });

    if (!dbAluno) {
      // Se não existir, cria o cadastro automático do aluno visitante (normal)
      const [newAluno] = await db.insert(alunos).values({
        nome: parsed.nome.trim(),
        email: formattedEmail,
        telefone: parsed.telefone.trim(),
        tipo: "normal",
        senha: parsed.senha.trim(),
      }).returning();
      dbAluno = newAluno;
    }

    // 3. Logar o aluno automaticamente gerando cookie de sessão SSO
    const token = signTestToken({
      sub: dbAluno.id,
      nome: dbAluno.nome,
      email: dbAluno.email,
      empresaId: dbAluno.empresaId || undefined,
      tipo: dbAluno.tipo,
      role: "aluno",
    });

    const cookieStore = await cookies();
    cookieStore.set("sso_token", token, {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, lead: newLead, alunoId: dbAluno.id });
  } catch (error: any) {
    console.error("Erro no processamento do lead:", error);
    if (error instanceof z.ZodError || (error && error.name === "ZodError")) {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await db.select().from(leadsEad);
    return NextResponse.json({ success: true, leads: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Falha ao obter leads" }, { status: 550 });
  }
}

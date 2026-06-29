import { db } from "@/db";
import { empresas, solicitacoesVip } from "@/db/schema";
import AlunosClient from "./AlunosClient";
import { cookies } from "next/headers";
import { verifySSOToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Gerenciamento de Alunos - SISGR Academy",
};

export const dynamic = "force-dynamic";

export default async function AdminAlunosPage() {
  // 1. Buscar todos os alunos e suas empresas
  const dbAlunos = await db.query.alunos.findMany({
    with: {
      empresa: true,
    },
    orderBy: (alunos, { desc }) => [desc(alunos.createdAt)],
  });

  // 2. Buscar todas as empresas para associar a alunos VIP
  const dbEmpresas = await db.select().from(empresas).orderBy(empresas.nomeFantasia);

  // 2.1. Buscar todas as solicitações pendentes de acesso VIP
  const dbSolicitacoes = await db.query.solicitacoesVip.findMany({
    where: eq(solicitacoesVip.status, "pendente"),
    with: {
      aluno: true,
      curso: true,
    },
    orderBy: (solicitacoes, { desc }) => [desc(solicitacoes.createdAt)],
  });

  // 3. Obter sessão atual simulada
  const cookieStore = await cookies();
  const token = cookieStore.get("sso_token")?.value || "";
  const session = verifySSOToken(token);
  const activeSessionId = session ? session.id : null;

  // 4. Mapear os dados
  const mappedAlunos = dbAlunos.map(a => ({
    id: a.id,
    nome: a.nome,
    email: a.email,
    telefone: a.telefone || "",
    tipo: (a.tipo || "normal") as "normal" | "vip",
    createdAt: a.createdAt.toISOString(),
    empresa: a.empresa ? {
      id: a.empresa.id,
      nomeFantasia: a.empresa.nomeFantasia,
    } : null,
  }));

  const mappedEmpresas = dbEmpresas.map(e => ({
    id: e.id,
    nomeFantasia: e.nomeFantasia,
  }));

  const mappedSolicitacoes = dbSolicitacoes.map(s => ({
    id: s.id,
    alunoId: s.alunoId,
    alunoNome: s.aluno.nome,
    alunoEmail: s.aluno.email,
    cursoId: s.cursoId,
    cursoTitulo: s.curso.titulo,
    empresaNome: s.empresaNome,
    cnpj: s.cnpj,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <AlunosClient
      initialAlunos={mappedAlunos}
      empresas={mappedEmpresas}
      activeSessionId={activeSessionId}
      initialSolicitacoes={mappedSolicitacoes}
    />
  );
}

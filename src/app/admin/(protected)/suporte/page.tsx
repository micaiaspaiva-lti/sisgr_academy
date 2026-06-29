import { db } from "@/db";
import { chamados } from "@/db/schema";
import SuporteClient from "./SuporteClient";

export const metadata = {
  title: "Suporte Técnico - SISGR Academy",
};

export const dynamic = "force-dynamic";

export default async function AdminSuportePage() {
  // Buscar todos os chamados com seus respectivos alunos
  const dbChamados = await db.query.chamados.findMany({
    with: {
      aluno: true,
    },
    orderBy: (chamados, { desc }) => [desc(chamados.createdAt)],
  });

  const mappedChamados = dbChamados.map(c => ({
    id: c.id,
    alunoNome: c.aluno.nome,
    alunoEmail: c.aluno.email,
    assunto: c.assunto,
    mensagem: c.mensagem,
    status: c.status as "aberto" | "respondido" | "fechado",
    resposta: c.resposta || "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <SuporteClient initialChamados={mappedChamados} />;
}

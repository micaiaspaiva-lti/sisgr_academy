import { db } from "@/db";
import { empresas } from "@/db/schema";
import EmpresasClient from "./EmpresasClient";

export const metadata = {
  title: "Gerenciamento de Empresas - SISGR Academy",
};

export const dynamic = "force-dynamic";

export default async function AdminEmpresasPage() {
  // Buscar todas as empresas com seus respectivos alunos vinculados para contagem
  const dbEmpresas = await db.query.empresas.findMany({
    with: {
      alunos: {
        columns: {
          id: true,
        },
      },
    },
    orderBy: (empresas, { asc }) => [asc(empresas.nomeFantasia)],
  });

  const mappedEmpresas = dbEmpresas.map(e => ({
    id: e.id,
    nomeFantasia: e.nomeFantasia,
    cnpj: e.cnpj,
    createdAt: e.createdAt.toISOString(),
    qtdColaboradores: e.alunos.length,
  }));

  return <EmpresasClient initialEmpresas={mappedEmpresas} />;
}

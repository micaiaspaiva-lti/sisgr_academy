import { db } from "@/db";
import { cursos } from "@/db/schema";
import CmsAdminClient from "./CmsAdminClient";

export const metadata = {
  title: "Administração de Cursos - SISGR Academy",
};

export const dynamic = "force-dynamic";

export default async function CMSAdminPage() {
  // Busca todos os cursos, módulos e aulas ordenados para o painel CMS
  const allCourses = await db.query.cursos.findMany({
    orderBy: (cursos, { desc }) => [desc(cursos.createdAt)],
    with: {
      modulos: {
        orderBy: (modulos, { asc }) => [asc(modulos.ordem)],
        with: {
          aulas: {
            orderBy: (aulas, { asc }) => [asc(aulas.ordem)],
          }
        }
      }
    }
  });

  // Mapeia os dados do banco para os tipos aceitos pelo cliente
  const mappedCourses = allCourses.map(course => ({
    id: course.id,
    titulo: course.titulo,
    descricao: course.descricao || "",
    imagemCapa: course.imagemCapa || "",
    ativo: course.ativo,
    tipo: course.tipo as "publico" | "vip",
    modulos: course.modulos.map(m => ({
      id: m.id,
      cursoId: m.cursoId,
      titulo: m.titulo,
      ordem: m.ordem,
      aulas: m.aulas.map(a => ({
        id: a.id,
        moduloId: a.moduloId,
        titulo: a.titulo,
        descricaoApoio: a.descricaoApoio,
        videoUrl: a.videoUrl,
        legendasUrl: a.legendasUrl,
        imagemCapa: a.imagemCapa,
        materiais: (a.materiais as any) || [],
        demonstrative: a.demonstrative,
        ativo: a.ativo,
        ordem: a.ordem,
      })),
    })),
  }));

  return <CmsAdminClient initialCourses={mappedCourses} />;
}

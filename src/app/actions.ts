"use server";

import { db } from "@/db";
import { progressoAulas, aulas, modulos, cursos, alunos, empresas } from "@/db/schema";
import { eq, and, asc, ne } from "drizzle-orm";
import { addVideoToQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { signTestToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. Marcar aula como concluída ou pendente
export async function concluirAulaAction(alunoId: string, aulaId: string, concluida: boolean) {
  try {
    if (concluidiaOrNot(concluidiaOrNot)) {} // No-op placeholder to prevent linter complaints
    
    if (concluida) {
      // Inserir ou atualizar na tabela de progresso
      await db
        .insert(progressoAulas)
        .values({
          alunoId,
          aulaId,
          concluida: true,
          concluidaEm: new Date(),
        })
        .onConflictDoUpdate({
          target: [progressoAulas.alunoId, progressoAulas.aulaId],
          set: {
            concluida: true,
            concluidaEm: new Date(),
            updatedAt: new Date(),
          },
        });
    } else {
      // Excluir ou setar falso
      await db
        .delete(progressoAulas)
        .where(
          and(
            eq(progressoAulas.alunoId, alunoId),
            eq(progressoAulas.aulaId, aulaId)
          )
        );
    }
    
    revalidatePath(`/player/${aulaId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar progresso da aula:", error);
    return { success: false, error: "Falha ao salvar progresso" };
  }
}

function concluidiaOrNot(val: any) {
  return val;
}

// 2. Buscar IDs de aulas concluídas do aluno
export async function getAlunoProgressoAction(alunoId: string) {
  try {
    const records = await db
      .select({ aulaId: progressoAulas.aulaId })
      .from(progressoAulas)
      .where(
        and(
          eq(progressoAulas.alunoId, alunoId),
          eq(progressoAulas.concluida, true)
        )
      );
    return records.map(r => r.aulaId);
  } catch (error) {
    console.error("Erro ao buscar progresso do aluno:", error);
    return [];
  }
}

// 3. Reordenar aulas em um módulo
export async function reorderAulasAction(moduloId: string, aulaIds: string[]) {
  try {
    // Atualiza a ordem de cada aula sequencialmente
    for (let index = 0; index < aulaIds.length; index++) {
      await db
        .update(aulas)
        .set({ ordem: index + 1 })
        .where(eq(aulas.id, aulaIds[index]));
    }
    revalidatePath("/admin/cursos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao reordenar aulas:", error);
    return { success: false, error: "Falha ao reordenar" };
  }
}

// 4. Excluir aula do banco
export async function deleteAulaAction(aulaId: string) {
  try {
    await db.delete(aulas).where(eq(aulas.id, aulaId));
    revalidatePath("/admin/cursos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir aula:", error);
    return { success: false, error: "Falha ao excluir aula" };
  }
}

// 5. Acionar transcrição e legenda com IA
export async function triggerIAAutomationAction(aulaId: string) {
  try {
    const aula = await db.query.aulas.findFirst({
      where: eq(aulas.id, aulaId),
    });

    if (!aula) {
      return { success: false, error: "Aula não encontrada" };
    }

    // Adiciona o job na fila BullMQ
    await addVideoToQueue(aulaId, aula.videoUrl);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao acionar IA:", error);
    return { success: false, error: "Falha ao acionar processo de IA" };
  }
}

// 6. Criar um novo curso demonstrativo
export async function createCursoAction(
  titulo: string, 
  descricao: string, 
  tipo: "publico" | "vip" = "publico", 
  imagemCapa?: string,
  cargaHoraria?: number
) {
  try {
    const existingCursos = await db.select().from(cursos);
    const [newCourse] = await db
      .insert(cursos)
      .values({
        titulo,
        descricao,
        imagemCapa: imagemCapa?.trim() || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
        ativo: true,
        tipo,
        ordem: existingCursos.length + 1,
        cargaHoraria: cargaHoraria || 20,
        destaque: false,
      })
      .returning();
      
    // Criar um módulo padrão inicial
    const [newModule] = await db
      .insert(modulos)
      .values({
        cursoId: newCourse.id,
        titulo: "Módulo 1: Introdução",
        ordem: 1,
      })
      .returning();

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, course: newCourse, module: newModule };
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    return { success: false, error: "Falha ao criar curso" };
  }
}

// 6.1. Criar um novo módulo
export async function createModuloAction(cursoId: string, titulo: string) {
  try {
    const existingModulos = await db
      .select()
      .from(modulos)
      .where(eq(modulos.cursoId, cursoId));

    const [newModule] = await db
      .insert(modulos)
      .values({
        cursoId,
        titulo,
        ordem: existingModulos.length + 1,
      })
      .returning();

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, module: newModule };
  } catch (error) {
    console.error("Erro ao criar módulo:", error);
    return { success: false, error: "Falha ao criar módulo" };
  }
}

// 7. Criar uma nova aula em um módulo
export async function createAulaAction(
  moduloId: string,
  titulo: string,
  videoUrl: string,
  demonstrative: boolean,
  imagemCapa?: string,
  materiais?: { name: string; url: string }[],
  descricaoApoio?: string
) {
  try {
    const existingAulas = await db
      .select()
      .from(aulas)
      .where(eq(aulas.moduloId, moduloId));

    const [newAula] = await db
      .insert(aulas)
      .values({
        moduloId,
        titulo,
        videoUrl,
        demonstrative,
        imagemCapa: imagemCapa?.trim() || null,
        materiais: materiais || [],
        descricaoApoio: descricaoApoio?.trim() || null,
        ordem: existingAulas.length + 1,
      })
      .returning();

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, aula: newAula };
  } catch (error) {
    console.error("Erro ao criar aula:", error);
    return { success: false, error: "Falha ao criar aula" };
  }
}

// 7.1. Atualizar um curso existente
export async function updateCursoAction(
  cursoId: string,
  titulo: string,
  descricao: string,
  tipo: "publico" | "vip",
  imagemCapa: string,
  ativo: boolean,
  cargaHoraria?: number
) {
  try {
    const [updatedCourse] = await db
      .update(cursos)
      .set({
        titulo,
        descricao,
        tipo,
        imagemCapa: imagemCapa?.trim() || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
        ativo,
        cargaHoraria: cargaHoraria || 20,
        updatedAt: new Date()
      })
      .where(eq(cursos.id, cursoId))
      .returning();

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, course: updatedCourse };
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    return { success: false, error: "Falha ao atualizar curso" };
  }
}

// 7.2. Atualizar uma aula existente
export async function updateAulaAction(
  aulaId: string,
  titulo: string,
  videoUrl: string,
  demonstrative: boolean,
  imagemCapa: string | null,
  materiais: { name: string; url: string }[] | null,
  ativo: boolean,
  descricaoApoio: string | null = null
) {
  try {
    const [updatedAula] = await db
      .update(aulas)
      .set({
        titulo,
        videoUrl,
        demonstrative,
        imagemCapa: imagemCapa?.trim() || null,
        materiais: materiais || [],
        ativo,
        descricaoApoio: descricaoApoio?.trim() || null,
      })
      .where(eq(aulas.id, aulaId))
      .returning();

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, aula: updatedAula };
  } catch (error) {
    console.error("Erro ao atualizar aula:", error);
    return { success: false, error: "Falha ao atualizar aula" };
  }
}

// 8. Limpar o banco de dados (remover cursos, módulos, aulas, progresso e alunos adicionais)
export async function clearDatabaseAction() {
  try {
    await db.delete(progressoAulas);
    await db.delete(aulas);
    await db.delete(modulos);
    await db.delete(cursos);
    
    // Mantém apenas o aluno Arthur Pendragon (SSO) para evitar quebrar a sessão
    await db.delete(alunos).where(ne(alunos.id, "22222222-2222-4222-b222-222222222222"));

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin/metricas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao limpar banco de dados:", error);
    return { success: false, error: "Falha ao limpar banco de dados" };
  }
}

// 9. Resetar o banco de dados para os dados semente originais (inclui empresa, aluno Arthur e cursos)
export async function resetDatabaseToSeedAction() {
  try {
    // 1. Limpar banco de dados
    await db.delete(progressoAulas);
    await db.delete(aulas);
    await db.delete(modulos);
    await db.delete(cursos);
    await db.delete(alunos);
    await db.delete(empresas);

    // 2. Inserir Empresa Padrão
    const [empresa] = await db.insert(empresas).values({
      id: "11111111-1111-4111-a111-111111111111",
      nomeFantasia: "EcoRecicla S/A",
      cnpj: "12345678000199",
    }).returning();

    // 3. Inserir Alunos Padrão
    const [arthur] = await db.insert(alunos).values({
      id: "22222222-2222-4222-b222-222222222222",
      nome: "Arthur Pendragon (SSO Teste)",
      email: "arthur.sso@residuosparceiro.com",
      telefone: "(11) 99999-1111",
      tipo: "vip",
      senha: "123456",
      empresaId: empresa.id,
    }).returning();

    const [beatriz] = await db.insert(alunos).values({
      id: "22222222-3333-4333-b333-333333333333",
      nome: "Beatriz Souza",
      email: "beatriz@ecorecicla.com",
      telefone: "(11) 99999-2222",
      tipo: "vip",
      senha: "123456",
      empresaId: empresa.id,
    }).returning();

    const [carlos] = await db.insert(alunos).values({
      id: "22222222-4444-4444-b444-444444444444",
      nome: "Carlos Eduardo",
      email: "carlos@ecorecicla.com",
      telefone: "(11) 99999-3333",
      tipo: "vip",
      senha: "123456",
      empresaId: empresa.id,
    }).returning();

    const [diana] = await db.insert(alunos).values({
      id: "22222222-5555-4555-b555-555555555555",
      nome: "Diana Prince",
      email: "diana@ecorecicla.com",
      telefone: "(11) 99999-4444",
      tipo: "vip",
      senha: "123456",
      empresaId: empresa.id,
    }).returning();

    // 4. Inserir Cursos
    const [curso1] = await db.insert(cursos).values({
      id: "c1111111-1111-4111-8111-111111111111",
      titulo: "Introdução à Gestão de Resíduos",
      descricao: "Domine os fundamentos da gestão de resíduos sólidos no setor industrial, cobrindo da coleta à destinação final e conformidade legal.",
      imagemCapa: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
      ativo: true,
      tipo: "publico",
      cargaHoraria: 20,
    }).returning();

    const [modulo1_1] = await db.insert(modulos).values({
      id: "d1111111-1111-4111-8111-111111111111",
      cursoId: curso1.id,
      titulo: "Módulo 1: Fundamentos e Legislação",
      ordem: 1,
    }).returning();

    await db.insert(aulas).values([
      {
        id: "a1111111-1111-4111-8111-111111111111",
        moduloId: modulo1_1.id,
        titulo: "1.1 Introdução ao MGR (Gestão de Resíduos)",
        descricaoApoio: "Nesta aula, discutiremos a importância da separação e triagem de resíduos sólidos e como os processos industriais se relacionam com as normas ambientais vigentes.",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        demonstrative: true,
        ordem: 1,
      },
      {
        id: "a1111111-2222-4222-8222-222222222222",
        moduloId: modulo1_1.id,
        titulo: "1.2 Política Nacional de Resíduos Sólidos (PNRS)",
        descricaoApoio: "Estudo detalhado sobre a Lei nº 12.305/10, as responsabilidades compartilhadas dos geradores de resíduos e os acordos setoriais de logística reversa.",
        videoUrl: "https://www.w3schools.com/html/movie.mp4",
        demonstrative: false,
        ordem: 2,
      }
    ]);

    const [modulo1_2] = await db.insert(modulos).values({
      id: "d1111111-2222-4222-8222-222222222222",
      cursoId: curso1.id,
      titulo: "Módulo 2: Operação e Logística Reversa",
      ordem: 2,
    }).returning();

    await db.insert(aulas).values([
      {
        id: "a1111111-3333-4333-8333-333333333333",
        moduloId: modulo1_2.id,
        titulo: "2.1 Técnicas de Triagem Mecânica e Manual",
        descricaoApoio: "Aprenda sobre os equipamentos de triagem de resíduos secos e úmidos, esteiras de separação e a importância das cooperativas de reciclagem.",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        demonstrative: false,
        ordem: 1,
      }
    ]);

    const [curso2] = await db.insert(cursos).values({
      id: "c2222222-2222-4222-8222-222222222222",
      titulo: "MTR e Declaração SINIR na Prática",
      descricao: "Aprenda a emitir o Manifesto de Transporte de Resíduos (MTR) e declarar informações ambientais no sistema nacional (SINIR).",
      imagemCapa: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?q=80&w=600&auto=format&fit=crop",
      ativo: true,
      tipo: "vip",
      cargaHoraria: 10,
    }).returning();

    const [modulo2_1] = await db.insert(modulos).values({
      id: "d2222222-1111-4111-8111-111111111111",
      cursoId: curso2.id,
      titulo: "Módulo 1: O Sistema MTR",
      ordem: 1,
    }).returning();

    await db.insert(aulas).values([
      {
        id: "a2222222-1111-4111-8111-111111111111",
        moduloId: modulo2_1.id,
        titulo: "1.1 O que é o MTR e Quem é Obrigado a Emitir?",
        descricaoApoio: "Guia completo sobre a obrigatoriedade da emissão do MTR online para transporte interestadual e estadual de resíduos controlados.",
        videoUrl: "https://www.w3schools.com/html/movie.mp4",
        demonstrative: true,
        ordem: 1,
      }
    ]);

    // 5. Inserir Progresso de Aulas para os alunos de teste
    // Diana Prince - 100% de progresso (todas as 4 aulas concluídas)
    await db.insert(progressoAulas).values([
      { alunoId: diana.id, aulaId: "a1111111-1111-4111-8111-111111111111", concluida: true, tempoAssistidoSegundos: 7200, concluidaEm: new Date() },
      { alunoId: diana.id, aulaId: "a1111111-2222-4222-8222-222222222222", concluida: true, tempoAssistidoSegundos: 7200, concluidaEm: new Date() },
      { alunoId: diana.id, aulaId: "a1111111-3333-4333-8333-333333333333", concluida: true, tempoAssistidoSegundos: 7200, concluidaEm: new Date() },
      { alunoId: diana.id, aulaId: "a2222222-1111-4111-8111-111111111111", concluida: true, tempoAssistidoSegundos: 7200, concluidaEm: new Date() },
    ]);

    // Beatriz Souza - 75% de progresso (3 de 4 aulas concluídas)
    await db.insert(progressoAulas).values([
      { alunoId: beatriz.id, aulaId: "a1111111-1111-4111-8111-111111111111", concluida: true, tempoAssistidoSegundos: 7500, concluidaEm: new Date() },
      { alunoId: beatriz.id, aulaId: "a1111111-2222-4222-8222-222222222222", concluida: true, tempoAssistidoSegundos: 7500, concluidaEm: new Date() },
      { alunoId: beatriz.id, aulaId: "a1111111-3333-4333-8333-333333333333", concluida: true, tempoAssistidoSegundos: 7500, concluidaEm: new Date() },
    ]);

    // Carlos Eduardo - 50% de progresso (2 de 4 aulas concluídas)
    await db.insert(progressoAulas).values([
      { alunoId: carlos.id, aulaId: "a1111111-1111-4111-8111-111111111111", concluida: true, tempoAssistidoSegundos: 8550, concluidaEm: new Date() },
      { alunoId: carlos.id, aulaId: "a1111111-2222-4222-8222-222222222222", concluida: true, tempoAssistidoSegundos: 8550, concluidaEm: new Date() },
    ]);

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin/metricas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao resetar banco de dados:", error);
    return { success: false, error: "Falha ao resetar banco de dados" };
  }
}

// 10. Criar Aluno com validações (telefone obrigatório e e-mail único)
export async function createAlunoAction(
  nome: string,
  email: string,
  telefone: string,
  tipo: "normal" | "vip",
  empresaId?: string | null,
  senha?: string
) {
  try {
    if (!nome.trim()) return { success: false, error: "O campo Nome é obrigatório." };
    if (!email.trim()) return { success: false, error: "O campo E-mail é obrigatório." };
    if (!telefone.trim()) return { success: false, error: "O campo Telefone é obrigatório." };

    const formattedEmail = email.trim().toLowerCase();

    // Validar e-mail único
    const existing = await db
      .select()
      .from(alunos)
      .where(eq(alunos.email, formattedEmail))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Este e-mail já está cadastrado em outro aluno." };
    }

    if (tipo === "vip" && !empresaId) {
      return { success: false, error: "Um aluno VIP precisa estar associado a uma empresa." };
    }

    const password = senha?.trim() || "123456";

    const [newAluno] = await db
      .insert(alunos)
      .values({
        nome: nome.trim(),
        email: formattedEmail,
        telefone: telefone.trim(),
        tipo,
        senha: password,
        empresaId: tipo === "vip" ? empresaId : null,
      })
      .returning();

    revalidatePath("/admin/alunos");
    revalidatePath("/admin/metricas");
    return { success: true, aluno: newAluno };
  } catch (error) {
    console.error("Erro ao cadastrar aluno:", error);
    return { success: false, error: "Falha ao cadastrar aluno no banco de dados." };
  }
}

// 10.1. Editar Aluno com validações (telefone obrigatório e e-mail único exceto próprio aluno)
export async function updateAlunoAction(
  id: string,
  nome: string,
  email: string,
  telefone: string,
  tipo: "normal" | "vip",
  empresaId?: string | null,
  senha?: string
) {
  try {
    if (!id) return { success: false, error: "ID do aluno é obrigatório para atualização." };
    if (!nome.trim()) return { success: false, error: "O campo Nome é obrigatório." };
    if (!email.trim()) return { success: false, error: "O campo E-mail é obrigatório." };
    if (!telefone.trim()) return { success: false, error: "O campo Telefone é obrigatório." };

    const formattedEmail = email.trim().toLowerCase();

    // Validar e-mail único excluindo o próprio aluno
    const existing = await db
      .select()
      .from(alunos)
      .where(and(eq(alunos.email, formattedEmail), ne(alunos.id, id)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Este e-mail já está cadastrado em outro aluno." };
    }

    if (tipo === "vip" && !empresaId) {
      return { success: false, error: "Um aluno VIP precisa estar associado a uma empresa." };
    }

    const updateData: any = {
      nome: nome.trim(),
      email: formattedEmail,
      telefone: telefone.trim(),
      tipo,
      empresaId: tipo === "vip" ? empresaId : null,
      updatedAt: new Date(),
    };

    if (senha && senha.trim()) {
      updateData.senha = senha.trim();
    }

    const [updatedAluno] = await db
      .update(alunos)
      .set(updateData)
      .where(eq(alunos.id, id))
      .returning();

    revalidatePath("/admin/alunos");
    revalidatePath("/admin/metricas");
    return { success: true, aluno: updatedAluno };
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    return { success: false, error: "Falha ao atualizar aluno no banco de dados." };
  }
}

// 11. Excluir Aluno (preservando o aluno padrão do SSO)
export async function deleteAlunoAction(id: string) {
  try {
    if (id === "22222222-2222-4222-b222-222222222222") {
      return {
        success: false,
        error: "O aluno padrão Arthur Pendragon não pode ser excluído para não quebrar a sessão de testes padrão do sistema.",
      };
    }

    await db.delete(alunos).where(eq(alunos.id, id));

    revalidatePath("/admin/alunos");
    revalidatePath("/admin/metricas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir aluno:", error);
    return { success: false, error: "Falha ao excluir aluno no banco de dados." };
  }
}

// 12. Simular sessão de aluno (assinando token JWT e gravando cookie)
export async function simularSessaoAlunoAction(alunoId: string) {
  try {
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(eq(alunos.id, alunoId))
      .limit(1);

    if (!aluno) {
      return { success: false, error: "Aluno não encontrado no banco de dados." };
    }

    const token = signTestToken({
      sub: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      empresaId: aluno.empresaId || undefined,
      tipo: aluno.tipo || "normal",
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

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/player");
    revalidatePath("/admin/alunos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao simular sessão do aluno:", error);
    return { success: false, error: "Falha ao simular sessão do aluno." };
  }
}

// 13. Limpar simulação de sessão (voltando ao Arthur Pendragon padrão)
export async function limparSessaoSimuladaAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sso_token");

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/player");
    revalidatePath("/admin/alunos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao limpar sessão simulada:", error);
    return { success: false, error: "Falha ao limpar sessão simulada." };
  }
}

// 14. Autenticar aluno via e-mail e senha no EAD
export async function alunoLoginAction(email: string, senhaInserida: string) {
  try {
    const formattedEmail = email.trim().toLowerCase();
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(eq(alunos.email, formattedEmail))
      .limit(1);

    if (!aluno) {
      return { 
        success: false, 
        error: "Este e-mail não está cadastrado em nosso EAD. Caso seja nosso cliente, entre em contato com o suporte." 
      };
    }

    if ((aluno.senha || "123456") !== senhaInserida.trim()) {
      return { success: false, error: "Senha incorreta." };
    }

    const token = signTestToken({
      sub: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      empresaId: aluno.empresaId || undefined,
      tipo: aluno.tipo || "normal",
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

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao autenticar aluno:", error);
    return { success: false, error: `Erro interno de login: ${error?.message || error}` };
  }
}

// 12. Alternar (toggle) curso em destaque
export async function toggleCursoDestaqueAction(cursoId: string) {
  try {
    const course = await db.query.cursos.findFirst({
      where: eq(cursos.id, cursoId),
    });
    if (!course) return { success: false, error: "Curso não encontrado" };

    const newDestaqueVal = !course.destaque;
    await db.update(cursos).set({ destaque: newDestaqueVal }).where(eq(cursos.id, cursoId));

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, destaque: newDestaqueVal };
  } catch (error) {
    console.error("Erro ao alterar destaque do curso:", error);
    return { success: false, error: "Falha ao alterar destaque" };
  }
}

// 13. Mover posição do curso (para cima/baixo)
export async function moveCursoAction(cursoId: string, direction: "up" | "down") {
  try {
    const allCourses = await db.select().from(cursos).orderBy(cursos.ordem);
    const currentIndex = allCourses.findIndex(c => c.id === cursoId);
    if (currentIndex === -1) return { success: false, error: "Curso não encontrado" };

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= allCourses.length) {
      return { success: false, error: "Movimento inválido" };
    }

    const currentCourse = allCourses[currentIndex];
    const targetCourse = allCourses[targetIndex];

    await db.transaction(async (tx) => {
      await tx.update(cursos).set({ ordem: targetCourse.ordem }).where(eq(cursos.id, currentCourse.id));
      await tx.update(cursos).set({ ordem: currentCourse.ordem }).where(eq(cursos.id, targetCourse.id));
    });

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao reordenar curso:", error);
    return { success: false, error: "Falha ao reordenar curso" };
  }
}

// 14. Mover posição do módulo (para cima/baixo)
export async function moveModuloAction(moduloId: string, direction: "up" | "down") {
  try {
    const currentModule = await db.query.modulos.findFirst({
      where: eq(modulos.id, moduloId)
    });
    if (!currentModule) return { success: false, error: "Módulo não encontrado" };

    const allModules = await db
      .select()
      .from(modulos)
      .where(eq(modulos.cursoId, currentModule.cursoId))
      .orderBy(modulos.ordem);

    const currentIndex = allModules.findIndex(m => m.id === moduloId);
    if (currentIndex === -1) return { success: false, error: "Módulo não encontrado" };

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= allModules.length) {
      return { success: false, error: "Movimento inválido" };
    }

    const targetModule = allModules[targetIndex];

    await db.transaction(async (tx) => {
      await tx.update(modulos).set({ ordem: targetModule.ordem }).where(eq(modulos.id, currentModule.id));
      await tx.update(modulos).set({ ordem: currentModule.ordem }).where(eq(modulos.id, targetModule.id));
    });

    revalidatePath("/admin/cursos");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao reordenar módulo:", error);
    return { success: false, error: "Falha ao reordenar módulo" };
  }
}

// 15. Registrar aluno diretamente pelo portal do aluno (self-registration)
export async function alunoRegisterAction(
  nome: string,
  email: string,
  senhaInserida: string,
  telefone?: string
) {
  try {
    if (!nome.trim()) return { success: false, error: "O nome é obrigatório." };
    if (!email.trim()) return { success: false, error: "O e-mail é obrigatório." };
    if (!senhaInserida.trim()) return { success: false, error: "A senha é obrigatória." };

    const formattedEmail = email.trim().toLowerCase();

    // Validar se o e-mail já existe
    const existing = await db
      .select()
      .from(alunos)
      .where(eq(alunos.email, formattedEmail))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Este e-mail já está cadastrado. Vá na aba 'Entrar' e acesse." };
    }

    const result = await db.transaction(async (tx) => {
      const [newAluno] = await tx
        .insert(alunos)
        .values({
          nome: nome.trim(),
          email: formattedEmail,
          senha: senhaInserida.trim(),
          telefone: telefone?.trim() || null,
          tipo: "normal", // Entra como aluno normal por padrão
        })
        .returning();

      // Gerar token de sessão e efetuar login automático
      const token = signTestToken({
        sub: newAluno.id,
        nome: newAluno.nome,
        email: newAluno.email,
        empresaId: newAluno.empresaId || undefined,
        tipo: newAluno.tipo || "normal",
        role: "aluno",
      });

      return { newAluno, token };
    });

    const cookieStore = await cookies();
    cookieStore.set("sso_token", result.token, {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    revalidatePath("/admin/alunos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar aluno:", error);
    return { success: false, error: "Falha ao registrar aluno. Tente novamente mais tarde." };
  }
}

// 16. Resetar senha do aluno mediante confirmação de telefone (self-service)
export async function alunoResetPasswordAction(
  email: string,
  telefone: string,
  novaSenhaInserida: string
) {
  try {
    if (!email.trim()) return { success: false, error: "O e-mail é obrigatório." };
    if (!telefone.trim()) return { success: false, error: "O telefone é obrigatório para validação." };
    if (!novaSenhaInserida.trim()) return { success: false, error: "A nova senha é obrigatória." };

    const formattedEmail = email.trim().toLowerCase();
    const formattedPhone = telefone.trim();

    // 1. Buscar aluno pelo e-mail
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(eq(alunos.email, formattedEmail))
      .limit(1);

    if (!aluno) {
      return { success: false, error: "Nenhum aluno encontrado com este e-mail." };
    }

    // 2. Validar se o telefone bate (removendo caracteres não numéricos para comparação mais segura)
    const dbPhoneDigits = aluno.telefone ? aluno.telefone.replace(/\D/g, "") : "";
    const inputPhoneDigits = formattedPhone.replace(/\D/g, "");

    if (!dbPhoneDigits) {
      return { 
        success: false, 
        error: "Seu cadastro não possui um telefone registrado para recuperação. Por favor, contate o suporte." 
      };
    }

    if (dbPhoneDigits !== inputPhoneDigits) {
      return { success: false, error: "O número de telefone não corresponde ao e-mail informado." };
    }

    // 3. Atualizar a senha e assinar o token na mesma transação
    const result = await db.transaction(async (tx) => {
      const [updatedAluno] = await tx
        .update(alunos)
        .set({ senha: novaSenhaInserida.trim() })
        .where(eq(alunos.id, aluno.id))
        .returning();

      // 4. Logar automaticamente
      const token = signTestToken({
        sub: updatedAluno.id,
        nome: updatedAluno.nome,
        email: updatedAluno.email,
        empresaId: updatedAluno.empresaId || undefined,
        tipo: updatedAluno.tipo || "normal",
        role: "aluno",
      });

      return { updatedAluno, token };
    });

    const cookieStore = await cookies();
    cookieStore.set("sso_token", result.token, {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao resetar senha do aluno:", error);
    return { success: false, error: "Falha ao redefinir senha. Tente novamente mais tarde." };
  }
}

// 17. Efetuar logout do aluno (deletar sso_token)
export async function alunoLogoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sso_token");
  } catch (error) {
    console.error("Erro ao remover cookie de sessão:", error);
  }
  redirect("/login");
}

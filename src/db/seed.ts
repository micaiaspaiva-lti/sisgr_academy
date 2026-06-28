import { db } from "./index";
import { empresas, alunos, cursos, modulos, aulas, progressoAulas } from "./schema";

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // 1. Limpar banco de dados
  console.log("Limpando tabelas existentes...");
  await db.delete(progressoAulas);
  await db.delete(aulas);
  await db.delete(modulos);
  await db.delete(cursos);
  await db.delete(alunos);
  await db.delete(empresas);

  // 2. Inserir Empresa Padrão
  console.log("Inserindo empresa...");
  const [empresa] = await db.insert(empresas).values({
    id: "11111111-1111-4111-a111-111111111111",
    nomeFantasia: "EcoRecicla S/A",
    cnpj: "12345678000199",
  }).returning();

  // 3. Inserir Alunos Padrão
  console.log("Inserindo alunos...");
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
  console.log("Inserindo cursos, módulos e aulas...");

  // Curso 1
  const [curso1] = await db.insert(cursos).values({
    id: "c1111111-1111-4111-8111-111111111111",
    titulo: "Introdução à Gestão de Resíduos",
    descricao: "Domine os fundamentos da gestão de resíduos sólidos no setor industrial, cobrindo da coleta à destinação final e conformidade legal.",
    imagemCapa: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
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

  // Curso 2
  const [curso2] = await db.insert(cursos).values({
    id: "c2222222-2222-4222-8222-222222222222",
    titulo: "MTR e Declaração SINIR na Prática",
    descricao: "Aprenda a emitir o Manifesto de Transporte de Resíduos (MTR) e declarar informações ambientais no sistema nacional (SINIR).",
    imagemCapa: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
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
  console.log("Inserindo progresso das aulas...");
  
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

  console.log("Seed concluído com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao rodar seed:", err);
  process.exit(1);
});

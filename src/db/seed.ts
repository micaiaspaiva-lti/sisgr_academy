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
      videoUrl: "https://www.youtube.com/watch?v=1W8MvP6kO-A",
      demonstrative: true,
      ordem: 1,
    },
    {
      id: "a1111111-2222-4222-8222-222222222222",
      moduloId: modulo1_1.id,
      titulo: "1.2 Política Nacional de Resíduos Sólidos (PNRS)",
      descricaoApoio: "Estudo detalhado sobre a Lei nº 12.305/10, as responsabilidades compartilhadas dos geradores de resíduos e os acordos setoriais de logística reversa.",
      videoUrl: "https://www.youtube.com/watch?v=2c7A1aA8G9I",
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
      videoUrl: "https://www.youtube.com/watch?v=y3hR9sU1p-Y",
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
      videoUrl: "https://www.youtube.com/watch?v=P2L9v3CjUe0",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 3
  const [curso3] = await db.insert(cursos).values({
    id: "c3333333-3333-4333-8333-333333333333",
    titulo: "Licenciamento Ambiental e Normas Técnicas",
    descricao: "Entenda o rito completo de obtenção de licenças ambientais prévias, de instalação e de operação (LP, LI, LO).",
    imagemCapa: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
    cargaHoraria: 25,
  }).returning();

  const [modulo3_1] = await db.insert(modulos).values({
    id: "d3333333-1111-4111-8111-111111111111",
    cursoId: curso3.id,
    titulo: "Módulo 1: O Rito de Licenciamento",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a3333333-1111-4111-8111-111111111111",
      moduloId: modulo3_1.id,
      titulo: "1.1 Etapas do Licenciamento (LP, LI, LO)",
      descricaoApoio: "Aulas explicativas sobre a documentação exigida pelos órgãos estaduais de controle ambiental.",
      videoUrl: "https://www.youtube.com/watch?v=q6J5P7J6tO4",
      demonstrative: false,
      ordem: 1,
    }
  ]);

  // Curso 4
  const [curso4] = await db.insert(cursos).values({
    id: "c4444444-4444-4444-8444-444444444444",
    titulo: "Logística Reversa de Eletroeletrônicos",
    descricao: "Conceitos e implementação de sistemas de descarte de resíduos tecnológicos e materiais eletroeletrônicos.",
    imagemCapa: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
    cargaHoraria: 15,
  }).returning();

  const [modulo4_1] = await db.insert(modulos).values({
    id: "d4444444-1111-4111-8111-111111111111",
    cursoId: curso4.id,
    titulo: "Módulo 1: Fluxo de Retorno de E-Lixo",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a4444444-1111-4111-8111-111111111111",
      moduloId: modulo4_1.id,
      titulo: "1.1 Logística de Coleta e Descaracterização",
      descricaoApoio: "Aborda a destruição segura de dados e a reciclagem dos metais nobres presentes no lixo eletrônico.",
      videoUrl: "https://www.youtube.com/watch?v=JE4O6-c4dQA",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 5
  const [curso5] = await db.insert(cursos).values({
    id: "c5555555-5555-4555-8555-555555555555",
    titulo: "Práticas de ESG no Setor Industrial",
    descricao: "Governança ambiental, social e corporativa de forma prática e aplicada nas operações de manufatura.",
    imagemCapa: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
    cargaHoraria: 30,
  }).returning();

  const [modulo5_1] = await db.insert(modulos).values({
    id: "d5555555-1111-4111-8111-111111111111",
    cursoId: curso5.id,
    titulo: "Módulo 1: O Pilar Ambiental (Environmental)",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a5555555-1111-4111-8111-111111111111",
      moduloId: modulo5_1.id,
      titulo: "1.1 Descarbonização e Economia de Baixo Carbono",
      descricaoApoio: "Saiba como mensurar a pegada ecológica da sua empresa e reduzir emissões indiretas.",
      videoUrl: "https://www.youtube.com/watch?v=0kF5uD5sQeo",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 6
  const [curso6] = await db.insert(cursos).values({
    id: "c6666666-6666-4666-8666-666666666666",
    titulo: "Auditoria Ambiental e Conformidade",
    descricao: "Como conduzir auditorias internas para assegurar que a planta atenda às legislações nacionais e internacionais.",
    imagemCapa: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
    cargaHoraria: 20,
  }).returning();

  const [modulo6_1] = await db.insert(modulos).values({
    id: "d6666666-1111-4111-8111-111111111111",
    cursoId: curso6.id,
    titulo: "Módulo 1: Roteiro de Auditoria",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a6666666-1111-4111-8111-111111111111",
      moduloId: modulo6_1.id,
      titulo: "1.1 Lista de Verificação e Não-Conformidades",
      descricaoApoio: "Técnicas de elaboração de relatórios, acompanhamento e planos de ação corretiva.",
      videoUrl: "https://www.youtube.com/watch?v=kU_UaJ86P7w",
      demonstrative: false,
      ordem: 1,
    }
  ]);

  // Curso 7
  const [curso7] = await db.insert(cursos).values({
    id: "c7777777-7777-4777-8777-777777777777",
    titulo: "Segurança com Resíduos Perigosos",
    descricao: "Normas de segurança (NR) e Equipamentos de Proteção Individual (EPIs) para manipulação de resíduos químicos.",
    imagemCapa: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
    cargaHoraria: 12,
  }).returning();

  const [modulo7_1] = await db.insert(modulos).values({
    id: "d7777777-1111-4111-8111-111111111111",
    cursoId: curso7.id,
    titulo: "Módulo 1: EPIs e Riscos Químicos",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a7777777-1111-4111-8111-111111111111",
      moduloId: modulo7_1.id,
      titulo: "1.1 Classificação e Rotulagem GHS",
      descricaoApoio: "Utilização correta da Ficha de Informações de Segurança de Produtos Químicos (FISPQ) e classificação GHS.",
      videoUrl: "https://www.youtube.com/watch?v=rK4p4E-0Ssk",
      demonstrative: false,
      ordem: 1,
    }
  ]);

  // Curso 8
  const [curso8] = await db.insert(cursos).values({
    id: "c8888888-8888-4888-8888-888888888888",
    titulo: "Tratamento de Efluentes Industriais",
    descricao: "Metodologias químicas, físicas e biológicas de remediação e reuso de recursos hídricos na fábrica.",
    imagemCapa: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
    cargaHoraria: 18,
  }).returning();

  const [modulo8_1] = await db.insert(modulos).values({
    id: "d8888888-1111-4111-8111-111111111111",
    cursoId: curso8.id,
    titulo: "Módulo 1: Processos Físico-Químicos",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a8888888-1111-4111-8111-111111111111",
      moduloId: modulo8_1.id,
      titulo: "1.1 Decantação, Coagulação e Flotação",
      descricaoApoio: "Funcionamento prático de uma Estação de Tratamento de Efluentes (ETE).",
      videoUrl: "https://www.youtube.com/watch?v=mC11Gg9Yc3w",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 9
  const [curso9] = await db.insert(cursos).values({
    id: "c9999999-9999-4999-8999-999999999999",
    titulo: "Economia Circular na Cadeia de Suprimentos",
    descricao: "Estratégias para redesenhar produtos visando eliminação do desperdício de matérias-primas.",
    imagemCapa: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
    cargaHoraria: 15,
  }).returning();

  const [modulo9_1] = await db.insert(modulos).values({
    id: "d9999999-1111-4111-8111-111111111111",
    cursoId: curso9.id,
    titulo: "Módulo 1: Design Circular",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "a9999999-1111-4111-8111-111111111111",
      moduloId: modulo9_1.id,
      titulo: "1.1 Análise de Ciclo de Vida do Produto (ACV)",
      descricaoApoio: "Cálculo de impacto ambiental desde a extração de matérias-primas até o descarte pós-consumo.",
      videoUrl: "https://www.youtube.com/watch?v=zCRKvDyyHmI",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 10
  const [curso10] = await db.insert(cursos).values({
    id: "caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    titulo: "Inventário Nacional de Resíduos Sólidos",
    descricao: "Preenchimento correto do formulário eletrônico obrigatório de declaração anual do IBAMA.",
    imagemCapa: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
    cargaHoraria: 8,
  }).returning();

  const [modulo10_1] = await db.insert(modulos).values({
    id: "daaaaaaa-1111-4111-8111-111111111111",
    cursoId: curso10.id,
    titulo: "Módulo 1: Preenchimento do RAPP",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "aaaaaaaa-1111-4111-8111-111111111111",
      moduloId: modulo10_1.id,
      titulo: "1.1 Declaração Passo a Passo no Cadastro Técnico Federal",
      descricaoApoio: "Prazos, enquadramento de atividades e geração do comprovante de conformidade legal.",
      videoUrl: "https://www.youtube.com/watch?v=d_k8F7L8F8I",
      demonstrative: false,
      ordem: 1,
    }
  ]);

  // Curso 11
  const [curso11] = await db.insert(cursos).values({
    id: "cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    titulo: "Certificações Verdes e ISO 14001",
    descricao: "Como planejar e implementar o Sistema de Gestão Ambiental (SGA) conforme a norma ISO 14001:2015.",
    imagemCapa: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "publico",
    cargaHoraria: 20,
  }).returning();

  const [modulo11_1] = await db.insert(modulos).values({
    id: "dbbbbbbb-1111-4111-8111-111111111111",
    cursoId: curso11.id,
    titulo: "Módulo 1: Diretrizes do SGA",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "bbbbbbbb-1111-4111-8111-111111111111",
      moduloId: modulo11_1.id,
      titulo: "1.1 Política Ambiental, Planejamento e Requisitos",
      descricaoApoio: "Definição de aspectos e impactos significativos no planejamento estratégico organizacional.",
      videoUrl: "https://www.youtube.com/watch?v=Wz7_o6D_D-w",
      demonstrative: true,
      ordem: 1,
    }
  ]);

  // Curso 12
  const [curso12] = await db.insert(cursos).values({
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    titulo: "Co-processamento de Resíduos Industriais",
    descricao: "Aproveitamento energético de resíduos industriais e substituição de combustíveis fósseis.",
    imagemCapa: "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    tipo: "vip",
    cargaHoraria: 16,
  }).returning();

  const [modulo12_1] = await db.insert(modulos).values({
    id: "dccccccc-1111-4111-8111-111111111111",
    cursoId: curso12.id,
    titulo: "Módulo 1: O Processo de Blending",
    ordem: 1,
  }).returning();

  await db.insert(aulas).values([
    {
      id: "cccccccc-1111-4111-8111-111111111111",
      moduloId: modulo12_1.id,
      titulo: "1.1 Preparo do Blend e Parâmetros Físico-Químicos",
      descricaoApoio: "Padrões de cloro, poder calorífico e cinzas para queima ambientalmente licenciada.",
      videoUrl: "https://www.youtube.com/watch?v=sU1cO46W3wU",
      demonstrative: false,
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

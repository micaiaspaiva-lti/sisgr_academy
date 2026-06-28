import { db } from "./index";
import { cursos, modulos, aulas } from "./schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Iniciando inserção de 10 cursos adicionais...");

  // Busca a ordem máxima atual dos cursos
  const result = await db.select({ count: sql<number>`count(*)` }).from(cursos);
  let startingOrder = Number(result[0]?.count || 0) + 1;

  const novosCursos = [
    {
      titulo: "Legislação e Licenciamento Ambiental",
      descricao: "Entenda os requisitos jurídicos, resoluções do CONAMA e trâmites práticos para licenciamento ambiental de empresas e indústrias no Brasil.",
      tipo: "publico",
      imagemCapa: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Fundamentos Jurídicos",
          aulas: [
            { titulo: "1.1 Introdução ao Licenciamento", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Conceitos básicos, órgãos envolvidos (IBAMA, órgãos estaduais) e etapas das licenças prévia, de instalação e de operação." },
            { titulo: "1.2 Resoluções CONAMA Relevantes", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Estudo detalhado das principais resoluções que afetam a indústria e a destinação de resíduos." }
          ]
        }
      ]
    },
    {
      titulo: "Logística Reversa na Prática",
      descricao: "Aprenda a estruturar fluxos eficientes de retorno de materiais pós-consumo, cumprimento de metas setoriais e integração com cooperativas.",
      tipo: "publico",
      imagemCapa: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Planejamento de Fluxo",
          aulas: [
            { titulo: "1.1 O Conceito de Logística Reversa", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Como planejar canais de distribuição reversos e pontos de entrega voluntária (PEVs)." }
          ]
        }
      ]
    },
    {
      titulo: "Gestão de MTR e Manifesto de Transporte",
      descricao: "Passo a passo prático para emissão e controle do Manifesto de Transporte de Resíduos (MTR) e conformidade com o SINIR nacional.",
      tipo: "vip",
      imagemCapa: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Emissão e Validação",
          aulas: [
            { titulo: "1.1 O que é o MTR Nacional?", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Entenda a obrigatoriedade da emissão do MTR para geradores, transportadores e destinadores finais." }
          ]
        }
      ]
    },
    {
      titulo: "Segurança do Trabalho no Manejo de Resíduos",
      descricao: "Normas regulamentadoras aplicadas à segurança de operadores, uso correto de EPIs e prevenção de acidentes com agentes químicos e biológicos.",
      tipo: "vip",
      imagemCapa: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: NR-38 e EPIs",
          aulas: [
            { titulo: "1.1 Uso Correto de EPIs", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Aprenda a mapear riscos físicos e selecionar os equipamentos de proteção corretos para coleta e triagem." }
          ]
        }
      ]
    },
    {
      titulo: "ESG e Sustentabilidade Corporativa",
      descricao: "Métricas ambientais, governança, crédito de carbono e como a sustentabilidade gera valor estratégico e financeiro para marcas modernas.",
      tipo: "publico",
      imagemCapa: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Fundamentos ESG",
          aulas: [
            { titulo: "1.1 O Pilar Ambiental do ESG", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Redução da pegada de carbono, metas net-zero e gestão eficiente de resíduos sólidos como diferencial." }
          ]
        }
      ]
    },
    {
      titulo: "Resíduos da Construção Civil",
      descricao: "Triagem, descarte correto de gesso, concreto e entulho, elaboração do Plano de Gerenciamento de Resíduos da Construção Civil (PGRCC).",
      tipo: "vip",
      imagemCapa: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Classes de Resíduos da Construção",
          aulas: [
            { titulo: "1.1 Classes A, B, C e D", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Como identificar, triar na obra e destinar corretamente cada tipo de sobra de material civil." }
          ]
        }
      ]
    },
    {
      titulo: "Auditoria Ambiental Interna (ISO 14001)",
      descricao: "Aprenda a planejar e executar auditorias ambientais baseadas na ISO 14001, mantendo a conformidade jurídica de sua empresa.",
      tipo: "vip",
      imagemCapa: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Preparação de Auditoria",
          aulas: [
            { titulo: "1.1 Lista de Verificação", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Elaborando listas de verificação, identificando não-conformidades e sugerindo planos de ação corretiva." }
          ]
        }
      ]
    },
    {
      titulo: "Transporte de Cargas Perigosas",
      descricao: "Regulamento da ANTT, simbologia de risco, sinalização do veículo e protocolos de emergência no transporte rodoviário de resíduos inflamáveis.",
      tipo: "publico",
      imagemCapa: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Legislação ANTT",
          aulas: [
            { titulo: "1.1 Classificação de Produtos Perigosos", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Classes de risco de 1 a 9, painéis de segurança e fichas de emergência obrigatórias." }
          ]
        }
      ]
    },
    {
      titulo: "Economia Circular e Desperdício Zero",
      descricao: "Como remodelar a cadeia de suprimentos e processos de produção sob o conceito de ciclo fechado, eliminando desperdícios no design do produto.",
      tipo: "publico",
      imagemCapa: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Do Berço ao Berço (Cradle to Cradle)",
          aulas: [
            { titulo: "1.1 Conceitos de Ciclos Biológicos e Técnicos", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "A diferença entre resíduos que retornam à natureza e materiais que devem ser infinitamente reciclados." }
          ]
        }
      ]
    },
    {
      titulo: "Tratamento de Efluentes Industriais",
      descricao: "Aspectos teóricos e operacionais de estações de tratamento de água e esgoto industrial (ETE), com foco em processos biológicos e decantação.",
      tipo: "vip",
      imagemCapa: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
      modulos: [
        {
          titulo: "Módulo 1: Processos de Tratamento",
          aulas: [
            { titulo: "1.1 Tratamentos Primário e Secundário", videoUrl: "https://www.youtube.com/watch?v=HGrbqJYyTXA", desc: "Gradeamento, decantação primária e processos biológicos de lodos ativados." }
          ]
        }
      ]
    }
  ];

  for (const cInfo of novosCursos) {
    console.log(`Inserindo curso: ${cInfo.titulo}`);
    const [c] = await db.insert(cursos).values({
      titulo: cInfo.titulo,
      descricao: cInfo.descricao,
      imagemCapa: cInfo.imagemCapa,
      tipo: cInfo.tipo,
      ativo: true,
      destaque: false,
      ordem: startingOrder++
    }).returning();

    for (let mIdx = 0; mIdx < cInfo.modulos.length; mIdx++) {
      const mInfo = cInfo.modulos[mIdx];
      const [m] = await db.insert(modulos).values({
        cursoId: c.id,
        titulo: mInfo.titulo,
        ordem: mIdx + 1
      }).returning();

      for (let aIdx = 0; aIdx < mInfo.aulas.length; aIdx++) {
        const aInfo = mInfo.aulas[aIdx];
        await db.insert(aulas).values({
          moduloId: m.id,
          titulo: aInfo.titulo,
          videoUrl: aInfo.videoUrl,
          descricaoApoio: aInfo.desc,
          demonstrative: false,
          ativo: true,
          ordem: aIdx + 1
        });
      }
    }
  }

  console.log("Inserção de 10 cursos concluída!");
  process.exit(0);
}

main().catch(console.error);

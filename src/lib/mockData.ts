export interface Lesson {
  id: string;
  moduloId: string;
  titulo: string;
  descricaoApoio: string;
  videoUrl: string;
  legendasUrl?: string;
  demonstrative: boolean;
  ordem: number;
}

export interface Module {
  id: string;
  cursoId: string;
  titulo: string;
  ordem: number;
  aulas: Lesson[];
}

export interface Course {
  id: string;
  titulo: string;
  descricao: string;
  imagemCapa: string;
  ativo: boolean;
  modulos: Module[];
}

export const mockCourses: Course[] = [
  {
    id: "curso-introducao-residuos",
    titulo: "Introdução à Gestão de Resíduos",
    descricao: "Domine os fundamentos da gestão de resíduos sólidos no setor industrial, cobrindo da coleta à destinação final e conformidade legal.",
    imagemCapa: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    modulos: [
      {
        id: "modulo-1-fundamentos",
        cursoId: "curso-introducao-residuos",
        titulo: "Módulo 1: Fundamentos e Legislação",
        ordem: 1,
        aulas: [
          {
            id: "aula-1-1-introducao",
            moduloId: "modulo-1-fundamentos",
            titulo: "1.1 Introdução ao MGR (Gestão de Resíduos)",
            descricaoApoio: "Nesta aula, discutiremos a importância da separação e triagem de resíduos sólidos e como os processos industriais se relacionam com as normas ambientais vigentes.",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            demonstrative: true,
            ordem: 1
          },
          {
            id: "aula-1-2-politica-nacional",
            moduloId: "modulo-1-fundamentos",
            titulo: "1.2 Política Nacional de Resíduos Sólidos (PNRS)",
            descricaoApoio: "Estudo detalhado sobre a Lei nº 12.305/10, as responsabilidades compartilhadas dos geradores de resíduos e os acordos setoriais de logística reversa.",
            videoUrl: "https://www.w3schools.com/html/movie.mp4",
            demonstrative: false,
            ordem: 2
          }
        ]
      },
      {
        id: "modulo-2-operacional",
        cursoId: "curso-introducao-residuos",
        titulo: "Módulo 2: Operação e Logística Reversa",
        ordem: 2,
        aulas: [
          {
            id: "aula-2-1-triagem",
            moduloId: "modulo-2-operacional",
            titulo: "2.1 Técnicas de Triagem Mecânica e Manual",
            descricaoApoio: "Aprenda sobre os equipamentos de triagem de resíduos secos e úmidos, esteiras de separação e a importância das cooperativas de reciclagem.",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            demonstrative: false,
            ordem: 1
          }
        ]
      }
    ]
  },
  {
    id: "curso-mtr-sinir",
    titulo: "MTR e Declaração SINIR na Prática",
    descricao: "Aprenda a emitir o Manifesto de Transporte de Resíduos (MTR) e declarar informações ambientais no sistema nacional (SINIR).",
    imagemCapa: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?q=80&w=600&auto=format&fit=crop",
    ativo: true,
    modulos: [
      {
        id: "modulo-mtr-1",
        cursoId: "curso-mtr-sinir",
        titulo: "Módulo 1: O Sistema MTR",
        ordem: 1,
        aulas: [
          {
            id: "aula-mtr-1-1",
            moduloId: "modulo-mtr-1",
            titulo: "1.1 O que é o MTR e Quem é Obrigado a Emitir?",
            descricaoApoio: "Guia completo sobre a obrigatoriedade da emissão do MTR online para transporte interestadual e estadual de resíduos controlados.",
            videoUrl: "https://www.w3schools.com/html/movie.mp4",
            demonstrative: true,
            ordem: 1
          }
        ]
      }
    ]
  }
];

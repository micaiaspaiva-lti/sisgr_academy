import { pgTable, uuid, varchar, boolean, integer, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const empresas = pgTable("empresas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alunos = pgTable("alunos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  telefone: varchar("telefone", { length: 20 }),
  tipo: varchar("tipo", { length: 20 }).default("normal").notNull(),
  senha: varchar("senha", { length: 255 }),
  empresaId: uuid("empresa_id").references(() => empresas.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cursos = pgTable("cursos", {
  id: uuid("id").defaultRandom().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: varchar("descricao", { length: 1000 }),
  imagemCapa: varchar("imagem_capa", { length: 512 }),
  ativo: boolean("ativo").default(true).notNull(),
  tipo: varchar("tipo", { length: 20 }).default("publico").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modulos = pgTable("modulos", {
  id: uuid("id").defaultRandom().primaryKey(),
  cursoId: uuid("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  ordem: integer("ordem").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aulas = pgTable("aulas", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduloId: uuid("modulo_id").notNull().references(() => modulos.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricaoApoio: varchar("descricao_apoio", { length: 5000 }),
  videoUrl: varchar("video_url", { length: 512 }).notNull(),
  legendasUrl: varchar("legendas_url", { length: 512 }),
  imagemCapa: varchar("imagem_capa", { length: 512 }),
  materiais: jsonb("materiais").$type<{ name: string; url: string }[]>().default([]).notNull(),
  demonstrative: boolean("demonstrative").default(false).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  ordem: integer("ordem").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressoAulas = pgTable("progresso_aulas", {
  id: uuid("id").defaultRandom().primaryKey(),
  alunoId: uuid("aluno_id").notNull().references(() => alunos.id, { onDelete: "cascade" }),
  aulaId: uuid("aula_id").notNull().references(() => aulas.id, { onDelete: "cascade" }),
  concluida: boolean("concluida").default(false).notNull(),
  tempoAssistidoSegundos: integer("tempo_assistido_segundos").default(0).notNull(),
  concluidaEm: timestamp("concluida_em"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.alunoId, t.aulaId)
]);

export const certificados = pgTable("certificados", {
  id: uuid("id").defaultRandom().primaryKey(),
  alunoId: uuid("aluno_id").notNull().references(() => alunos.id, { onDelete: "cascade" }),
  cursoId: uuid("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),
  codigoAutenticidade: varchar("codigo_autenticidade", { length: 255 }).notNull().unique(),
  emitidoEm: timestamp("emitido_em").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.alunoId, t.cursoId)
]);

export const leadsEad = pgTable("leads_ead", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  telefone: varchar("telefone", { length: 20 }),
  aulaOrigemId: uuid("aula_origem_id").notNull(),
  respostasQuiz: jsonb("respostas_quiz"),
  notaQuiz: integer("nota_quiz"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const empresasRelations = relations(empresas, ({ many }) => ({
  alunos: many(alunos),
}));

export const alunosRelations = relations(alunos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [alunos.empresaId], references: [empresas.id] }),
  progresso: many(progressoAulas),
  certificados: many(certificados),
}));

export const cursosRelations = relations(cursos, ({ many }) => ({
  modulos: many(modulos),
  certificados: many(certificados),
}));

export const modulosRelations = relations(modulos, ({ one, many }) => ({
  curso: one(cursos, { fields: [modulos.cursoId], references: [cursos.id] }),
  aulas: many(aulas),
}));

export const aulasRelations = relations(aulas, ({ one, many }) => ({
  modulo: one(modulos, { fields: [aulas.moduloId], references: [modulos.id] }),
  progresso: many(progressoAulas),
}));

export const progressoAulasRelations = relations(progressoAulas, ({ one }) => ({
  aluno: one(alunos, { fields: [progressoAulas.alunoId], references: [alunos.id] }),
  aula: one(aulas, { fields: [progressoAulas.aulaId], references: [aulas.id] }),
}));

export const certificadosRelations = relations(certificados, ({ one }) => ({
  aluno: one(alunos, { fields: [certificados.alunoId], references: [alunos.id] }),
  curso: one(cursos, { fields: [certificados.cursoId], references: [cursos.id] }),
}));

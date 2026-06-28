"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, Folder, PlayCircle, Sparkles, 
  UserCheck, BarChart3, GripVertical, CheckCircle, 
  Trash2, Loader2, ArrowLeft, Users, LogOut 
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { 
  reorderAulasAction, 
  deleteAulaAction, 
  triggerIAAutomationAction, 
  createCursoAction,
  createAulaAction,
  clearDatabaseAction,
  resetDatabaseToSeedAction
} from "@/app/actions";
import { logoutAdminAction } from "@/lib/auth-admin";

interface Lesson {
  id: string;
  moduloId: string;
  titulo: string;
  descricaoApoio: string | null;
  videoUrl: string;
  legendasUrl: string | null;
  demonstrative: boolean;
  ordem: number;
}

interface Module {
  id: string;
  cursoId: string;
  titulo: string;
  ordem: number;
  aulas: Lesson[];
}

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  imagemCapa: string;
  ativo: boolean;
  modulos: Module[];
}

interface CmsAdminClientProps {
  initialCourses: Course[];
}

export default function CmsAdminClient({ initialCourses }: CmsAdminClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourses[0] || null);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [processingIAId, setProcessingIAId] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonUrl, setNewLessonUrl] = useState("");
  const [newLessonDemo, setNewLessonDemo] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState("");

  const [isClearingDb, setIsClearingDb] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, lessonId: string) => {
    setDraggedLessonId(lessonId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetLessonId: string) => {
    e.preventDefault();
    if (!draggedLessonId || draggedLessonId === targetLessonId) return;
    if (!selectedCourse) return;

    // Encontra o módulo e as aulas
    const activeCourse = { ...selectedCourse };
    let activeModuleIndex = -1;
    let activeLessonIndex = -1;
    let targetModuleIndex = -1;
    let targetLessonIndex = -1;

    for (let m = 0; m < activeCourse.modulos.length; m++) {
      const idx = activeCourse.modulos[m].aulas.findIndex(a => a.id === draggedLessonId);
      if (idx !== -1) {
        activeModuleIndex = m;
        activeLessonIndex = idx;
      }
      const tIdx = activeCourse.modulos[m].aulas.findIndex(a => a.id === targetLessonId);
      if (tIdx !== -1) {
        targetModuleIndex = m;
        targetLessonIndex = tIdx;
      }
    }

    if (activeModuleIndex === -1 || targetModuleIndex === -1 || activeModuleIndex !== targetModuleIndex) return;

    // Reordena localmente
    const moduleAulas = [...activeCourse.modulos[activeModuleIndex].aulas];
    const [draggedLesson] = moduleAulas.splice(activeLessonIndex, 1);
    moduleAulas.splice(targetLessonIndex, 0, draggedLesson);

    activeCourse.modulos[activeModuleIndex].aulas = moduleAulas.map((aula, index) => ({
      ...aula,
      ordem: index + 1
    }));

    setSelectedCourse(activeCourse);
    setCourses(prev => prev.map(c => c.id === activeCourse.id ? activeCourse : c));
  };

  const handleDragEnd = async () => {
    if (!draggedLessonId) return;
    setDraggedLessonId(null);
    if (!selectedCourse) return;

    // Encontra o módulo da aula reordenada
    let activeModule: Module | undefined;
    for (const m of selectedCourse.modulos) {
      if (m.aulas.some(a => a.id === draggedLessonId)) {
        activeModule = m;
        break;
      }
    }

    if (activeModule) {
      const ids = activeModule.aulas.map(a => a.id);
      const res = await reorderAulasAction(activeModule.id, ids);
      if (res.success) {
        toast.success("Ordem das aulas salva no banco de dados!");
      } else {
        toast.error("Erro ao salvar ordem no banco de dados.");
      }
    }
  };

  // Aciona o worker do BullMQ via Server Action
  const triggerIAAutomation = async (lessonId: string) => {
    setProcessingIAId(lessonId);
    toast.info("Processamento por IA enfileirado via BullMQ...");

    const res = await triggerIAAutomationAction(lessonId);
    if (res.success) {
      toast.success("Job de IA iniciado! O worker processará o vídeo no background e atualizará a legenda e o material de apoio em breve.");
    } else {
      toast.error(res.error || "Erro ao acionar automação de IA.");
    }
    setProcessingIAId(null);
  };

  // Exclui a aula da base
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    const res = await deleteAulaAction(lessonId);
    if (res.success) {
      toast.success("Aula excluída com sucesso!");
      if (!selectedCourse) return;
      
      // Atualiza localmente
      const activeCourse = { ...selectedCourse };
      activeCourse.modulos = activeCourse.modulos.map(m => ({
        ...m,
        aulas: m.aulas.filter(a => a.id !== lessonId)
      }));
      
      setSelectedCourse(activeCourse);
      setCourses(prev => prev.map(c => c.id === activeCourse.id ? activeCourse : c));
    } else {
      toast.error("Erro ao excluir aula no banco de dados.");
    }
  };

  // Cria um novo curso
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const res = await createCursoAction(newCourseTitle, newCourseDesc);
    if (res.success && res.course) {
      toast.success("Curso criado com sucesso!");
      
      const newCourse: Course = {
        id: res.course.id,
        titulo: res.course.titulo,
        descricao: res.course.descricao || "",
        imagemCapa: res.course.imagemCapa || "",
        ativo: res.course.ativo,
        modulos: [
          {
            id: "m-dummy",
            cursoId: res.course.id,
            titulo: "Módulo 1: Introdução",
            ordem: 1,
            aulas: []
          }
        ]
      };

      setCourses(prev => [...prev, newCourse]);
      setSelectedCourse(newCourse);
      setIsCreatingCourse(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
    } else {
      toast.error("Erro ao criar curso.");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !newLessonUrl.trim()) return;
    if (!selectedCourse) return;

    toast.info("Criando aula...");
    const res = await createAulaAction(targetModuleId, newLessonTitle, newLessonUrl, newLessonDemo);
    if (res.success && res.aula) {
      toast.success("Aula criada com sucesso!");
      
      const updatedCourse = { ...selectedCourse };
      updatedCourse.modulos = updatedCourse.modulos.map(m => {
        if (m.id === targetModuleId) {
          return {
            ...m,
            aulas: [...(m.aulas || []), {
              id: res.aula.id,
              moduloId: res.aula.moduloId,
              titulo: res.aula.titulo,
              descricaoApoio: res.aula.descricaoApoio,
              videoUrl: res.aula.videoUrl,
              legendasUrl: res.aula.legendasUrl,
              demonstrative: res.aula.demonstrative,
              ordem: res.aula.ordem
            }]
          };
        }
        return m;
      });

      setSelectedCourse(updatedCourse);
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      
      setIsCreatingLesson(false);
      setNewLessonTitle("");
      setNewLessonUrl("");
      setNewLessonDemo(false);
      setTargetModuleId("");
    } else {
      toast.error(res.error || "Erro ao criar aula.");
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm("Tem certeza que deseja LIMPAR todos os cursos, aulas e progresso? Isso não poderá ser desfeito.")) return;
    setIsClearingDb(true);
    const res = await clearDatabaseAction();
    if (res.success) {
      toast.success("Banco de dados limpo com sucesso!");
      setCourses([]);
      setSelectedCourse(null);
    } else {
      toast.error("Erro ao limpar banco de dados.");
    }
    setIsClearingDb(false);
  };

  const handleResetDatabase = async () => {
    if (!confirm("Tem certeza que deseja resetar o banco de dados para a semente original? Todos os dados atuais serão perdidos.")) return;
    setIsResettingDb(true);
    const res = await resetDatabaseToSeedAction();
    if (res.success) {
      toast.success("Banco de dados resetado para o padrão!");
      window.location.reload();
    } else {
      toast.error("Erro ao resetar banco de dados.");
    }
    setIsResettingDb(false);
  };

  const handleAdminLogout = async () => {
    const res = await logoutAdminAction();
    if (res.success) {
      toast.success("Sessão administrativa encerrada.");
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Header Admin */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <img src="/logo.png" alt="SISGR Academy" className="h-12 w-auto" />
          </Link>
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
            Painel CMS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleClearDatabase}
            disabled={isClearingDb}
            className="flex items-center gap-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
            title="Apaga todos os cursos e aulas do banco"
          >
            {isClearingDb ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Limpar EAD
          </button>
          
          <button
            onClick={handleResetDatabase}
            disabled={isResettingDb}
            className="flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
            title="Restaura os cursos de demonstração padrão"
          >
            {isResettingDb ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-purple-600" />}
            Resetar Padrão
          </button>

          <Link 
            href="/admin/alunos" 
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Gerenciar Alunos"
          >
            <Users className="h-4 w-4" />
            Alunos
          </Link>

          <Link 
            href="/admin/metricas" 
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white"
            title="Relatórios B2B"
          >
            <BarChart3 className="h-4 w-4" />
            Métricas B2B
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Ver como Aluno
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition-colors bg-white cursor-pointer"
            title="Sair do Painel Administrativo"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Grid CMS */}
      <div className="flex-1 grid lg:grid-cols-12 gap-8 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* Sidebar Lateral de Cursos */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-sm">Meus Cursos</h2>
              <button 
                onClick={() => setIsCreatingCourse(true)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors bg-white cursor-pointer"
                title="Criar Novo Curso"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all flex flex-col gap-1.5 ${
                    selectedCourse?.id === c.id
                      ? "border-emerald-600 bg-emerald-50/20 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="line-clamp-1">{c.titulo}</span>
                  <span className="text-3xs font-medium text-slate-400">
                    {c.modulos?.length || 0} Módulos • {c.modulos?.reduce((acc, curr) => acc + (curr.aulas?.length || 0), 0) || 0} Aulas
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Área Principal de Gerenciamento */}
        {selectedCourse ? (
          <main className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-3xs font-extrabold text-emerald-600 uppercase tracking-wider">Editor do Curso</span>
                <h1 className="text-2xl font-black text-slate-950">{selectedCourse.titulo}</h1>
              </div>

              {/* Lista de Módulos */}
              <div className="flex flex-col gap-6">
                {selectedCourse.modulos?.map((modulo) => (
                  <div key={modulo.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    {/* Módulo Header */}
                    <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-800">{modulo.titulo}</span>
                      </div>
                      <button
                        onClick={() => {
                          setTargetModuleId(modulo.id);
                          setIsCreatingLesson(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 text-3xs font-bold bg-white transition-colors cursor-pointer"
                        title="Adicionar Aula a este Módulo"
                      >
                        <Plus className="h-3 w-3" />
                        Nova Aula
                      </button>
                    </div>

                    {/* Listagem de Aulas */}
                    <div className="flex flex-col p-4 gap-3">
                      {modulo.aulas?.map((aula) => (
                        <div
                          key={aula.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, aula.id)}
                          onDragOver={(e) => handleDragOver(e, aula.id)}
                          onDragEnd={handleDragEnd}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs ${
                            draggedLessonId === aula.id ? "opacity-40 border-dashed" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <GripVertical className="h-4 w-4 text-slate-400 cursor-grab shrink-0" />
                            <PlayCircle className="h-5 w-5 text-slate-500 shrink-0" />
                            <div className="flex flex-col gap-0.5 truncate">
                              <span className="font-bold text-xs text-slate-800 truncate">{aula.titulo}</span>
                              <span className="text-3xs text-slate-400 truncate">Ordem: {aula.ordem}</span>
                            </div>
                          </div>

                          {/* Ações (IA / Excluir) */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {aula.legendasUrl ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-3xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                <CheckCircle className="h-3 w-3" />
                                Legendas OK
                              </span>
                            ) : (
                              <button
                                onClick={() => triggerIAAutomation(aula.id)}
                                disabled={processingIAId === aula.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-3xs font-bold text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                {processingIAId === aula.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                                    Processando...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 text-purple-600" />
                                    Legendar com IA
                                  </>
                                )}
                              </button>
                            )}

                            <button 
                              onClick={() => handleDeleteLesson(aula.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remover Aula"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!modulo.aulas || modulo.aulas.length === 0) && (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          Nenhuma aula cadastrada neste módulo.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : (
          <main className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center justify-center text-slate-500 text-sm font-semibold">
            Selecione ou crie um curso na barra lateral.
          </main>
        )}
      </div>

      {/* Modal de Criação de Curso */}
      {isCreatingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-900">Novo Curso</h2>
            <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Título do Curso</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  placeholder="Ex: Gestão Ambiental Integrada"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Descrição</label>
                <textarea
                  value={newCourseDesc}
                  onChange={e => setNewCourseDesc(e.target.value)}
                  placeholder="Descreva os objetivos do curso..."
                  rows={3}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCourse(false)}
                  className="px-4 py-2 border border-slate-350 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Criar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Criação de Aula */}
      {isCreatingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-900">Nova Aula</h2>
            <form onSubmit={handleCreateLesson} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Título da Aula</label>
                <input
                  type="text"
                  required
                  value={newLessonTitle}
                  onChange={e => setNewLessonTitle(e.target.value)}
                  placeholder="Ex: 1.3 Práticas de Coleta Seletiva"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">URL do Vídeo (MP4)</label>
                <input
                  type="text"
                  required
                  value={newLessonUrl}
                  onChange={e => setNewLessonUrl(e.target.value)}
                  placeholder="Ex: https://exemplo.com/video.mp4"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-3xs text-slate-400">Pode ser uma URL HTTP de vídeo real ou um caminho local.</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="demonstrative"
                  checked={newLessonDemo}
                  onChange={e => setNewLessonDemo(e.target.checked)}
                  className="rounded-xs border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="demonstrative" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Aula Demonstrativa (Acesso Gratuito)
                </label>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingLesson(false);
                    setNewLessonTitle("");
                    setNewLessonUrl("");
                    setNewLessonDemo(false);
                    setTargetModuleId("");
                  }}
                  className="px-4 py-2 border border-slate-350 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Adicionar Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

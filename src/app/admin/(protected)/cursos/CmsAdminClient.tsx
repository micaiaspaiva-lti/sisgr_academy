"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, Folder, PlayCircle, Sparkles, 
  UserCheck, BarChart3, GripVertical, CheckCircle, 
  Trash2, Loader2, ArrowLeft, Users, LogOut, Pencil, Eye, EyeOff
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { 
  reorderAulasAction, 
  deleteAulaAction, 
  triggerIAAutomationAction, 
  createCursoAction,
  createAulaAction,
  clearDatabaseAction,
  resetDatabaseToSeedAction,
  updateCursoAction,
  updateAulaAction
} from "@/app/actions";
import { logoutAdminAction } from "@/lib/auth-admin";

interface Lesson {
  id: string;
  moduloId: string;
  titulo: string;
  descricaoApoio: string | null;
  videoUrl: string;
  legendasUrl: string | null;
  imagemCapa: string | null;
  demonstrative: boolean;
  ativo: boolean;
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
  tipo: "publico" | "vip";
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
  const [newCourseTipo, setNewCourseTipo] = useState<"publico" | "vip">("publico");
  const [newCourseImage, setNewCourseImage] = useState("");

  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonUrl, setNewLessonUrl] = useState("");
  const [newLessonDemo, setNewLessonDemo] = useState(false);
  const [newLessonImage, setNewLessonImage] = useState("");
  const [targetModuleId, setTargetModuleId] = useState("");

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDesc, setEditCourseDesc] = useState("");
  const [editCourseTipo, setEditCourseTipo] = useState<"publico" | "vip">("publico");
  const [editCourseImage, setEditCourseImage] = useState("");
  const [editCourseAtivo, setEditCourseAtivo] = useState(true);

  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonUrl, setEditLessonUrl] = useState("");
  const [editLessonDemo, setEditLessonDemo] = useState(false);
  const [editLessonImage, setEditLessonImage] = useState("");
  const [editLessonAtivo, setEditLessonAtivo] = useState(true);

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

    const res = await createCursoAction(newCourseTitle, newCourseDesc, newCourseTipo, newCourseImage);
    if (res.success && res.course) {
      toast.success("Curso criado com sucesso!");
      
      const newCourse: Course = {
        id: res.course.id,
        titulo: res.course.titulo,
        descricao: res.course.descricao || "",
        imagemCapa: res.course.imagemCapa || "",
        ativo: res.course.ativo,
        tipo: (res.course.tipo || "publico") as "publico" | "vip",
        modulos: [
          {
            id: res.module?.id || "m-dummy",
            cursoId: res.course.id,
            titulo: res.module?.titulo || "Módulo 1: Introdução",
            ordem: res.module?.ordem || 1,
            aulas: []
          }
        ]
      };

      setCourses(prev => [...prev, newCourse]);
      setSelectedCourse(newCourse);
      setIsCreatingCourse(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      setNewCourseImage("");
      setNewCourseTipo("publico");
    } else {
      toast.error("Erro ao criar curso.");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !newLessonUrl.trim()) return;
    if (!selectedCourse) return;

    toast.info("Criando aula...");
    const isDemo = selectedCourse.tipo === "publico" ? true : newLessonDemo;
    const res = await createAulaAction(targetModuleId, newLessonTitle, newLessonUrl, isDemo, newLessonImage);
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
              imagemCapa: res.aula.imagemCapa,
              demonstrative: res.aula.demonstrative,
              ativo: res.aula.ativo,
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
      setNewLessonImage("");
      setNewLessonDemo(false);
      setTargetModuleId("");
    } else {
      toast.error(res.error || "Erro ao criar aula.");
    }
  };
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editCourseTitle.trim()) return;

    toast.info("Salvando curso...");
    const res = await updateCursoAction(
      selectedCourse.id,
      editCourseTitle,
      editCourseDesc,
      editCourseTipo,
      editCourseImage,
      editCourseAtivo
    );

    if (res.success && res.course) {
      toast.success("Curso atualizado com sucesso!");
      const updated: Course = {
        ...selectedCourse,
        titulo: res.course.titulo,
        descricao: res.course.descricao || "",
        imagemCapa: res.course.imagemCapa || "",
        tipo: (res.course.tipo || "publico") as "publico" | "vip",
        ativo: res.course.ativo
      };
      setSelectedCourse(updated);
      setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
      setIsEditingCourse(false);
    } else {
      toast.error("Erro ao atualizar curso.");
    }
  };

  const handleToggleCoursePublish = async (course: Course) => {
    const newAtivo = !course.ativo;
    toast.info(newAtivo ? "Publicando curso..." : "Colocando curso em rascunho...");
    const res = await updateCursoAction(
      course.id,
      course.titulo,
      course.descricao,
      course.tipo,
      course.imagemCapa,
      newAtivo
    );

    if (res.success && res.course) {
      toast.success(newAtivo ? "Curso publicado!" : "Curso colocado em rascunho.");
      const updated = { ...course, ativo: res.course.ativo };
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(updated);
      }
      setCourses(prev => prev.map(c => c.id === course.id ? updated : c));
    } else {
      toast.error("Erro ao alterar status do curso.");
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editingLesson || !editLessonTitle.trim() || !editLessonUrl.trim()) return;

    toast.info("Salvando aula...");
    const res = await updateAulaAction(
      editingLesson.id,
      editLessonTitle,
      editLessonUrl,
      editLessonDemo,
      editLessonImage,
      editLessonAtivo
    );

    if (res.success && res.aula) {
      toast.success("Aula atualizada com sucesso!");
      const updatedCourse = { ...selectedCourse };
      updatedCourse.modulos = updatedCourse.modulos.map(m => {
        if (m.id === editingLesson.moduloId) {
          return {
            ...m,
            aulas: m.aulas.map(a => a.id === editingLesson.id ? {
              ...a,
              titulo: res.aula!.titulo,
              videoUrl: res.aula!.videoUrl,
              demonstrative: res.aula!.demonstrative,
              imagemCapa: res.aula!.imagemCapa,
              ativo: res.aula!.ativo
            } : a)
          };
        }
        return m;
      });

      setSelectedCourse(updatedCourse);
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      setIsEditingLesson(false);
      setEditingLesson(null);
    } else {
      toast.error("Erro ao atualizar aula.");
    }
  };

  const handleToggleLessonPublish = async (lesson: Lesson) => {
    const newAtivo = !lesson.ativo;
    toast.info(newAtivo ? "Publicando aula..." : "Colocando aula em rascunho...");
    const res = await updateAulaAction(
      lesson.id,
      lesson.titulo,
      lesson.videoUrl,
      lesson.demonstrative,
      lesson.imagemCapa,
      newAtivo
    );

    if (res.success && res.aula) {
      toast.success(newAtivo ? "Aula publicada!" : "Aula colocada em rascunho.");
      if (!selectedCourse) return;
      const updatedCourse = { ...selectedCourse };
      updatedCourse.modulos = updatedCourse.modulos.map(m => {
        if (m.id === lesson.moduloId) {
          return {
            ...m,
            aulas: m.aulas.map(a => a.id === lesson.id ? {
              ...a,
              ativo: res.aula!.ativo
            } : a)
          };
        }
        return m;
      });

      setSelectedCourse(updatedCourse);
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    } else {
      toast.error("Erro ao alterar status da aula.");
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
                      ? "border-duet-brand bg-duet-brand-light text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-center w-full gap-2">
                    <span className={`line-clamp-1 flex-grow ${!c.ativo ? "text-slate-400 line-through decoration-slate-300" : ""}`}>{c.titulo}</span>
                    <div className="flex gap-1.5 items-center">
                      {!c.ativo && (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-550 border border-slate-200 uppercase tracking-wider">
                          Rascunho
                        </span>
                      )}
                      {c.tipo === "vip" ? (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-800 ring-1 ring-inset ring-amber-600/10 uppercase tracking-wider">
                          VIP
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-600/10 uppercase tracking-wider">
                          Púb
                        </span>
                      )}
                    </div>
                  </div>
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
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xs font-extrabold text-duet-brand uppercase tracking-wider">Editor do Curso</span>
                    {selectedCourse.tipo === "vip" ? (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 ring-1 ring-inset ring-amber-600/20 uppercase tracking-wider">
                        VIP (Exclusivo B2B)
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase tracking-wider">
                        Público Geral
                      </span>
                    )}
                    {selectedCourse.ativo ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border border-slate-200">
                        Rascunho
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black text-slate-950 leading-tight">{selectedCourse.titulo}</h1>
                  {selectedCourse.descricao && (
                    <p className="text-xs font-medium text-slate-500 line-clamp-2">{selectedCourse.descricao}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditCourseTitle(selectedCourse.titulo);
                      setEditCourseDesc(selectedCourse.descricao || "");
                      setEditCourseTipo(selectedCourse.tipo);
                      setEditCourseImage(selectedCourse.imagemCapa || "");
                      setEditCourseAtivo(selectedCourse.ativo);
                      setIsEditingCourse(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold bg-white transition-colors cursor-pointer animate-in fade-in duration-200"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-550" />
                    Editar
                  </button>

                  <button
                    onClick={() => handleToggleCoursePublish(selectedCourse)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      selectedCourse.ativo
                        ? "border-amber-250 bg-amber-50 hover:bg-amber-100 text-amber-800"
                        : "border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedCourse.ativo ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Despublicar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 text-emerald-650" />
                        Publicar
                      </>
                    )}
                  </button>
                </div>
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
                          } ${!aula.ativo ? "bg-slate-50/50" : ""}`}
                        >
                           <div className="flex items-center gap-3 truncate">
                             <GripVertical className="h-4 w-4 text-slate-400 cursor-grab shrink-0" />
                             <PlayCircle className={`h-5 w-5 shrink-0 ${!aula.ativo ? "text-slate-300" : "text-slate-500"}`} />
                             {aula.imagemCapa && (
                               <img 
                                 src={aula.imagemCapa} 
                                 alt="" 
                                 className="h-8 w-14 object-cover rounded-md border border-slate-200 shrink-0 shadow-2xs"
                               />
                             )}
                             <div className="flex flex-col gap-0.5 truncate">
                              <div className="flex items-center gap-2 truncate">
                                <span className={`font-bold text-xs truncate ${!aula.ativo ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"}`}>
                                  {aula.titulo}
                                </span>
                                {aula.demonstrative && (
                                  <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-50 px-1 py-0.5 text-[8px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 uppercase tracking-wider">
                                    Demo
                                  </span>
                                )}
                                {!aula.ativo && (
                                  <span className="inline-flex shrink-0 items-center rounded-md bg-slate-100 px-1 py-0.5 text-[8px] font-bold text-slate-500 border border-slate-200 uppercase tracking-wider">
                                    Rascunho
                                  </span>
                                )}
                              </div>
                              <span className="text-3xs text-slate-400 truncate">Ordem: {aula.ordem} • {aula.videoUrl}</span>
                            </div>
                          </div>

                          {/* Ações (Editar, Publicar, IA, Excluir) */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center">
                            {/* Botão Publicar/Despublicar Aula */}
                            <button
                              onClick={() => handleToggleLessonPublish(aula)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                aula.ativo
                                  ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                                  : "border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              }`}
                              title={aula.ativo ? "Colocar aula em rascunho (Despublicar)" : "Publicar aula"}
                            >
                              {aula.ativo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>

                            {/* Botão Editar Aula */}
                            <button
                              onClick={() => {
                                setEditingLesson(aula);
                                setEditLessonTitle(aula.titulo);
                                setEditLessonUrl(aula.videoUrl);
                                setEditLessonDemo(aula.demonstrative);
                                setEditLessonImage(aula.imagemCapa || "");
                                setEditLessonAtivo(aula.ativo);
                                setIsEditingLesson(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-650 bg-white transition-colors cursor-pointer"
                              title="Editar Aula"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Imagem de Capa (URL)</label>
                <input
                  type="text"
                  value={newCourseImage}
                  onChange={e => setNewCourseImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... ou outro link"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Classificação</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewCourseTipo("publico")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newCourseTipo === "publico"
                        ? "border-emerald-600 bg-duet-brand text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                     Público Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCourseTipo("vip")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newCourseTipo === "vip"
                        ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                     VIP (Clientes)
                  </button>
                </div>
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Imagem de Capa / Thumbnail (URL)</label>
                <input
                  type="text"
                  value={newLessonImage}
                  onChange={e => setNewLessonImage(e.target.value)}
                  placeholder="Ex: https://imagens.unsplash.com/foto... (opcional)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              {selectedCourse?.tipo === "vip" && (
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
              )}
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
      {/* Modal de Edição de Curso */}
      {isEditingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-900">Editar Curso</h2>
            <form onSubmit={handleUpdateCourse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Título do Curso</label>
                <input
                  type="text"
                  required
                  value={editCourseTitle}
                  onChange={e => setEditCourseTitle(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Descrição</label>
                <textarea
                  value={editCourseDesc}
                  onChange={e => setEditCourseDesc(e.target.value)}
                  rows={3}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Imagem de Capa (URL)</label>
                <input
                  type="text"
                  value={editCourseImage}
                  onChange={e => setEditCourseImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... ou outro link"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Classificação</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditCourseTipo("publico")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editCourseTipo === "publico"
                        ? "border-emerald-600 bg-duet-brand text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                     Público Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCourseTipo("vip")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editCourseTipo === "vip"
                        ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                     VIP (Clientes)
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCourse(false)}
                  className="px-4 py-2 border border-slate-350 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Aula */}
      {isEditingLesson && editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-900">Editar Aula</h2>
            <form onSubmit={handleUpdateLesson} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Título da Aula</label>
                <input
                  type="text"
                  required
                  value={editLessonTitle}
                  onChange={e => setEditLessonTitle(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">URL do Vídeo</label>
                <input
                  type="text"
                  required
                  value={editLessonUrl}
                  onChange={e => setEditLessonUrl(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Imagem de Capa / Thumbnail (URL)</label>
                <input
                  type="text"
                  value={editLessonImage}
                  onChange={e => setEditLessonImage(e.target.value)}
                  placeholder="Ex: https://imagens.unsplash.com/foto... (opcional)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              {selectedCourse?.tipo === "vip" && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="edit-demonstrative"
                    checked={editLessonDemo}
                    onChange={e => setEditLessonDemo(e.target.checked)}
                    className="rounded-xs border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <label htmlFor="edit-demonstrative" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Aula Demonstrativa (Acesso Gratuito)
                  </label>
                </div>
              )}
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLesson(false);
                    setEditingLesson(null);
                  }}
                  className="px-4 py-2 border border-slate-350 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

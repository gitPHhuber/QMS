import React, { useEffect, useState, useCallback, DragEvent } from "react";
import {
  ProductionTask,
  TaskDetailResponse,
  fetchTasks,
  fetchTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
} from "src/api/tasksApi";
import { fetchProjects, ProjectModel } from "src/api/projectsApi";
import { fetchUsers } from "src/api/userApi";
import { fetchStructure } from "src/api/structureApi";
import { userGetModel } from "src/types/UserModel";
import { SectionModel } from "src/store/StructureStore";
import {
  Plus,
  Loader2,
  MapPin,
  GripVertical,
  Edit3,
  Save,
  X,
  Briefcase,
  Clock,
  CheckCircle2,
  Circle,
  User as UserIcon,
  Calendar,
  ChevronUp,
  ChevronDown,
  Minus,
  Package,
} from "lucide-react";
import { Modal } from "src/components/Modal/Modal";

/* ── Types ── */
interface TaskStats {
  total: number;
  done: number;
  inWork: number;
  onStock: number;
}
interface ExtendedTask extends ProductionTask {
  stats?: TaskStats;
}

/* ── Column config ── */
const COLUMNS = [
  {
    key: "NEW",
    label: "НОВЫЕ",
    icon: Circle,
    headerBg: "bg-blue-500/10",
    headerBorder: "border-blue-500/20",
    textColor: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300",
    dotColor: "bg-blue-400",
    dropHighlight: "border-blue-500/40 bg-blue-500/5",
  },
  {
    key: "IN_PROGRESS",
    label: "В РАБОТЕ",
    icon: Clock,
    headerBg: "bg-amber-500/10",
    headerBorder: "border-amber-500/20",
    textColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
    dotColor: "bg-amber-400",
    dropHighlight: "border-amber-500/40 bg-amber-500/5",
  },
  {
    key: "DONE",
    label: "ГОТОВО",
    icon: CheckCircle2,
    headerBg: "bg-emerald-500/10",
    headerBorder: "border-emerald-500/20",
    textColor: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
    dotColor: "bg-emerald-400",
    dropHighlight: "border-emerald-500/40 bg-emerald-500/5",
  },
] as const;

/* ── Origin type style map ── */
const TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  PRODUCT: {
    label: "Изделие",
    cls: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  },
  COMPONENT: {
    label: "Компонент",
    cls: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  },
};

/* ── Priority helpers ── */
const priorityMeta = (p: number | null | undefined) => {
  if (p === 3)
    return {
      text: "Высокий",
      cls: "bg-red-500/15 text-red-400 border-red-500/25",
      iconCls: "text-red-400",
      Icon: ChevronUp,
    };
  if (p === 2)
    return {
      text: "Средний",
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      iconCls: "text-amber-400",
      Icon: Minus,
    };
  return {
    text: "Низкий",
    cls: "bg-slate-700/40 text-slate-400 border-slate-600/40",
    iconCls: "text-slate-500",
    Icon: ChevronDown,
  };
};

/* ── Initials from name ── */
const getInitials = (name?: string, surname?: string): string => {
  const s = (surname || "")[0] || "";
  const n = (name || "")[0] || "";
  return (s + n).toUpperCase();
};

/* ── ID prefix from origin type ── */
const taskIdLabel = (task: ExtendedTask): string => {
  if (task.originType === "PRODUCT") return `ПР-${String(task.id).padStart(3, "0")}`;
  if (task.originType === "COMPONENT") return `КМП-${String(task.id).padStart(3, "0")}`;
  return `#${String(task.id).padStart(3, "0")}`;
};

/* ══════════════════════════════════════════════ */
/*                  Props                         */
/* ══════════════════════════════════════════════ */
interface Props {
  searchQuery: string;
  activeFilter: string;
  selectedUserId: string;
}

/* ══════════════════════════════════════════════ */
/*              TasksList Component                */
/* ══════════════════════════════════════════════ */
const TasksList: React.FC<Props> = ({
  searchQuery,
  activeFilter,
  selectedUserId,
}) => {
  /* ── State ── */
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetailResponse | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [_sections, setSections] = useState<SectionModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    priority: "1",
    targetQty: "",
  });
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ page: 1, limit: 200 });
      setTasks(res.rows as unknown as ExtendedTask[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchUsers().then(setUsers);
    fetchStructure().then(setSections);
    fetchProjects().then(setProjects);
  }, [loadData]);

  /* ── Client-side filtering ── */
  const filteredTasks = tasks.filter((task) => {
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (activeFilter !== "ALL" && task.originType !== activeFilter) return false;
    if (selectedUserId && String(task.responsibleId) !== selectedUserId)
      return false;
    return true;
  });

  /* ── Task selection ── */
  const handleSelectTask = async (id: number) => {
    setIsEditing(false);
    try {
      const res = await fetchTaskById(id);
      setSelectedTask(res);
    } catch (e) {
      console.error("Error loading task details:", e);
    }
  };

  /* ── Editing ── */
  const startEditing = () => {
    if (!selectedTask) return;
    setEditForm({
      priority: selectedTask.task.priority,
      dueDate: selectedTask.task.dueDate,
      responsibleId: selectedTask.task.responsibleId,
      sectionId: selectedTask.task.sectionId,
      projectId: selectedTask.task.projectId,
      status: selectedTask.task.status,
    });
    setIsEditing(true);
  };

  const saveChanges = async () => {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask.task.id, editForm);
      setIsEditing(false);
      handleSelectTask(selectedTask.task.id);
      loadData();
    } catch (e) {
      console.error("Error saving:", e);
    }
  };

  /* ── Drag & Drop ── */
  const onDragStart = (e: DragEvent, task: ExtendedTask) => {
    e.dataTransfer.setData("taskId", String(task.id));
    e.dataTransfer.setData("fromStatus", task.status);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const onDragOver = (e: DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const onDragLeave = () => setDragOverCol(null);

  const onDrop = async (e: DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (isNaN(taskId) || fromStatus === toStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: toStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, toStatus);
      if (selectedTask?.task.id === taskId) handleSelectTask(taskId);
    } catch (e) {
      console.error("Error updating task status:", e);
      loadData();
    }
  };

  /* ── Group by status ── */
  const grouped: Record<string, ExtendedTask[]> = {
    NEW: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  filteredTasks.forEach((t) => {
    const key = t.status in grouped ? t.status : "NEW";
    grouped[key].push(t);
  });

  /* ══════════════════════════════════════════════ */
  /*                   Render                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ── Kanban Board ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = grouped[col.key] || [];
          const isDragTarget = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[420px] ${
                isDragTarget
                  ? col.dropHighlight
                  : "border-slate-700/40 bg-slate-900/30"
              }`}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.key)}
            >
              {/* ── Column header ── */}
              <div
                className={`flex items-center justify-between px-4 py-3.5 rounded-t-2xl border-b ${col.headerBorder} ${col.headerBg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${col.dotColor}`}
                  />
                  <span
                    className={`text-xs font-bold tracking-wider ${col.textColor}`}
                  >
                    {col.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}
                  >
                    {colTasks.length}
                  </span>
                </div>
                {col.key === "NEW" && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={`p-1 rounded-md hover:bg-slate-700/50 ${col.textColor} transition`}
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>

              {/* ── Cards ── */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-hide">
                {loading && colTasks.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2
                      className="animate-spin text-slate-600"
                      size={22}
                    />
                  </div>
                )}

                {colTasks.map((task) => {
                  const stats = task.stats || {
                    done: 0,
                    inWork: 0,
                    onStock: 0,
                    total: 0,
                  };
                  const pDone =
                    task.targetQty > 0
                      ? Math.min(
                          100,
                          Math.round((stats.done / task.targetQty) * 100)
                        )
                      : 0;
                  const projName = projects.find(
                    (p) => p.id === task.projectId
                  )?.title;
                  const prio = priorityMeta(task.priority);
                  const isDragging = draggingId === task.id;
                  const isSelected = selectedTask?.task.id === task.id;
                  const typeStyle = task.originType
                    ? TYPE_STYLES[task.originType]
                    : null;
                  const resp = task.responsible;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      onClick={() => handleSelectTask(task.id)}
                      className={`group relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? "opacity-30 scale-95 rotate-1 border-teal-500/50"
                          : isSelected
                          ? "border-teal-500/60 bg-slate-800/80 ring-1 ring-teal-500/20 shadow-lg shadow-teal-500/5"
                          : "border-slate-700/40 bg-slate-800/50 hover:border-slate-600/60 hover:bg-slate-800/70 hover:shadow-md hover:shadow-black/20"
                      }`}
                    >
                      {/* Drag handle (appears on hover) */}
                      <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical
                          size={14}
                          className="text-slate-600"
                        />
                      </div>

                      {/* ID + Type badge row */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {taskIdLabel(task)}
                        </span>
                        {typeStyle && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${typeStyle.cls}`}
                          >
                            {typeStyle.label}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-slate-200 leading-snug mb-2 pr-4">
                        {task.title}
                      </h4>

                      {/* Progress bar */}
                      {task.targetQty > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500 font-medium">
                              Прогресс
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {pDone}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pDone}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                pDone >= 100
                                  ? "bg-emerald-500"
                                  : pDone > 50
                                  ? "bg-teal-500"
                                  : "bg-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {projName && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                            <Briefcase size={9} />
                            {projName}
                          </span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-slate-700/40 pt-2.5 mt-auto">
                        <div className="flex items-center justify-between">
                          {/* Left: avatar + date */}
                          <div className="flex items-center gap-2">
                            {resp ? (
                              <span
                                className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-cyan-700 text-[9px] font-bold text-white"
                                title={`${resp.surname} ${resp.name}`}
                              >
                                {getInitials(resp.name, resp.surname)}
                              </span>
                            ) : (
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/60">
                                <UserIcon
                                  size={11}
                                  className="text-slate-500"
                                />
                              </span>
                            )}

                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Calendar size={10} />
                                {new Date(task.dueDate).toLocaleDateString(
                                  "ru",
                                  { day: "numeric", month: "short" }
                                )}
                              </span>
                            )}

                            {task.targetQty > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <Package size={10} />
                                {stats.done}/{task.targetQty}
                              </span>
                            )}
                          </div>

                          {/* Right: priority */}
                          <prio.Icon
                            size={14}
                            className={prio.iconCls}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {!loading && colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                    <col.icon size={28} className="mb-3 opacity-40" />
                    <span className="text-xs font-medium">Нет задач</span>
                  </div>
                )}
              </div>

              {/* Add button at bottom of NEW column */}
              {col.key === "NEW" && (
                <div className="p-3 border-t border-slate-700/30">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2.5 border border-dashed border-slate-600/50 rounded-xl text-slate-500 text-xs font-semibold hover:border-teal-500/40 hover:text-teal-400 hover:bg-teal-500/5 transition-all flex justify-center items-center gap-2"
                  >
                    <Plus size={14} /> Новая задача
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Detail panel ── */}
      {selectedTask && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/10 animate-slide-in-up">
          {/* Header */}
          <div className="flex justify-between items-start mb-5 border-b border-slate-700/40 pb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {taskIdLabel(selectedTask.task as ExtendedTask)}
                </span>
                {selectedTask.task.originType &&
                  TYPE_STYLES[selectedTask.task.originType] && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        TYPE_STYLES[selectedTask.task.originType].cls
                      }`}
                    >
                      {TYPE_STYLES[selectedTask.task.originType].label}
                    </span>
                  )}
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {selectedTask.task.title}
              </h2>
              {selectedTask.task.comment && (
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {selectedTask.task.comment}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              {isEditing ? (
                <>
                  <button
                    onClick={saveChanges}
                    className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl hover:bg-emerald-500/25 transition border border-emerald-500/20"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2.5 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-slate-700 transition border border-slate-600/30"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditing}
                    className="p-2.5 bg-teal-500/15 text-teal-400 rounded-xl hover:bg-teal-500/25 transition border border-teal-500/20"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2.5 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-slate-700 transition border border-slate-600/30"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Status */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Статус
              </span>
              {isEditing ? (
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="NEW">НОВАЯ</option>
                  <option value="IN_PROGRESS">В РАБОТЕ</option>
                  <option value="DONE">ГОТОВО</option>
                </select>
              ) : (
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    COLUMNS.find((c) => c.key === selectedTask.task.status)
                      ?.badge || "text-slate-400"
                  }`}
                >
                  {COLUMNS.find((c) => c.key === selectedTask.task.status)
                    ?.label || selectedTask.task.status}
                </span>
              )}
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Проект
              </span>
              {isEditing ? (
                <select
                  value={editForm.projectId || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      projectId: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="">Без проекта</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-indigo-400 font-medium">
                  {projects.find(
                    (p) => p.id === selectedTask.task.projectId
                  )?.title || "—"}
                </span>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Приоритет
              </span>
              {isEditing ? (
                <select
                  value={editForm.priority || 1}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="1">Низкий</option>
                  <option value="2">Средний</option>
                  <option value="3">Высокий</option>
                </select>
              ) : (() => {
                const pm = priorityMeta(selectedTask.task.priority);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold ${pm.cls}`}
                  >
                    <pm.Icon size={12} />
                    {pm.text}
                  </span>
                );
              })()}
            </div>

            {/* Responsible */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Ответственный
              </span>
              {isEditing ? (
                <select
                  value={editForm.responsibleId || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      responsibleId: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="">Не назначен</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.surname} {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-300">
                  {selectedTask.task.responsible
                    ? `${selectedTask.task.responsible.surname} ${selectedTask.task.responsible.name}`
                    : "—"}
                </span>
              )}
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Срок сдачи
              </span>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.dueDate || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                />
              ) : (
                <span className="text-sm text-slate-300">
                  {selectedTask.task.dueDate
                    ? new Date(selectedTask.task.dueDate).toLocaleDateString(
                        "ru"
                      )
                    : "—"}
                </span>
              )}
            </div>
          </div>

          {/* Breakdown */}
          {selectedTask.breakdown.length > 0 && (
            <>
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-slate-700/40 pt-4 mb-3">
                <MapPin size={14} className="text-teal-400" />
                Локализация изделий
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedTask.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/40 rounded-xl text-sm"
                  >
                    <span className="text-slate-300">
                      {item.sectionTitle || "Склад"}
                    </span>
                    <span className="font-bold text-slate-100">
                      {item.qty} шт
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-slate-800 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100 mb-5">
            Создать задачу
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                Название
              </label>
              <input
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition"
                placeholder="Введите название задачи"
                value={createForm.title || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                Проект
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none transition"
                value={createForm.projectId || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, projectId: e.target.value })
                }
              >
                <option value="">Без проекта</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                  Тип
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none transition"
                  value={createForm.originType || "PRODUCT"}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      originType: e.target.value,
                    })
                  }
                >
                  <option value="PRODUCT">Изделие</option>
                  <option value="COMPONENT">Комплектующее</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                  ID объекта
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none transition"
                  placeholder="ID"
                  value={createForm.originId || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, originId: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                Целевое количество
              </label>
              <input
                type="number"
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm font-semibold placeholder:text-slate-500 placeholder:font-normal focus:border-teal-500/50 focus:outline-none transition"
                placeholder="Количество (шт)"
                value={createForm.targetQty}
                onChange={(e) =>
                  setCreateForm({ ...createForm, targetQty: e.target.value })
                }
              />
            </div>

            <button
              onClick={async () => {
                if (!createForm.title || !createForm.targetQty) return;
                await createTask({
                  ...createForm,
                  targetQty: Number(createForm.targetQty),
                  originId: createForm.originId
                    ? Number(createForm.originId)
                    : undefined,
                  projectId: createForm.projectId
                    ? Number(createForm.projectId)
                    : undefined,
                });
                setIsModalOpen(false);
                setCreateForm({ priority: "1", targetQty: "" });
                loadData();
              }}
              className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-teal-500/20"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksList;

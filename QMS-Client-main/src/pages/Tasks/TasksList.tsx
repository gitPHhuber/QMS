import React, { useEffect, useState, useCallback, DragEvent, useMemo } from "react";
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
import { userGetModel } from "src/types/UserModel";
import {
  Plus, Loader2, GripVertical, Edit3, Save, X, Briefcase, Clock,
  CheckCircle2, Circle, User as UserIcon, Calendar, Search,
  AlertTriangle, Eye, Archive, Filter, MapPin, ChevronRight,
  LayoutGrid, List,
} from "lucide-react";
import { Modal } from "src/components/Modal/Modal";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface TaskStats { total: number; done: number; inWork: number; onStock: number; }
interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

/* ─── Column config ─────────────────────────────────────────────────── */

const COLUMNS = [
  { key: "NEW",         label: "Новые",       icon: Circle,       accent: "blue",   borderActive: "border-blue-500",   headerBg: "bg-blue-500/10",  textColor: "text-blue-400",   badge: "bg-blue-900/40 text-blue-300",   dotColor: "bg-blue-500" },
  { key: "IN_PROGRESS", label: "В работе",    icon: Clock,        accent: "amber",  borderActive: "border-amber-500",  headerBg: "bg-amber-500/10", textColor: "text-amber-400",  badge: "bg-amber-900/40 text-amber-300", dotColor: "bg-amber-500" },
  { key: "REVIEW",      label: "На проверке", icon: Eye,          accent: "violet", borderActive: "border-violet-500", headerBg: "bg-violet-500/10",textColor: "text-violet-400", badge: "bg-violet-900/40 text-violet-300",dotColor: "bg-violet-500" },
  { key: "DONE",        label: "Готово",      icon: CheckCircle2, accent: "green",  borderActive: "border-green-500",  headerBg: "bg-green-500/10", textColor: "text-green-400",  badge: "bg-green-900/40 text-green-300",  dotColor: "bg-green-500" },
  { key: "CLOSED",      label: "Закрыто",     icon: Archive,      accent: "slate",  borderActive: "border-slate-500",  headerBg: "bg-slate-600/10", textColor: "text-slate-400",  badge: "bg-slate-700/40 text-slate-300",  dotColor: "bg-slate-500" },
] as const;

/* ─── Source / origin filters ───────────────────────────────────────── */

const SOURCE_FILTERS = [
  { key: "ALL",        label: "Все" },
  { key: "NC",         label: "NC" },
  { key: "CAPA",       label: "CAPA" },
  { key: "RISK",       label: "Риск" },
  { key: "AUDIT",      label: "Аудит" },
  { key: "TRAINING",   label: "Обучение" },
  { key: "PRODUCT",    label: "Изделие" },
  { key: "COMPONENT",  label: "Компонент" },
];

const sourceStyle: Record<string, string> = {
  NC:        "bg-red-900/30 text-red-400 border-red-800/50",
  CAPA:      "bg-orange-900/30 text-orange-400 border-orange-800/50",
  RISK:      "bg-rose-900/30 text-rose-400 border-rose-800/50",
  AUDIT:     "bg-violet-900/30 text-violet-400 border-violet-800/50",
  TRAINING:  "bg-cyan-900/30 text-cyan-400 border-cyan-800/50",
  PRODUCT:   "bg-indigo-900/30 text-indigo-400 border-indigo-800/50",
  COMPONENT: "bg-purple-900/30 text-purple-400 border-purple-800/50",
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

const priorityDot = (p: number | null | undefined) => {
  if (p === 3) return { cls: "bg-red-500", title: "Высокий" };
  if (p === 2) return { cls: "bg-amber-500", title: "Средний" };
  return { cls: "bg-slate-500", title: "Низкий" };
};

const initials = (u?: { name: string; surname: string } | null) => {
  if (!u) return "?";
  return `${(u.surname || "")[0] || ""}${(u.name || "")[0] || ""}`.toUpperCase();
};

const isOverdue = (d?: string | null) => {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toISOString().slice(0, 10));
};

/* ─── Component ─────────────────────────────────────────────────────── */

const TasksList: React.FC = () => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");

  // View mode
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Drag state
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // Drawer
  const [drawerTask, setDrawerTask] = useState<TaskDetailResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({ priority: "1", targetQty: "" });

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ page: 1, limit: 500 });
      setTasks(res.rows as unknown as ExtendedTask[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    fetchUsers().then(setUsers);
    fetchProjects().then(setProjects);
  }, [loadData]);

  /* ── Drawer ── */
  const openDrawer = async (id: number) => {
    setIsEditing(false);
    try {
      const res = await fetchTaskById(id);
      setDrawerTask(res);
      setDrawerOpen(true);
    } catch (e) { console.error(e); }
  };

  const closeDrawer = () => { setDrawerOpen(false); setIsEditing(false); };

  const startEditing = () => {
    if (!drawerTask) return;
    setEditForm({
      priority: drawerTask.task.priority,
      dueDate: drawerTask.task.dueDate,
      responsibleId: drawerTask.task.responsibleId,
      projectId: drawerTask.task.projectId,
      status: drawerTask.task.status,
      comment: drawerTask.task.comment || "",
    });
    setIsEditing(true);
  };

  const saveChanges = async () => {
    if (!drawerTask) return;
    try {
      await updateTask(drawerTask.task.id, editForm);
      setIsEditing(false);
      openDrawer(drawerTask.task.id);
      loadData();
    } catch (e) { console.error(e); }
  };

  /* ── Drag & Drop ── */
  const onDragStart = (e: DragEvent, task: ExtendedTask) => {
    e.dataTransfer.setData("taskId", String(task.id));
    e.dataTransfer.setData("fromStatus", task.status);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
  };
  const onDragEnd = () => { setDraggingId(null); setDragOverCol(null); };
  const onDragOver = (e: DragEvent, colKey: string) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(colKey); };
  const onDragLeave = () => setDragOverCol(null);

  const onDrop = async (e: DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (isNaN(taskId) || fromStatus === toStatus) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t));
    try {
      await updateTaskStatus(taskId, toStatus);
      if (drawerTask?.task.id === taskId) openDrawer(taskId);
    } catch {
      loadData();
    }
  };

  /* ── Filtered & grouped tasks ── */
  const filtered = useMemo(() => {
    let list = tasks;
    if (sourceFilter !== "ALL") list = list.filter(t => t.originType === sourceFilter);
    if (assigneeFilter) list = list.filter(t => String(t.responsibleId) === assigneeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.comment?.toLowerCase().includes(q) ||
        t.originType?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, sourceFilter, assigneeFilter, search]);

  const grouped = useMemo(() => {
    const g: Record<string, ExtendedTask[]> = {};
    for (const col of COLUMNS) g[col.key] = [];
    for (const t of filtered) {
      const key = t.status in g ? t.status : "NEW";
      g[key].push(t);
    }
    return g;
  }, [filtered]);

  /* ── Render ── */
  return (
    <div className="space-y-4">

      {/* ── Filter bar ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        {/* Source chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={14} className="text-slate-500 mr-1" />
          {SOURCE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSourceFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                sourceFilter === f.key
                  ? "bg-teal-900/40 text-teal-300 border-teal-700/60"
                  : "bg-slate-800/40 text-slate-500 border-slate-700/40 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Assignee */}
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:border-teal-500/50 focus:outline-none min-w-[140px]"
          >
            <option value="">Все исполнители</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
          </select>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-1.5 w-48 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none"
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 transition ${viewMode === "board" ? "bg-teal-900/40 text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
              title="Доска"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition ${viewMode === "list" ? "bg-teal-900/40 text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
              title="Список"
            >
              <List size={14} />
            </button>
          </div>

          {/* Create */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} /> Задача
          </button>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 px-1">
        <span>Всего: <b className="text-slate-300">{tasks.length}</b></span>
        {filtered.length !== tasks.length && <span>Отфильтровано: <b className="text-teal-400">{filtered.length}</b></span>}
        {COLUMNS.map(c => {
          const n = grouped[c.key]?.length || 0;
          if (n === 0) return null;
          return <span key={c.key} className={c.textColor}>{c.label}: <b>{n}</b></span>;
        })}
      </div>

      {/* ── Board view ── */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {COLUMNS.map(col => {
            const colTasks = grouped[col.key] || [];
            const isDragTarget = dragOverCol === col.key;

            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-xl border transition-all min-h-[350px] ${
                  isDragTarget
                    ? `border-2 ${col.borderActive} bg-slate-800/80`
                    : "border-slate-700/40 bg-slate-800/30"
                }`}
                onDragOver={e => onDragOver(e, col.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.key)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b border-slate-700/40 ${col.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className={`text-xs font-bold ${col.textColor}`}>{col.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-310px)]">
                  {loading && colTasks.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="animate-spin text-slate-600" size={18} />
                    </div>
                  )}

                  {colTasks.map(task => {
                    const stats = task.stats || { done: 0, inWork: 0, onStock: 0, total: 0 };
                    const pDone = task.targetQty > 0 ? Math.min(100, Math.round((stats.done / task.targetQty) * 100)) : 0;
                    const projName = projects.find(p => p.id === task.projectId)?.title;
                    const prio = priorityDot(task.priority);
                    const isDragging = draggingId === task.id;
                    const overdue = task.status !== "DONE" && task.status !== "CLOSED" && isOverdue(task.dueDate);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => openDrawer(task.id)}
                        className={`group rounded-lg border p-2.5 cursor-pointer transition-all select-none ${
                          isDragging
                            ? "opacity-30 scale-95 border-teal-500/40"
                            : drawerTask?.task.id === task.id && drawerOpen
                            ? "border-teal-500 bg-slate-700/50 ring-1 ring-teal-500/20"
                            : "border-slate-700/40 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/30"
                        }`}
                      >
                        {/* Row 1: priority dot + title + grip */}
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${prio.cls}`} title={prio.title} />
                          <h4 className="flex-1 text-[13px] font-medium text-slate-100 leading-tight line-clamp-2">{task.title}</h4>
                          <GripVertical size={12} className="text-slate-700 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5" />
                        </div>

                        {/* Row 2: project */}
                        {projName && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-400/80 font-medium mb-1.5 pl-3">
                            <Briefcase size={9} /> {projName}
                          </div>
                        )}

                        {/* Row 3: progress */}
                        <div className="h-1 w-full bg-slate-700/60 rounded-full overflow-hidden mb-2 mx-auto" style={{ width: "calc(100% - 12px)", marginLeft: 12 }}>
                          <div
                            style={{ width: `${pDone}%` }}
                            className={`h-full transition-all rounded-full ${pDone >= 100 ? "bg-green-500" : pDone > 50 ? "bg-teal-500" : "bg-blue-500/80"}`}
                          />
                        </div>

                        {/* Row 4: meta */}
                        <div className="flex items-center justify-between gap-1 pl-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.originType && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold leading-none ${sourceStyle[task.originType] || "bg-slate-700/30 text-slate-400 border-slate-600/50"}`}>
                                {task.originType}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">{stats.done}/{task.targetQty}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.dueDate && (
                              <span className={`flex items-center gap-0.5 text-[10px] ${overdue ? "text-red-400 font-semibold" : "text-slate-500"}`}>
                                {overdue && <AlertTriangle size={9} />}
                                <Calendar size={8} />
                                {new Date(task.dueDate).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                              </span>
                            )}

                            {task.responsible && (
                              <div
                                className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300 ring-1 ring-slate-600"
                                title={`${task.responsible.surname} ${task.responsible.name}`}
                              >
                                {initials(task.responsible)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!loading && colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-700">
                      <col.icon size={20} className="mb-1.5 opacity-40" />
                      <span className="text-[10px]">Нет задач</span>
                    </div>
                  )}
                </div>

                {col.key === "NEW" && (
                  <div className="p-1.5 border-t border-slate-700/30">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-1.5 border border-dashed border-slate-700/50 rounded-lg text-slate-600 text-[10px] font-medium hover:border-teal-600/40 hover:text-teal-400 transition flex justify-center items-center gap-1"
                    >
                      <Plus size={12} /> Новая задача
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ── */}
      {viewMode === "list" && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-700/50">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Задача</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Источник</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Прогресс</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Срок</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Исполнитель</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500"><Loader2 className="animate-spin inline" size={16} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-600 text-xs">Нет задач</td></tr>
              ) : filtered.map(task => {
                const stats = task.stats || { done: 0, total: 0, inWork: 0, onStock: 0 };
                const pDone = task.targetQty > 0 ? Math.min(100, Math.round((stats.done / task.targetQty) * 100)) : 0;
                const col = COLUMNS.find(c => c.key === task.status) || COLUMNS[0];
                const overdue = task.status !== "DONE" && task.status !== "CLOSED" && isOverdue(task.dueDate);
                const prio = priorityDot(task.priority);

                return (
                  <tr
                    key={task.id}
                    onClick={() => openDrawer(task.id)}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${prio.cls}`} />
                        <span className="text-sm text-slate-200 truncate max-w-[300px]">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${col.badge}`}>{col.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {task.originType && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${sourceStyle[task.originType] || "text-slate-400"}`}>
                          {task.originType}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 bg-slate-700/60 rounded-full overflow-hidden">
                          <div style={{ width: `${pDone}%` }} className={`h-full rounded-full ${pDone >= 100 ? "bg-green-500" : "bg-teal-500"}`} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{pDone}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {task.dueDate ? (
                        <span className={`text-xs ${overdue ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                          {new Date(task.dueDate).toLocaleDateString("ru")}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {task.responsible ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300 ring-1 ring-slate-600">
                            {initials(task.responsible)}
                          </div>
                          <span className="text-xs text-slate-400">{task.responsible.surname}</span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-in drawer ── */}
      {drawerOpen && drawerTask && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeDrawer} />

          {/* Panel */}
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in">
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/50 px-5 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 truncate pr-4">{drawerTask.task.title}</h2>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button onClick={saveChanges} className="p-1.5 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition"><Save size={15} /></button>
                    <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition"><X size={15} /></button>
                  </>
                ) : (
                  <button onClick={startEditing} className="p-1.5 bg-teal-900/30 text-teal-400 rounded-lg hover:bg-teal-900/50 transition"><Edit3 size={15} /></button>
                )}
                <button onClick={closeDrawer} className="p-1.5 text-slate-500 hover:text-slate-300 transition"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Comment */}
              {isEditing ? (
                <textarea
                  value={editForm.comment || ""}
                  onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                  placeholder="Описание задачи..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none min-h-[60px] resize-none"
                />
              ) : drawerTask.task.comment ? (
                <p className="text-sm text-slate-400 leading-relaxed">{drawerTask.task.comment}</p>
              ) : null}

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Статус</span>
                  {isEditing ? (
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-200">
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${COLUMNS.find(c => c.key === drawerTask.task.status)?.badge || "text-slate-400"}`}>
                      {COLUMNS.find(c => c.key === drawerTask.task.status)?.label || drawerTask.task.status}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Приоритет</span>
                  {isEditing ? (
                    <select value={editForm.priority || 1} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-200">
                      <option value="1">Низкий</option>
                      <option value="2">Средний</option>
                      <option value="3">Высокий</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${priorityDot(drawerTask.task.priority).cls}`} />
                      <span className="text-xs text-slate-300">{priorityDot(drawerTask.task.priority).title}</span>
                    </div>
                  )}
                </div>

                {/* Project */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Проект</span>
                  {isEditing ? (
                    <select value={editForm.projectId || ""} onChange={e => setEditForm({ ...editForm, projectId: e.target.value || null })} className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-200">
                      <option value="">Без проекта</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-indigo-400 font-medium">{projects.find(p => p.id === drawerTask.task.projectId)?.title || "—"}</span>
                  )}
                </div>

                {/* Responsible */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Исполнитель</span>
                  {isEditing ? (
                    <select value={editForm.responsibleId || ""} onChange={e => setEditForm({ ...editForm, responsibleId: e.target.value || null })} className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-200">
                      <option value="">Не назначен</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {drawerTask.task.responsible && (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300 ring-1 ring-slate-600">
                          {initials(drawerTask.task.responsible)}
                        </div>
                      )}
                      <span className="text-xs text-slate-300">{drawerTask.task.responsible ? `${drawerTask.task.responsible.surname} ${drawerTask.task.responsible.name}` : "—"}</span>
                    </div>
                  )}
                </div>

                {/* Due date */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Срок сдачи</span>
                  {isEditing ? (
                    <input type="date" value={editForm.dueDate || ""} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-200" />
                  ) : (
                    <span className={`text-xs ${isOverdue(drawerTask.task.dueDate) && drawerTask.task.status !== "DONE" && drawerTask.task.status !== "CLOSED" ? "text-red-400 font-semibold" : "text-slate-300"}`}>
                      {drawerTask.task.dueDate ? new Date(drawerTask.task.dueDate).toLocaleDateString("ru") : "—"}
                    </span>
                  )}
                </div>

                {/* Source */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Источник</span>
                  {drawerTask.task.originType ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${sourceStyle[drawerTask.task.originType] || "text-slate-400 border-slate-600"}`}>
                      {drawerTask.task.originType}
                      {drawerTask.task.originId && ` #${drawerTask.task.originId}`}
                    </span>
                  ) : <span className="text-xs text-slate-500">—</span>}
                </div>
              </div>

              {/* Breakdown */}
              {drawerTask.breakdown.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <MapPin size={12} className="text-teal-400" /> Локализация изделий
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {drawerTask.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/40 border border-slate-700/30 rounded-lg text-xs">
                        <span className="text-slate-400">{item.sectionTitle || "Склад"}</span>
                        <span className="font-bold text-slate-200">{item.qty} шт</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Create modal ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-slate-800 rounded-xl">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Создать задачу</h2>
          <div className="space-y-3">
            <input className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none" placeholder="Название" value={createForm.title || ""} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
            <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.projectId || ""} onChange={e => setCreateForm({ ...createForm, projectId: e.target.value })}>
              <option value="">Без проекта</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.originType || ""} onChange={e => setCreateForm({ ...createForm, originType: e.target.value })}>
                <option value="">Без источника</option>
                <option value="PRODUCT">Изделие</option>
                <option value="COMPONENT">Комплектующее</option>
                <option value="NC">NC</option>
                <option value="CAPA">CAPA</option>
                <option value="RISK">Риск</option>
                <option value="AUDIT">Аудит</option>
                <option value="TRAINING">Обучение</option>
              </select>
              <input type="number" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder:text-slate-500" placeholder="ID объекта" value={createForm.originId || ""} onChange={e => setCreateForm({ ...createForm, originId: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm font-bold placeholder:text-slate-500" placeholder="Кол-во" value={createForm.targetQty} onChange={e => setCreateForm({ ...createForm, targetQty: e.target.value })} />
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.priority || "1"} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}>
                <option value="1">Низкий</option>
                <option value="2">Средний</option>
                <option value="3">Высокий</option>
              </select>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.responsibleId || ""} onChange={e => setCreateForm({ ...createForm, responsibleId: e.target.value })}>
                <option value="">Исполнитель</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
              </select>
            </div>
            <input type="date" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.dueDate || ""} onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })} />
            <button
              onClick={async () => {
                if (!createForm.title || !createForm.targetQty) return;
                await createTask({
                  ...createForm,
                  targetQty: Number(createForm.targetQty),
                  originId: createForm.originId ? Number(createForm.originId) : undefined,
                  projectId: createForm.projectId ? Number(createForm.projectId) : undefined,
                  responsibleId: createForm.responsibleId ? Number(createForm.responsibleId) : undefined,
                  priority: Number(createForm.priority) || 1,
                });
                setIsModalOpen(false);
                setCreateForm({ priority: "1", targetQty: "" });
                loadData();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>

      {/* Drawer animation */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default TasksList;

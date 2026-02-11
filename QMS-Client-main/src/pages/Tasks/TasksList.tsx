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
<<<<<<< HEAD
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
=======
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
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
<<<<<<< HEAD

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

=======
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    priority: "1",
    targetQty: "",
  });
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ page: 1, limit: 500 });
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
    fetchProjects().then(setProjects);
  }, [loadData]);

<<<<<<< HEAD
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

=======
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
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
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
<<<<<<< HEAD
    } catch (e) { console.error(e); }
=======
    } catch (e) {
      console.error("Error saving:", e);
    }
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
  };

  /* ── Drag & Drop ── */
  const onDragStart = (e: DragEvent, task: ExtendedTask) => {
    e.dataTransfer.setData("taskId", String(task.id));
    e.dataTransfer.setData("fromStatus", task.status);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
  };
<<<<<<< HEAD
  const onDragEnd = () => { setDraggingId(null); setDragOverCol(null); };
  const onDragOver = (e: DragEvent, colKey: string) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(colKey); };
=======

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const onDragOver = (e: DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
  const onDragLeave = () => setDragOverCol(null);

  const onDrop = async (e: DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (isNaN(taskId) || fromStatus === toStatus) return;

<<<<<<< HEAD
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t));
    try {
      await updateTaskStatus(taskId, toStatus);
      if (drawerTask?.task.id === taskId) openDrawer(taskId);
    } catch {
=======
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: toStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, toStatus);
      if (selectedTask?.task.id === taskId) handleSelectTask(taskId);
    } catch (e) {
      console.error("Error updating task status:", e);
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
      loadData();
    }
  };

<<<<<<< HEAD
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
=======
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
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
              }`}
            >
<<<<<<< HEAD
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
=======
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
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
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

<<<<<<< HEAD
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
=======
      {/* ── Create Modal ── */}
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-slate-800 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100 mb-5">
            Создать задачу
          </h2>
          <div className="space-y-3">
<<<<<<< HEAD
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
=======
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

>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
            <button
              onClick={async () => {
                if (!createForm.title || !createForm.targetQty) return;
                await createTask({
                  ...createForm,
                  targetQty: Number(createForm.targetQty),
<<<<<<< HEAD
                  originId: createForm.originId ? Number(createForm.originId) : undefined,
                  projectId: createForm.projectId ? Number(createForm.projectId) : undefined,
                  responsibleId: createForm.responsibleId ? Number(createForm.responsibleId) : undefined,
                  priority: Number(createForm.priority) || 1,
=======
                  originId: createForm.originId
                    ? Number(createForm.originId)
                    : undefined,
                  projectId: createForm.projectId
                    ? Number(createForm.projectId)
                    : undefined,
>>>>>>> 2828ebacd3c6bc1497380a278d89983ffc621cc4
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

      {/* Drawer animation */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default TasksList;

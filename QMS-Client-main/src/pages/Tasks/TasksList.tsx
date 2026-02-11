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
  Plus, Loader2, Edit3, Save, X, Clock,
  CheckCircle2, Circle, Calendar, Search,
  AlertTriangle, Eye, Archive, Filter, MapPin, ChevronRight,
  LayoutGrid, List,
} from "lucide-react";
import { Modal } from "src/components/Modal/Modal";
import Badge from "src/components/qms/Badge";
import StatusDot from "src/components/qms/StatusDot";
import ProgressBar from "src/components/qms/ProgressBar";
import Avatar from "src/components/qms/Avatar";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface TaskStats { total: number; done: number; inWork: number; onStock: number; }
interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

/* ─── Column config ─────────────────────────────────────────────────── */

type StatusDotColor = "blue" | "amber" | "purple" | "accent" | "grey";
type ProgressBarColor = "blue" | "amber" | "purple" | "accent" | "green";

interface ColumnDef {
  key: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  dotColor: StatusDotColor;
  progressColor: ProgressBarColor;
  textCls: string;
  badgeCls: string;
  borderTopCls: string;
  gradientCls: string;
  dragBorderCls: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "NEW", label: "Новые", icon: Circle, dotColor: "blue", progressColor: "blue",
    textCls: "text-[#4A90E8]", badgeCls: "bg-[#4A90E8]/15 text-[#4A90E8]",
    borderTopCls: "border-t-2 border-[#4A90E8]/40",
    gradientCls: "bg-gradient-to-br from-[#4A90E8]/[0.04] to-transparent",
    dragBorderCls: "border-[#4A90E8]",
  },
  {
    key: "IN_PROGRESS", label: "В работе", icon: Clock, dotColor: "amber", progressColor: "amber",
    textCls: "text-[#E8A830]", badgeCls: "bg-[#E8A830]/15 text-[#E8A830]",
    borderTopCls: "border-t-2 border-[#E8A830]/40",
    gradientCls: "bg-gradient-to-br from-[#E8A830]/[0.04] to-transparent",
    dragBorderCls: "border-[#E8A830]",
  },
  {
    key: "REVIEW", label: "На проверке", icon: Eye, dotColor: "purple", progressColor: "purple",
    textCls: "text-[#A06AE8]", badgeCls: "bg-[#A06AE8]/15 text-[#A06AE8]",
    borderTopCls: "border-t-2 border-[#A06AE8]/40",
    gradientCls: "bg-gradient-to-br from-[#A06AE8]/[0.04] to-transparent",
    dragBorderCls: "border-[#A06AE8]",
  },
  {
    key: "DONE", label: "Готово", icon: CheckCircle2, dotColor: "accent", progressColor: "accent",
    textCls: "text-[#2DD4A8]", badgeCls: "bg-[#2DD4A8]/15 text-[#2DD4A8]",
    borderTopCls: "border-t-2 border-[#2DD4A8]/40",
    gradientCls: "bg-gradient-to-br from-[#2DD4A8]/[0.04] to-transparent",
    dragBorderCls: "border-[#2DD4A8]",
  },
  {
    key: "CLOSED", label: "Закрыто", icon: Archive, dotColor: "grey", progressColor: "green",
    textCls: "text-[#3A4E62]", badgeCls: "bg-[#3A4E62]/15 text-[#8899AB]",
    borderTopCls: "border-t-2 border-[#3A4E62]/40",
    gradientCls: "bg-gradient-to-br from-[#3A4E62]/[0.04] to-transparent",
    dragBorderCls: "border-[#3A4E62]",
  },
];

/* ─── Source / origin filters ───────────────────────────────────────── */

const SOURCE_FILTERS = [
  { key: "ALL",       label: "Все",        color: "#2DD4A8" },
  { key: "NC",        label: "NC",         color: "#F06060" },
  { key: "CAPA",      label: "CAPA",       color: "#E8A830" },
  { key: "RISK",      label: "Риск",       color: "#A06AE8" },
  { key: "AUDIT",     label: "Аудит",      color: "#4A90E8" },
  { key: "TRAINING",  label: "Обучение",   color: "#36B5E0" },
  { key: "PRODUCT",   label: "Изделие",    color: "#E06890" },
  { key: "COMPONENT", label: "Компонент",  color: "#3A4E62" },
];

type BadgeVariant = "nc" | "capa" | "risk" | "audit" | "training" | "sop" | "closed" | "product" | "component";

const originToBadge: Record<string, BadgeVariant> = {
  NC: "nc", CAPA: "capa", RISK: "risk", AUDIT: "audit",
  TRAINING: "training", PRODUCT: "product", COMPONENT: "component",
};

/* ─── Priority config ──────────────────────────────────────────────── */

interface PriorityConfig {
  icon: string;
  color: string;
  borderCls: string;
  title: string;
}

const PRIORITY_MAP: Record<number, PriorityConfig> = {
  3: { icon: "▲▲", color: "text-[#F06060]",  borderCls: "border-l-[3px] border-l-[#F06060]/60",  title: "Критический" },
  2: { icon: "●",  color: "text-[#E8A830]",  borderCls: "border-l-[3px] border-l-[#E8A830]/60",  title: "Средний" },
  1: { icon: "▼",  color: "text-[#4A90E8]",  borderCls: "border-l-[3px] border-l-[#4A90E8]/60",  title: "Низкий" },
};

const getPriority = (p: number | null | undefined): PriorityConfig => {
  return PRIORITY_MAP[p || 1] || PRIORITY_MAP[1];
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

const isOverdue = (d?: string | null) => {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toISOString().slice(0, 10));
};

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" });
};

/* ─── Component ─────────────────────────────────────────────────────── */

interface TasksListProps {
  projectId?: number;
}

const TasksList: React.FC<TasksListProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState(false);

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
      const res = await fetchTasks({ page: 1, limit: 500, ...(projectId ? { projectId } : {}) });
      setTasks(res.rows as unknown as ExtendedTask[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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

      {/* ── Top bar: summary + search + filters + actions ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Summary + controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-asvo-text-dim">
            Всего: <b className="text-asvo-text">{tasks.length}</b>
          </span>
          {filtered.length !== tasks.length && (
            <span className="text-xs text-asvo-text-dim">
              Найдено: <b className="text-asvo-accent">{filtered.length}</b>
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Поиск..."
                className={`pl-8 pr-3 py-1.5 bg-transparent border border-asvo-border rounded-lg text-xs text-asvo-text placeholder:text-asvo-text-dim focus:bg-asvo-surface focus:border-asvo-border-lt focus:outline-none transition-all ${
                  searchFocused ? "w-60" : "w-[180px]"
                }`}
              />
            </div>

            {/* Assignee dropdown */}
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="px-2 py-1.5 bg-asvo-surface border border-asvo-border rounded-lg text-[13px] text-asvo-text-mid focus:border-asvo-border-lt focus:outline-none min-w-[140px]"
            >
              <option value="">Все исполнители</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>

            {/* View toggle */}
            <div className="flex bg-asvo-surface border border-asvo-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("board")}
                className={`p-1.5 transition-all ${viewMode === "board" ? "bg-asvo-accent text-asvo-bg" : "text-asvo-text-mid hover:text-asvo-text"}`}
                title="Доска"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-all ${viewMode === "list" ? "bg-asvo-accent text-asvo-bg" : "text-asvo-text-mid hover:text-asvo-text"}`}
                title="Список"
              >
                <List size={14} />
              </button>
            </div>

            {/* Create button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-br from-asvo-accent to-asvo-accent/80 text-asvo-bg font-bold rounded-lg text-xs transition-all shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)]"
            >
              <Plus size={14} /> Задача
            </button>
          </div>
        </div>

        {/* Row 2: Source filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-asvo-text-dim mr-0.5" />
          {SOURCE_FILTERS.map(f => {
            const isActive = sourceFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "border-[1.5px] bg-opacity-10 text-opacity-100"
                    : "border border-asvo-border text-asvo-text-dim hover:text-asvo-text-mid hover:border-asvo-border-lt"
                }`}
                style={isActive ? {
                  borderColor: f.color,
                  backgroundColor: `${f.color}10`,
                  color: f.color,
                  borderWidth: '1.5px',
                } : undefined}
              >
                {f.label}
              </button>
            );
          })}
        </div>
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
                className={`flex flex-col rounded-xl transition-all min-h-[350px] ${
                  isDragTarget
                    ? `border-2 ${col.dragBorderCls} bg-asvo-surface/80`
                    : "border border-asvo-border bg-asvo-surface/30"
                }`}
                onDragOver={e => onDragOver(e, col.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.key)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${col.borderTopCls} ${col.gradientCls}`}>
                  <div className="flex items-center gap-2">
                    <StatusDot color={col.dotColor} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${col.textCls}`}>{col.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeCls}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-310px)] kanban-scroll">
                  {loading && colTasks.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="animate-spin text-asvo-text-dim" size={18} />
                    </div>
                  )}

                  {colTasks.map(task => {
                    const stats = task.stats || { done: 0, inWork: 0, onStock: 0, total: 0 };
                    const pDone = task.targetQty > 0 ? Math.min(100, Math.round((stats.done / task.targetQty) * 100)) : 0;
                    const prio = getPriority(task.priority);
                    const isDragging = draggingId === task.id;
                    const overdue = task.status !== "DONE" && task.status !== "CLOSED" && isOverdue(task.dueDate);
                    const isSelected = drawerTask?.task.id === task.id && drawerOpen;
                    const showProgress = col.key === "IN_PROGRESS" || col.key === "REVIEW";
                    const responsibleName = task.responsible
                      ? `${task.responsible.surname} ${task.responsible.name}`
                      : null;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => openDrawer(task.id)}
                        className={`group bg-asvo-card border border-asvo-border ${prio.borderCls} rounded-[10px] p-3.5 cursor-grab transition-all duration-200 select-none ${
                          isDragging
                            ? "opacity-30 scale-95"
                            : isSelected
                            ? "border-asvo-accent bg-asvo-card-hover ring-1 ring-asvo-accent/20"
                            : "hover:bg-asvo-card-hover hover:border-asvo-border-lt hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                        }`}
                      >
                        {/* Row 1: ID + TypeBadge + Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-asvo-accent">
                              #{task.id}
                            </span>
                            {task.originType && originToBadge[task.originType] && (
                              <Badge variant={originToBadge[task.originType]}>
                                {task.originType}
                              </Badge>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold ${prio.color}`} title={prio.title}>
                            {prio.icon}
                          </span>
                        </div>

                        {/* Row 2: Title */}
                        <h4 className="text-[13px] font-medium text-asvo-text leading-[1.45] line-clamp-2 mb-2">
                          {task.title}
                        </h4>

                        {/* Row 3: Progress (only for IN_PROGRESS and REVIEW) */}
                        {showProgress && (
                          <div className="mb-2">
                            <ProgressBar value={pDone} color={col.progressColor} />
                            <span className="text-[10px] text-asvo-text-dim font-mono mt-0.5 block">
                              {pDone}%
                            </span>
                          </div>
                        )}

                        {/* Row 4: Tags */}
                        {task.originType && !originToBadge[task.originType] && (
                          <div className="mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-asvo-accent-dim text-asvo-text-mid">
                              {task.originType}
                            </span>
                          </div>
                        )}

                        {/* Row 5: Footer - Avatar + meta */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            {responsibleName && (
                              <Avatar
                                name={responsibleName}
                                size="sm"
                                color="accent"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-asvo-text-dim">
                            {task.dueDate && (
                              <span className={`flex items-center gap-0.5 ${overdue ? "text-asvo-red font-semibold" : ""}`}>
                                {overdue && <AlertTriangle size={9} />}
                                <Calendar size={9} />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty column */}
                  {!loading && colTasks.length === 0 && (
                    <div className="border border-dashed border-asvo-border rounded-[10px] bg-asvo-surface/50 p-8 text-center">
                      <col.icon size={24} className="mx-auto mb-2 opacity-40 text-asvo-text-dim" />
                      <span className="text-[13px] text-asvo-text-dim">Нет задач</span>
                    </div>
                  )}
                </div>

                {/* "+ Новая задача" button at bottom of NEW column */}
                {col.key === "NEW" && (
                  <div className="p-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full border-[1.5px] border-dashed border-asvo-border rounded-[10px] p-2.5 text-asvo-text-dim text-[13px] font-medium hover:border-asvo-accent/30 hover:text-asvo-accent hover:bg-asvo-accent-dim transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Новая задача
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
        <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-asvo-surface border-b border-asvo-border">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Задача</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Статус</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Источник</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Прогресс</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Срок</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider">Исполнитель</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-asvo-text-dim"><Loader2 className="animate-spin inline" size={16} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-asvo-text-dim text-xs">Нет задач</td></tr>
              ) : filtered.map(task => {
                const stats = task.stats || { done: 0, total: 0, inWork: 0, onStock: 0 };
                const pDone = task.targetQty > 0 ? Math.min(100, Math.round((stats.done / task.targetQty) * 100)) : 0;
                const col = COLUMNS.find(c => c.key === task.status) || COLUMNS[0];
                const overdue = task.status !== "DONE" && task.status !== "CLOSED" && isOverdue(task.dueDate);
                const prio = getPriority(task.priority);
                const responsibleName = task.responsible
                  ? `${task.responsible.surname} ${task.responsible.name}`
                  : null;

                return (
                  <tr
                    key={task.id}
                    onClick={() => openDrawer(task.id)}
                    className="border-b border-asvo-border/50 hover:bg-asvo-card cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${prio.color}`}>{prio.icon}</span>
                        <span className="font-mono text-[11px] text-asvo-accent font-semibold">#{task.id}</span>
                        <span className="text-sm text-asvo-text truncate max-w-[300px]">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${col.badgeCls}`}>{col.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {task.originType && originToBadge[task.originType] ? (
                        <Badge variant={originToBadge[task.originType]}>{task.originType}</Badge>
                      ) : task.originType ? (
                        <span className="text-[10px] text-asvo-text-mid">{task.originType}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <ProgressBar value={pDone} color={pDone >= 100 ? "accent" : "blue"} />
                        </div>
                        <span className="text-[10px] text-asvo-text-dim font-mono">{pDone}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {task.dueDate ? (
                        <span className={`text-xs ${overdue ? "text-asvo-red font-semibold" : "text-asvo-text-mid"}`}>
                          {new Date(task.dueDate).toLocaleDateString("ru")}
                        </span>
                      ) : <span className="text-asvo-text-dim">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {responsibleName ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={responsibleName} size="sm" color="accent" />
                          <span className="text-xs text-asvo-text-mid">{task.responsible!.surname}</span>
                        </div>
                      ) : <span className="text-asvo-text-dim text-xs">—</span>}
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
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />

          {/* Panel */}
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-asvo-surface border-l border-asvo-border shadow-2xl overflow-y-auto animate-slide-in">
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-asvo-surface/95 backdrop-blur border-b border-asvo-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="font-mono text-[11px] font-semibold text-asvo-accent shrink-0">#{drawerTask.task.id}</span>
                <h2 className="text-base font-bold text-asvo-text truncate">{drawerTask.task.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button onClick={saveChanges} className="p-1.5 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"><Save size={15} /></button>
                    <button onClick={() => setIsEditing(false)} className="p-1.5 bg-asvo-card text-asvo-text-mid rounded-lg hover:bg-asvo-card-hover transition"><X size={15} /></button>
                  </>
                ) : (
                  <button onClick={startEditing} className="p-1.5 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"><Edit3 size={15} /></button>
                )}
                <button onClick={closeDrawer} className="p-1.5 text-asvo-text-dim hover:text-asvo-text transition"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Comment */}
              {isEditing ? (
                <textarea
                  value={editForm.comment || ""}
                  onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                  placeholder="Описание задачи..."
                  className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-sm text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none min-h-[60px] resize-none"
                />
              ) : drawerTask.task.comment ? (
                <p className="text-sm text-asvo-text-mid leading-relaxed">{drawerTask.task.comment}</p>
              ) : null}

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Статус</span>
                  {isEditing ? (
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${COLUMNS.find(c => c.key === drawerTask.task.status)?.badgeCls || "text-asvo-text-mid"}`}>
                      {COLUMNS.find(c => c.key === drawerTask.task.status)?.label || drawerTask.task.status}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Приоритет</span>
                  {isEditing ? (
                    <select value={editForm.priority || 1} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
                      <option value="1">Низкий</option>
                      <option value="2">Средний</option>
                      <option value="3">Высокий</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold ${getPriority(drawerTask.task.priority).color}`}>
                        {getPriority(drawerTask.task.priority).icon}
                      </span>
                      <span className="text-xs text-asvo-text">{getPriority(drawerTask.task.priority).title}</span>
                    </div>
                  )}
                </div>

                {/* Project */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Проект</span>
                  {isEditing ? (
                    <select value={editForm.projectId || ""} onChange={e => setEditForm({ ...editForm, projectId: e.target.value || null })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
                      <option value="">Без проекта</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-asvo-blue font-medium">{projects.find(p => p.id === drawerTask.task.projectId)?.title || "—"}</span>
                  )}
                </div>

                {/* Responsible */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Исполнитель</span>
                  {isEditing ? (
                    <select value={editForm.responsibleId || ""} onChange={e => setEditForm({ ...editForm, responsibleId: e.target.value || null })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
                      <option value="">Не назначен</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {drawerTask.task.responsible && (
                        <Avatar
                          name={`${drawerTask.task.responsible.surname} ${drawerTask.task.responsible.name}`}
                          size="sm"
                          color="accent"
                        />
                      )}
                      <span className="text-xs text-asvo-text">{drawerTask.task.responsible ? `${drawerTask.task.responsible.surname} ${drawerTask.task.responsible.name}` : "—"}</span>
                    </div>
                  )}
                </div>

                {/* Due date */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Срок сдачи</span>
                  {isEditing ? (
                    <input type="date" value={editForm.dueDate || ""} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none" />
                  ) : (
                    <span className={`text-xs ${isOverdue(drawerTask.task.dueDate) && drawerTask.task.status !== "DONE" && drawerTask.task.status !== "CLOSED" ? "text-asvo-red font-semibold" : "text-asvo-text"}`}>
                      {drawerTask.task.dueDate ? new Date(drawerTask.task.dueDate).toLocaleDateString("ru") : "—"}
                    </span>
                  )}
                </div>

                {/* Source */}
                <div className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                  <span className="block text-[10px] text-asvo-text-dim uppercase font-bold mb-1.5">Источник</span>
                  {drawerTask.task.originType ? (
                    <div className="flex items-center gap-1.5">
                      {originToBadge[drawerTask.task.originType] ? (
                        <Badge variant={originToBadge[drawerTask.task.originType]}>
                          {drawerTask.task.originType}
                          {drawerTask.task.originId ? ` #${drawerTask.task.originId}` : ""}
                        </Badge>
                      ) : (
                        <span className="text-xs text-asvo-text-mid">{drawerTask.task.originType}</span>
                      )}
                    </div>
                  ) : <span className="text-xs text-asvo-text-dim">—</span>}
                </div>
              </div>

              {/* Breakdown */}
              {drawerTask.breakdown.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold text-asvo-text-dim uppercase tracking-wide mb-2">
                    <MapPin size={12} className="text-asvo-accent" /> Локализация изделий
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {drawerTask.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-asvo-card border border-asvo-border rounded-lg text-xs">
                        <span className="text-asvo-text-mid">{item.sectionTitle || "Склад"}</span>
                        <span className="font-bold text-asvo-text">{item.qty} шт</span>
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
        <div className="p-1">
          <h2 className="text-lg font-bold text-asvo-text mb-5">
            Создать задачу
          </h2>
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
              placeholder="Название"
              value={createForm.title || ""}
              onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
            />
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.projectId || ""}
              onChange={e => setCreateForm({ ...createForm, projectId: e.target.value })}
            >
              <option value="">Без проекта</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
                value={createForm.originType || ""}
                onChange={e => setCreateForm({ ...createForm, originType: e.target.value })}
              >
                <option value="">Без источника</option>
                <option value="PRODUCT">Изделие</option>
                <option value="COMPONENT">Комплектующее</option>
                <option value="NC">NC</option>
                <option value="CAPA">CAPA</option>
                <option value="RISK">Риск</option>
                <option value="AUDIT">Аудит</option>
                <option value="TRAINING">Обучение</option>
              </select>
              <input
                type="number"
                className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
                placeholder="ID объекта"
                value={createForm.originId || ""}
                onChange={e => setCreateForm({ ...createForm, originId: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm font-bold placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
                placeholder="Кол-во"
                value={createForm.targetQty}
                onChange={e => setCreateForm({ ...createForm, targetQty: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
                value={createForm.priority || "1"}
                onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
              >
                <option value="1">Низкий</option>
                <option value="2">Средний</option>
                <option value="3">Высокий</option>
              </select>
              <select
                className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
                value={createForm.responsibleId || ""}
                onChange={e => setCreateForm({ ...createForm, responsibleId: e.target.value })}
              >
                <option value="">Исполнитель</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
              </select>
            </div>
            <input
              type="date"
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.dueDate || ""}
              onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
            />
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
              className="w-full mt-2 py-3 bg-gradient-to-r from-asvo-accent to-asvo-accent/80 hover:from-asvo-accent hover:to-asvo-accent text-asvo-bg font-bold rounded-xl transition-all text-sm shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)]"
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

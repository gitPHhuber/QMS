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
  Plus, Search, Filter, LayoutGrid, List,
} from "lucide-react";
import {
  COLUMNS,
  SOURCE_FILTERS,
  TaskStats,
} from "./tasksConstants";
import TaskBoardView from "./TaskBoardView";
import TaskListView from "./TaskListView";
import TaskDrawer from "./TaskDrawer";
import TaskCreateModal from "./TaskCreateModal";
import TaskDetailModal from "./TaskDetailModal";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

/* ─── Component ─────────────────────────────────────────────────────── */

interface TasksListProps {
  projectId?: number;
  epicId?: number;
}

const TasksList: React.FC<TasksListProps> = ({ projectId, epicId }) => {
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

  // Detail modal
  const [detailModalTaskId, setDetailModalTaskId] = useState<number | null>(null);

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({
        page: 1,
        limit: 500,
        ...(projectId ? { projectId } : {}),
        ...(epicId ? { epicId } : {}),
      });
      setTasks(res.rows as unknown as ExtendedTask[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, epicId]);

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

  /* ── Create task ── */
  const handleCreateSubmit = async () => {
    if (!createForm.title || !createForm.targetQty) return;
    await createTask({
      ...createForm,
      targetQty: Number(createForm.targetQty),
      originId: createForm.originId ? Number(createForm.originId) : undefined,
      projectId: createForm.projectId ? Number(createForm.projectId) : undefined,
      epicId: createForm.epicId ? Number(createForm.epicId) : undefined,
      responsibleId: createForm.responsibleId ? Number(createForm.responsibleId) : undefined,
      priority: Number(createForm.priority) || 1,
    });
    setIsModalOpen(false);
    setCreateForm({ priority: "1", targetQty: "" });
    loadData();
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
        <TaskBoardView
          grouped={grouped}
          columns={COLUMNS}
          dragOverCol={dragOverCol}
          draggingId={draggingId}
          drawerTask={drawerTask}
          drawerOpen={drawerOpen}
          loading={loading}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          openDrawer={openDrawer}
          setIsModalOpen={setIsModalOpen}
        />
      )}

      {/* ── List view ── */}
      {viewMode === "list" && (
        <TaskListView
          filtered={filtered}
          loading={loading}
          drawerTask={drawerTask}
          drawerOpen={drawerOpen}
          users={users}
          openDrawer={openDrawer}
        />
      )}

      {/* ── Slide-in drawer ── */}
      {drawerOpen && drawerTask && (
        <TaskDrawer
          drawerTask={drawerTask}
          drawerOpen={drawerOpen}
          isEditing={isEditing}
          editForm={editForm}
          users={users}
          projects={projects}
          onClose={closeDrawer}
          onStartEditing={startEditing}
          onSaveChanges={saveChanges}
          onCancelEditing={() => setIsEditing(false)}
          onEditFormChange={setEditForm}
          onOpenFull={() => {
            if (drawerTask) {
              setDetailModalTaskId(drawerTask.task.id);
              closeDrawer();
            }
          }}
        />
      )}

      {/* ── Create modal ── */}
      <TaskCreateModal
        isModalOpen={isModalOpen}
        createForm={createForm}
        users={users}
        projects={projects}
        onClose={() => setIsModalOpen(false)}
        onCreateFormChange={setCreateForm}
        onSubmit={handleCreateSubmit}
      />

      {/* Detail modal */}
      {detailModalTaskId !== null && (
        <TaskDetailModal
          taskId={detailModalTaskId}
          isOpen={detailModalTaskId !== null}
          onClose={() => setDetailModalTaskId(null)}
          onUpdated={loadData}
        />
      )}

      {/* Drawer animation */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default TasksList;

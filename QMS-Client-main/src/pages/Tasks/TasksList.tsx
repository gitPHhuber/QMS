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
  Plus, Loader2, MapPin, GripVertical,
  Edit3, Save, X, Briefcase, Clock,
  AlertTriangle, CheckCircle2, Circle,
  User as UserIcon, Calendar,
} from "lucide-react";
import { Modal } from "src/components/Modal/Modal";

interface TaskStats { total: number; done: number; inWork: number; onStock: number; }
interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

const COLUMNS = [
  { key: "NEW",         label: "Новые",    icon: Circle,        color: "border-blue-500/50",   headerBg: "bg-blue-500/10",  textColor: "text-blue-400",  badge: "bg-blue-900/40 text-blue-400" },
  { key: "IN_PROGRESS", label: "В работе", icon: Clock,         color: "border-yellow-500/50", headerBg: "bg-yellow-500/10", textColor: "text-yellow-400", badge: "bg-yellow-900/40 text-yellow-400" },
  { key: "DONE",        label: "Готово",   icon: CheckCircle2,  color: "border-green-500/50",  headerBg: "bg-green-500/10",  textColor: "text-green-400",  badge: "bg-green-900/40 text-green-400" },
] as const;

const priorityLabel = (p: number | null | undefined) => {
  if (p === 3) return { text: "Высокий", cls: "bg-red-900/40 text-red-400 border-red-700/50" };
  if (p === 2) return { text: "Средний", cls: "bg-yellow-900/40 text-yellow-400 border-yellow-700/50" };
  return { text: "Низкий", cls: "bg-slate-700/40 text-slate-400 border-slate-600/50" };
};

const TasksList: React.FC = () => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetailResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [users, setUsers] = useState<userGetModel[]>([]);
  const [_sections, setSections] = useState<SectionModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({ priority: "1", targetQty: "" });
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ page: 1, limit: 200 });
      setTasks(res.rows as unknown as ExtendedTask[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    fetchUsers().then(setUsers);
    fetchStructure().then(setSections);
    fetchProjects().then(setProjects);
  }, [loadData]);

  const handleSelectTask = async (id: number) => {
    setIsEditing(false);
    try {
      const res = await fetchTaskById(id);
      setSelectedTask(res);
    } catch (e) { console.error("Error loading task details:", e); }
  };

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
    } catch (e) { console.error("Error saving:", e); }
  };

  // ── Drag & Drop ──
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

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = async (e: DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (isNaN(taskId) || fromStatus === toStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t));

    try {
      await updateTaskStatus(taskId, toStatus);
      // Refresh if the selected task was moved
      if (selectedTask?.task.id === taskId) {
        handleSelectTask(taskId);
      }
    } catch (e) {
      console.error("Error updating task status:", e);
      loadData(); // Revert on error
    }
  };

  // Group tasks by status
  const grouped: Record<string, ExtendedTask[]> = { NEW: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => {
    const key = t.status in grouped ? t.status : "NEW";
    grouped[key].push(t);
  });

  return (
    <div className="space-y-6">
      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = grouped[col.key] || [];
          const isDragTarget = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              className={`flex flex-col rounded-xl border transition-all min-h-[400px] ${
                isDragTarget
                  ? `border-2 ${col.color} bg-slate-800/80`
                  : "border-slate-700/50 bg-slate-800/40"
              }`}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.key)}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border-b border-slate-700/50 ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <col.icon size={16} className={col.textColor} />
                  <span className={`text-sm font-bold ${col.textColor}`}>{col.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                {loading && colTasks.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-500" size={20} />
                  </div>
                )}

                {colTasks.map(task => {
                  const stats = task.stats || { done: 0, inWork: 0, onStock: 0, total: 0 };
                  const pDone = task.targetQty > 0
                    ? Math.min(100, Math.round((stats.done / task.targetQty) * 100))
                    : 0;
                  const projName = projects.find(p => p.id === task.projectId)?.title;
                  const prio = priorityLabel(task.priority);
                  const isDragging = draggingId === task.id;
                  const isSelected = selectedTask?.task.id === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      onClick={() => handleSelectTask(task.id)}
                      className={`group rounded-lg border p-3 cursor-pointer transition-all ${
                        isDragging
                          ? "opacity-40 scale-95 border-teal-500/50"
                          : isSelected
                          ? "border-teal-500 bg-slate-700/60 ring-1 ring-teal-500/30"
                          : "border-slate-700/50 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-700/40"
                      }`}
                    >
                      {/* Drag handle + Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical size={14} className="text-slate-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-100 truncate">{task.title}</h4>
                          {projName && (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium mt-0.5">
                              <Briefcase size={9} /> {projName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div
                          style={{ width: `${pDone}%` }}
                          className={`h-full transition-all ${pDone >= 100 ? "bg-green-500" : pDone > 50 ? "bg-teal-500" : "bg-blue-500"}`}
                        />
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Priority */}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${prio.cls}`}>
                            {prio.text}
                          </span>
                          {/* Origin badge */}
                          {task.originType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-700/50 font-medium">
                              {task.originType}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Qty */}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {stats.total}/{task.targetQty}
                          </span>
                          {/* Due date */}
                          {task.dueDate && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                              <Calendar size={9} />
                              {new Date(task.dueDate).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                            </span>
                          )}
                          {/* Responsible avatar */}
                          {task.responsible && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400" title={`${task.responsible.surname} ${task.responsible.name}`}>
                              <UserIcon size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {!loading && colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                    <col.icon size={24} className="mb-2 opacity-50" />
                    <span className="text-xs">Нет задач</span>
                  </div>
                )}
              </div>

              {/* Add button for NEW column */}
              {col.key === "NEW" && (
                <div className="p-2 border-t border-slate-700/50">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-slate-500 text-xs font-medium hover:border-teal-500/50 hover:text-teal-400 transition flex justify-center items-center gap-1.5"
                  >
                    <Plus size={14} /> Новая задача
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedTask && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">{selectedTask.task.title}</h2>
              {selectedTask.task.comment && (
                <p className="text-sm text-slate-400 mt-1">{selectedTask.task.comment}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={saveChanges} className="p-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition"><Save size={16} /></button>
                  <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition"><X size={16} /></button>
                </>
              ) : (
                <button onClick={startEditing} className="p-2 bg-teal-900/30 text-teal-400 rounded-lg hover:bg-teal-900/50 transition"><Edit3 size={16} /></button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Status */}
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Статус</span>
              {isEditing ? (
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200">
                  <option value="NEW">НОВАЯ</option>
                  <option value="IN_PROGRESS">В РАБОТЕ</option>
                  <option value="DONE">ГОТОВО</option>
                </select>
              ) : (
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  COLUMNS.find(c => c.key === selectedTask.task.status)?.badge || "text-slate-400"
                }`}>{selectedTask.task.status}</span>
              )}
            </div>

            {/* Project */}
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Проект</span>
              {isEditing ? (
                <select value={editForm.projectId || ""} onChange={e => setEditForm({ ...editForm, projectId: e.target.value || null })} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200">
                  <option value="">Без проекта</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              ) : (
                <span className="text-sm text-indigo-400 font-medium">{projects.find(p => p.id === selectedTask.task.projectId)?.title || "—"}</span>
              )}
            </div>

            {/* Priority */}
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Приоритет</span>
              {isEditing ? (
                <select value={editForm.priority || 1} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200">
                  <option value="1">Низкий</option>
                  <option value="2">Средний</option>
                  <option value="3">Высокий</option>
                </select>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${priorityLabel(selectedTask.task.priority).cls}`}>
                  {priorityLabel(selectedTask.task.priority).text}
                </span>
              )}
            </div>

            {/* Responsible */}
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Ответственный</span>
              {isEditing ? (
                <select value={editForm.responsibleId || ""} onChange={e => setEditForm({ ...editForm, responsibleId: e.target.value || null })} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200">
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                </select>
              ) : (
                <span className="text-sm text-slate-300">{selectedTask.task.responsible ? `${selectedTask.task.responsible.surname} ${selectedTask.task.responsible.name}` : "—"}</span>
              )}
            </div>

            {/* Due date */}
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Срок сдачи</span>
              {isEditing ? (
                <input type="date" value={editForm.dueDate || ""} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200" />
              ) : (
                <span className="text-sm text-slate-300">{selectedTask.task.dueDate ? new Date(selectedTask.task.dueDate).toLocaleDateString("ru") : "—"}</span>
              )}
            </div>
          </div>

          {/* Breakdown */}
          {selectedTask.breakdown.length > 0 && (
            <>
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-t border-slate-700 pt-4 mb-3">
                <MapPin size={14} className="text-teal-400" /> Локализация изделий
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedTask.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-sm">
                    <span className="text-slate-300">{item.sectionTitle || "Склад"}</span>
                    <span className="font-bold text-slate-100">{item.qty} шт</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
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
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm" value={createForm.originType || "PRODUCT"} onChange={e => setCreateForm({ ...createForm, originType: e.target.value })}>
                <option value="PRODUCT">Изделие</option>
                <option value="COMPONENT">Комплектующее</option>
              </select>
              <input type="number" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder:text-slate-500" placeholder="ID объекта" value={createForm.originId || ""} onChange={e => setCreateForm({ ...createForm, originId: e.target.value })} />
            </div>
            <input type="number" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm font-bold placeholder:text-slate-500" placeholder="Целевое количество (шт)" value={createForm.targetQty} onChange={e => setCreateForm({ ...createForm, targetQty: e.target.value })} />
            <button
              onClick={async () => {
                if (!createForm.title || !createForm.targetQty) return;
                await createTask({
                  ...createForm,
                  targetQty: Number(createForm.targetQty),
                  originId: createForm.originId ? Number(createForm.originId) : undefined,
                  projectId: createForm.projectId ? Number(createForm.projectId) : undefined,
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
    </div>
  );
};

export default TasksList;

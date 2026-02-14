import React, { useState, useEffect, useCallback } from "react";
import { Edit3, Save, X, ChevronRight, MapPin, Maximize2, ListChecks, CheckSquare, Plus, Trash2 } from "lucide-react";
import { TaskDetailResponse } from "src/api/tasksApi";
import { ProjectModel } from "src/api/projectsApi";
import { userGetModel } from "src/types/UserModel";
import { Subtask, createSubtask, updateSubtask, deleteSubtask } from "src/api/subtasksApi";
import { Checklist, createChecklist, updateChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } from "src/api/checklistsApi";
import Badge from "src/components/qms/Badge";
import Avatar from "src/components/qms/Avatar";
import ProgressBar from "src/components/qms/ProgressBar";
import {
  COLUMNS,
  originToBadge,
  getPriority,
  isOverdue,
} from "./tasksConstants";

interface TaskDrawerProps {
  drawerTask: TaskDetailResponse;
  drawerOpen: boolean;
  isEditing: boolean;
  editForm: any;
  users: userGetModel[];
  projects: ProjectModel[];
  onClose: () => void;
  onStartEditing: () => void;
  onSaveChanges: () => void;
  onCancelEditing: () => void;
  onEditFormChange: (form: any) => void;
  onOpenFull?: () => void;
}

const TaskDrawer: React.FC<TaskDrawerProps> = ({
  drawerTask,
  drawerOpen,
  isEditing,
  editForm,
  users,
  projects,
  onClose,
  onStartEditing,
  onSaveChanges,
  onCancelEditing,
  onEditFormChange,
  onOpenFull,
}) => {
  // Local state for subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Local state for checklists
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newItemTitles, setNewItemTitles] = useState<Record<number, string>>({});

  // Sync from drawerTask
  useEffect(() => {
    if (drawerTask) {
      setSubtasks(drawerTask.subtasks || []);
      setChecklists(drawerTask.checklists || []);
    }
  }, [drawerTask]);

  const taskId = drawerTask?.task?.id;

  // ── Subtask handlers ──
  const handleToggleSubtask = useCallback(async (st: Subtask) => {
    if (!taskId) return;
    try {
      const updated = await updateSubtask(taskId, st.id, { isCompleted: !st.isCompleted });
      setSubtasks(prev => prev.map(s => s.id === st.id ? updated : s));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  const handleAddSubtask = useCallback(async () => {
    if (!taskId || !newSubtaskTitle.trim()) return;
    try {
      const created = await createSubtask(taskId, newSubtaskTitle.trim());
      setSubtasks(prev => [...prev, created]);
      setNewSubtaskTitle("");
    } catch (e) {
      console.error(e);
    }
  }, [taskId, newSubtaskTitle]);

  const handleDeleteSubtask = useCallback(async (id: number) => {
    if (!taskId) return;
    try {
      await deleteSubtask(taskId, id);
      setSubtasks(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  // ── Checklist handlers ──
  const handleAddChecklist = useCallback(async () => {
    if (!taskId) return;
    try {
      const created = await createChecklist(taskId);
      setChecklists(prev => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  const handleDeleteChecklist = useCallback(async (checklistId: number) => {
    if (!taskId) return;
    try {
      await deleteChecklist(taskId, checklistId);
      setChecklists(prev => prev.filter(c => c.id !== checklistId));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  const handleUpdateChecklistTitle = useCallback(async (checklistId: number, title: string) => {
    if (!taskId) return;
    try {
      await updateChecklist(taskId, checklistId, { title });
      setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, title } : c));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  const handleToggleChecklistItem = useCallback(async (checklistId: number, itemId: number, current: boolean) => {
    if (!taskId) return;
    try {
      const updated = await updateChecklistItem(taskId, checklistId, itemId, { isCompleted: !current });
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map(i => i.id === itemId ? updated : i) }
          : c
      ));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  const handleAddChecklistItem = useCallback(async (checklistId: number) => {
    if (!taskId) return;
    const title = (newItemTitles[checklistId] || "").trim();
    if (!title) return;
    try {
      const created = await createChecklistItem(taskId, checklistId, title);
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: [...c.items, created] }
          : c
      ));
      setNewItemTitles(prev => ({ ...prev, [checklistId]: "" }));
    } catch (e) {
      console.error(e);
    }
  }, [taskId, newItemTitles]);

  const handleDeleteChecklistItem = useCallback(async (checklistId: number, itemId: number) => {
    if (!taskId) return;
    try {
      await deleteChecklistItem(taskId, checklistId, itemId);
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      ));
    } catch (e) {
      console.error(e);
    }
  }, [taskId]);

  if (!drawerOpen || !drawerTask) return null;

  const subtaskCompleted = subtasks.filter(s => s.isCompleted).length;
  const subtaskTotal = subtasks.length;
  const subtaskPercent = subtaskTotal > 0 ? Math.round((subtaskCompleted / subtaskTotal) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

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
                <button onClick={onSaveChanges} className="p-1.5 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"><Save size={15} /></button>
                <button onClick={onCancelEditing} className="p-1.5 bg-asvo-card text-asvo-text-mid rounded-lg hover:bg-asvo-card-hover transition"><X size={15} /></button>
              </>
            ) : (
              <button onClick={onStartEditing} className="p-1.5 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"><Edit3 size={15} /></button>
            )}
            {onOpenFull && (
              <button onClick={onOpenFull} className="p-1.5 bg-asvo-surface-2 text-asvo-text-mid rounded-lg hover:bg-asvo-surface-3 hover:text-asvo-text transition" title="Открыть полностью"><Maximize2 size={15} /></button>
            )}
            <button onClick={onClose} className="p-1.5 text-asvo-text-dim hover:text-asvo-text transition"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Comment */}
          {isEditing ? (
            <textarea
              value={editForm.comment || ""}
              onChange={e => onEditFormChange({ ...editForm, comment: e.target.value })}
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
                <select value={editForm.status} onChange={e => onEditFormChange({ ...editForm, status: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
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
                <select value={editForm.priority || 1} onChange={e => onEditFormChange({ ...editForm, priority: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
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
                <select value={editForm.projectId || ""} onChange={e => onEditFormChange({ ...editForm, projectId: e.target.value || null })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
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
                <select value={editForm.responsibleId || ""} onChange={e => onEditFormChange({ ...editForm, responsibleId: e.target.value || null })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none">
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
                <input type="date" value={editForm.dueDate || ""} onChange={e => onEditFormChange({ ...editForm, dueDate: e.target.value })} className="w-full px-2 py-1 bg-asvo-bg border border-asvo-border rounded text-xs text-asvo-text focus:border-asvo-border-lt focus:outline-none" />
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

          {/* ── Subtasks ── */}
          <div>
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-asvo-text-dim uppercase tracking-wide mb-2">
              <ListChecks size={12} className="text-asvo-accent" /> Подзадачи
              {subtaskTotal > 0 && (
                <span className="text-asvo-accent ml-1">{subtaskCompleted}/{subtaskTotal}</span>
              )}
            </h3>

            {subtaskTotal > 0 && (
              <div className="mb-2">
                <ProgressBar value={subtaskPercent} color="accent" />
              </div>
            )}

            <div className="space-y-1">
              {subtasks.map(st => (
                <div key={st.id} className="group flex items-center gap-2 p-2 bg-asvo-card border border-asvo-border rounded-lg hover:bg-asvo-card-hover transition">
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => handleToggleSubtask(st)}
                    className="shrink-0 w-3.5 h-3.5 rounded border-asvo-border accent-asvo-accent cursor-pointer"
                  />
                  <span className={`flex-1 text-xs ${st.isCompleted ? "line-through text-asvo-text-dim" : "text-asvo-text"}`}>
                    {st.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-asvo-text-dim hover:text-asvo-red transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline add subtask */}
            <div className="flex items-center gap-2 mt-2">
              <input
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                placeholder="+ Добавить подзадачу..."
                className="flex-1 px-2.5 py-1.5 bg-asvo-card border border-asvo-border rounded-lg text-xs text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
              />
              {newSubtaskTitle.trim() && (
                <button onClick={handleAddSubtask} className="p-1.5 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition">
                  <Plus size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Checklists ── */}
          <div>
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-asvo-text-dim uppercase tracking-wide mb-2">
              <CheckSquare size={12} className="text-asvo-accent" /> Чеклисты
            </h3>

            <div className="space-y-3">
              {checklists.map(cl => {
                const clCompleted = cl.items.filter(i => i.isCompleted).length;
                const clTotal = cl.items.length;
                const clPercent = clTotal > 0 ? Math.round((clCompleted / clTotal) * 100) : 0;

                return (
                  <div key={cl.id} className="bg-asvo-card border border-asvo-border rounded-lg p-3">
                    {/* Checklist header */}
                    <div className="flex items-center justify-between mb-2">
                      <input
                        value={cl.title}
                        onChange={e => {
                          const v = e.target.value;
                          setChecklists(prev => prev.map(c => c.id === cl.id ? { ...c, title: v } : c));
                        }}
                        onBlur={e => handleUpdateChecklistTitle(cl.id, e.target.value)}
                        className="bg-transparent text-xs font-bold text-asvo-text focus:outline-none flex-1 min-w-0"
                      />
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {clTotal > 0 && (
                          <span className="text-[10px] text-asvo-text-dim">{clCompleted}/{clTotal}</span>
                        )}
                        <button
                          onClick={() => handleDeleteChecklist(cl.id)}
                          className="p-0.5 text-asvo-text-dim hover:text-asvo-red transition"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {clTotal > 0 && (
                      <div className="mb-2">
                        <ProgressBar value={clPercent} color="accent" />
                      </div>
                    )}

                    {/* Checklist items */}
                    <div className="space-y-1">
                      {cl.items.map(item => (
                        <div key={item.id} className="group flex items-center gap-2 p-1.5 rounded hover:bg-asvo-surface transition">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleChecklistItem(cl.id, item.id, item.isCompleted)}
                            className="shrink-0 w-3.5 h-3.5 rounded border-asvo-border accent-asvo-accent cursor-pointer"
                          />
                          <span className={`flex-1 text-xs ${item.isCompleted ? "line-through text-asvo-text-dim" : "text-asvo-text"}`}>
                            {item.title}
                          </span>
                          <button
                            onClick={() => handleDeleteChecklistItem(cl.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-asvo-text-dim hover:text-asvo-red transition"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add item */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        value={newItemTitles[cl.id] || ""}
                        onChange={e => setNewItemTitles(prev => ({ ...prev, [cl.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleAddChecklistItem(cl.id)}
                        placeholder="+ Пункт..."
                        className="flex-1 px-2 py-1 bg-asvo-surface border border-asvo-border rounded text-xs text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
                      />
                      {(newItemTitles[cl.id] || "").trim() && (
                        <button onClick={() => handleAddChecklistItem(cl.id)} className="p-1 bg-asvo-accent/15 text-asvo-accent rounded hover:bg-asvo-accent/25 transition">
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add checklist button */}
            <button
              onClick={handleAddChecklist}
              className="mt-2 w-full border border-dashed border-asvo-border rounded-lg p-2 text-[11px] text-asvo-text-dim font-medium hover:border-asvo-accent/30 hover:text-asvo-accent transition flex items-center justify-center gap-1.5"
            >
              <Plus size={12} /> Добавить чеклист
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDrawer;

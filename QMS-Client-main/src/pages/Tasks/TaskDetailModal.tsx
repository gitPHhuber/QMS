/**
 * TaskDetailModal.tsx — Полноценная модалка детального просмотра / редактирования задачи
 * Открывается из TaskDrawer (кнопка «Открыть полностью») или двойным кликом
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Edit3, Save, X, Trash2, AlertTriangle,
  ArrowRight, MapPin, Package, Maximize2,
  ListChecks, CheckSquare, Plus,
} from "lucide-react";

import { Modal } from "src/components/Modal/Modal";
import { ConfirmModal } from "src/components/Modal/ConfirmModal";
import {
  TaskDetailResponse,
  fetchTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "src/api/tasksApi";
import { Subtask, fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from "src/api/subtasksApi";
import {
  Checklist, ChecklistItem,
  fetchChecklists, createChecklist, updateChecklist, deleteChecklist,
  createChecklistItem, updateChecklistItem, deleteChecklistItem,
} from "src/api/checklistsApi";
import { fetchProjects, ProjectModel } from "src/api/projectsApi";
import { fetchUsers } from "src/api/userApi";
import { userGetModel } from "src/types/UserModel";
import ActionBtn from "src/components/qms/ActionBtn";
import Badge from "src/components/qms/Badge";
import Avatar from "src/components/qms/Avatar";
import CommentsList from "./CommentsList";
import ActivityTimeline from "./ActivityTimeline";
import {
  COLUMNS,
  originToBadge,
  getPriority,
  isOverdue,
} from "./tasksConstants";

/* ── Constants ── */

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  NEW:         { next: "IN_PROGRESS", label: "Взять в работу" },
  IN_PROGRESS: { next: "REVIEW",     label: "На проверку" },
  REVIEW:      { next: "DONE",       label: "Завершить" },
  DONE:        { next: "CLOSED",     label: "Закрыть" },
};

/* ── Props ── */

interface TaskDetailModalProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

/* ── Component ── */

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId, isOpen, onClose, onUpdated,
}) => {
  const [detail, setDetail] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [tab, setTab] = useState<"main" | "subtasks" | "checklists" | "comments" | "activity" | "breakdown" | "boxes">("main");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<userGetModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Subtasks state ── */
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskLoading, setSubtaskLoading] = useState(false);

  /* ── Checklists state ── */
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newItemTitles, setNewItemTitles] = useState<Record<number, string>>({});
  const [checklistLoading, setChecklistLoading] = useState(false);

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  /* ── Fetch ── */

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchTaskById(taskId);
      setDetail(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setTab("main");
      setEditing(false);
      setActionError(null);
      setSubtasks([]);
      setChecklists([]);
      setNewSubtaskTitle("");
      setNewItemTitles({});
    }
  }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers().then(setUsers).catch(() => {});
      fetchProjects().then(setProjects).catch(() => {});
    }
  }, [isOpen, users.length]);

  /* ── Subtask handlers ── */

  const loadSubtasks = useCallback(async () => {
    try {
      const data = await fetchSubtasks(taskId);
      setSubtasks(data);
    } catch {}
  }, [taskId]);

  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    setSubtaskLoading(true);
    try {
      const created = await createSubtask(taskId, title);
      setSubtasks(prev => [...prev, created]);
      setNewSubtaskTitle("");
    } catch {} finally { setSubtaskLoading(false); }
  };

  const handleToggleSubtask = async (st: Subtask) => {
    try {
      const updated = await updateSubtask(taskId, st.id, { isCompleted: !st.isCompleted });
      setSubtasks(prev => prev.map(s => s.id === st.id ? updated : s));
    } catch {}
  };

  const handleDeleteSubtask = async (id: number) => {
    try {
      await deleteSubtask(taskId, id);
      setSubtasks(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  /* ── Checklist handlers ── */

  const loadChecklists = useCallback(async () => {
    try {
      const data = await fetchChecklists(taskId);
      setChecklists(data);
    } catch {}
  }, [taskId]);

  const handleAddChecklist = async () => {
    setChecklistLoading(true);
    try {
      const created = await createChecklist(taskId);
      setChecklists(prev => [...prev, created]);
    } catch {} finally { setChecklistLoading(false); }
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    try {
      await deleteChecklist(taskId, checklistId);
      setChecklists(prev => prev.filter(c => c.id !== checklistId));
    } catch {}
  };

  const handleUpdateChecklistTitle = async (cl: Checklist, title: string) => {
    try {
      const updated = await updateChecklist(taskId, cl.id, { title });
      setChecklists(prev => prev.map(c => c.id === cl.id ? { ...c, title: updated.title } : c));
    } catch {}
  };

  const handleAddChecklistItem = async (checklistId: number) => {
    const title = (newItemTitles[checklistId] || "").trim();
    if (!title) return;
    try {
      const item = await createChecklistItem(taskId, checklistId, title);
      setChecklists(prev => prev.map(c =>
        c.id === checklistId ? { ...c, items: [...c.items, item] } : c
      ));
      setNewItemTitles(prev => ({ ...prev, [checklistId]: "" }));
    } catch {}
  };

  const handleToggleChecklistItem = async (checklistId: number, item: ChecklistItem) => {
    try {
      const updated = await updateChecklistItem(taskId, checklistId, item.id, { isCompleted: !item.isCompleted });
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map(i => i.id === item.id ? updated : i) }
          : c
      ));
    } catch {}
  };

  const handleDeleteChecklistItem = async (checklistId: number, itemId: number) => {
    try {
      await deleteChecklistItem(taskId, checklistId, itemId);
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      ));
    } catch {}
  };

  /* ── Load subtasks/checklists when tabs activated ── */

  useEffect(() => {
    if (isOpen && tab === "subtasks" && subtasks.length === 0) loadSubtasks();
  }, [isOpen, tab, loadSubtasks, subtasks.length]);

  useEffect(() => {
    if (isOpen && tab === "checklists" && checklists.length === 0) loadChecklists();
  }, [isOpen, tab, loadChecklists, checklists.length]);

  /* Also sync from detail response if available */
  useEffect(() => {
    if (detail?.subtasks) setSubtasks(detail.subtasks);
    if (detail?.checklists) setChecklists(detail.checklists);
  }, [detail]);

  /* ── Edit ── */

  const startEditing = () => {
    if (!detail) return;
    setEditForm({
      title: detail.task.title,
      comment: detail.task.comment || "",
      priority: detail.task.priority || 1,
      status: detail.task.status,
      dueDate: detail.task.dueDate?.split("T")[0] || "",
      responsibleId: detail.task.responsibleId || "",
      projectId: detail.task.projectId || "",
      targetQty: detail.task.targetQty,
    });
    setEditing(true);
    setActionError(null);
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateTask(detail.task.id, {
        title: editForm.title,
        comment: editForm.comment || undefined,
        priority: Number(editForm.priority) || 1,
        dueDate: editForm.dueDate || undefined,
        responsibleId: editForm.responsibleId ? Number(editForm.responsibleId) : null,
        projectId: editForm.projectId ? Number(editForm.projectId) : null,
        targetQty: Number(editForm.targetQty),
      });
      setEditing(false);
      await fetchDetail();
      onUpdated();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── Status transition ── */

  const handleStatusTransition = async () => {
    if (!detail) return;
    const flow = STATUS_FLOW[detail.task.status];
    if (!flow) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateTaskStatus(detail.task.id, flow.next);
      await fetchDetail();
      onUpdated();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete ── */

  const handleDelete = async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteTask(detail.task.id);
      setShowConfirm(false);
      onUpdated();
      onClose();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка удаления");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Helpers ── */

  const col = detail ? COLUMNS.find(c => c.key === detail.task.status) : null;
  const priority = detail ? getPriority(detail.task.priority) : getPriority(1);
  const overdue = detail ? isOverdue(detail.task.dueDate) && detail.task.status !== "DONE" && detail.task.status !== "CLOSED" : false;
  const isClosed = detail?.task.status === "CLOSED";

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const subtasksDone = subtasks.filter(s => s.isCompleted).length;
  const allChecklistItems = checklists.flatMap(c => c.items);
  const checklistItemsDone = allChecklistItems.filter(i => i.isCompleted).length;

  const tabs = [
    { key: "main" as const,       label: "Основное" },
    { key: "subtasks" as const,   label: `Подзадачи${subtasks.length ? ` (${subtasksDone}/${subtasks.length})` : ""}` },
    { key: "checklists" as const, label: `Чеклисты${allChecklistItems.length ? ` (${checklistItemsDone}/${allChecklistItems.length})` : ""}` },
    { key: "comments" as const,   label: "Комментарии" },
    { key: "activity" as const,   label: "История" },
    { key: "breakdown" as const,  label: `Производство${detail?.breakdown.length ? ` (${detail.breakdown.length})` : ""}` },
    { key: "boxes" as const,      label: `Коробки${detail?.boxes.length ? ` (${detail.boxes.length})` : ""}` },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-10">
          <AlertTriangle className="mx-auto text-red-400 mb-2" size={32} />
          <p className="text-red-400 text-[13px]">{error}</p>
          <ActionBtn variant="secondary" onClick={fetchDetail} className="mt-3">Повторить</ActionBtn>
        </div>
      )}

      {/* Content */}
      {!loading && !error && detail && (
        <div className="space-y-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">#{detail.task.id}</span>
                {detail.task.originType && originToBadge[detail.task.originType] && (
                  <Badge variant={originToBadge[detail.task.originType]}>
                    {detail.task.originType}{detail.task.originId ? ` #${detail.task.originId}` : ""}
                  </Badge>
                )}
                <span className={`text-[11px] font-bold ${priority.color}`}>
                  {priority.icon} {priority.title}
                </span>
                {col && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${col.badgeCls}`}>
                    {col.label}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{detail.task.title}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isClosed && !editing && (
                <button
                  onClick={startEditing}
                  className="p-2 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"
                  title="Редактировать"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── Progress ── */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2.5 rounded-full bg-asvo-bg">
                <div
                  className="h-2.5 rounded-full bg-asvo-accent transition-all"
                  style={{ width: `${Math.min(100, detail.task.progressPercent || 0)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-asvo-text w-12 text-right">
                {detail.task.progressPercent ?? 0}%
              </span>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-asvo-text-dim">
              <span>Целевое: <span className="text-asvo-text font-semibold">{detail.task.targetQty} {detail.task.unit}</span></span>
              {detail.task.stats && (
                <>
                  <span>Готово: <span className="text-[#2DD4A8] font-semibold">{detail.task.stats.done}</span></span>
                  <span>В работе: <span className="text-[#E8A830] font-semibold">{detail.task.stats.inWork}</span></span>
                  <span>На складе: <span className="text-asvo-text font-semibold">{detail.task.stats.onStock}</span></span>
                </>
              )}
            </div>
          </div>

          {/* ── Status actions ── */}
          {!editing && !isClosed && (
            <div className="flex items-center gap-2">
              {STATUS_FLOW[detail.task.status] && (
                <ActionBtn
                  variant="primary"
                  icon={<ArrowRight size={14} />}
                  onClick={handleStatusTransition}
                  disabled={actionLoading}
                >
                  {STATUS_FLOW[detail.task.status].label}
                </ActionBtn>
              )}
              <div className="flex-1" />
              <ActionBtn
                variant="secondary"
                icon={<Trash2 size={14} />}
                onClick={() => setShowConfirm(true)}
                disabled={actionLoading}
                className="!text-red-400 hover:!bg-red-500/10"
              >
                Удалить
              </ActionBtn>
            </div>
          )}

          {/* ── Action Error ── */}
          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{actionError}</span>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                  tab === t.key ? "text-asvo-accent border-asvo-accent" : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">

            {/* ─── Tab: Main (view) ─── */}
            {tab === "main" && !editing && (
              <>
                {detail.task.comment && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{detail.task.comment}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Status */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Статус</div>
                    <div className="mt-0.5">
                      {col && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${col.badgeCls}`}>
                          {col.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Приоритет</div>
                    <div className={`text-[13px] font-medium mt-0.5 ${priority.color}`}>
                      {priority.icon} {priority.title}
                    </div>
                  </div>

                  {/* Project */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Проект</div>
                    <div className="text-[13px] font-medium mt-0.5 text-asvo-blue">
                      {detail.task.project?.title || projects.find(p => p.id === detail.task.projectId)?.title || "\u2014"}
                    </div>
                  </div>

                  {/* Responsible */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Исполнитель</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {detail.task.responsible && (
                        <Avatar
                          name={`${detail.task.responsible.surname} ${detail.task.responsible.name}`}
                          size="sm"
                          color="accent"
                        />
                      )}
                      <span className="text-[13px] text-asvo-text">
                        {detail.task.responsible ? `${detail.task.responsible.surname} ${detail.task.responsible.name}` : "\u2014"}
                      </span>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Срок сдачи</div>
                    <div className={`text-[13px] font-medium mt-0.5 ${overdue ? "text-[#F06060] font-semibold" : "text-asvo-text"}`}>
                      {fmtDate(detail.task.dueDate)}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Источник</div>
                    <div className="mt-0.5">
                      {detail.task.originType && originToBadge[detail.task.originType] ? (
                        <Badge variant={originToBadge[detail.task.originType]}>
                          {detail.task.originType}{detail.task.originId ? ` #${detail.task.originId}` : ""}
                        </Badge>
                      ) : (
                        <span className="text-[13px] text-asvo-text-dim">{detail.task.originType || "\u2014"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isClosed && (
                  <ActionBtn variant="secondary" onClick={startEditing}>Редактировать</ActionBtn>
                )}
              </>
            )}

            {/* ─── Tab: Main (edit) ─── */}
            {tab === "main" && editing && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Название</label>
                  <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Описание</label>
                  <textarea
                    value={editForm.comment}
                    onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Описание задачи..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Приоритет</label>
                    <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className={inputCls}>
                      <option value="1">Низкий</option>
                      <option value="2">Средний</option>
                      <option value="3">Высокий</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Целевое кол-во</label>
                    <input type="number" value={editForm.targetQty} onChange={e => setEditForm({ ...editForm, targetQty: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Проект</label>
                    <select value={editForm.projectId} onChange={e => setEditForm({ ...editForm, projectId: e.target.value || null })} className={inputCls}>
                      <option value="">Без проекта</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Исполнитель</label>
                    <select value={editForm.responsibleId} onChange={e => setEditForm({ ...editForm, responsibleId: e.target.value || null })} className={inputCls}>
                      <option value="">Не назначен</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Срок сдачи</label>
                  <input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <ActionBtn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить"}
                  </ActionBtn>
                  <ActionBtn variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Отмена</ActionBtn>
                </div>
              </div>
            )}

            {/* ─── Tab: Subtasks ─── */}
            {tab === "subtasks" && (
              <div className="space-y-3">
                {/* Progress */}
                {subtasks.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-asvo-bg">
                      <div
                        className="h-2 rounded-full bg-asvo-accent transition-all"
                        style={{ width: `${subtasks.length > 0 ? Math.round((subtasksDone / subtasks.length) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-asvo-text-dim font-medium">
                      {subtasksDone}/{subtasks.length}
                    </span>
                  </div>
                )}

                {/* Subtask list */}
                <div className="space-y-1">
                  {subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group py-1 px-1 rounded hover:bg-asvo-surface/50">
                      <button
                        onClick={() => handleToggleSubtask(st)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition ${
                          st.isCompleted
                            ? "bg-asvo-accent border-asvo-accent"
                            : "border-asvo-border hover:border-asvo-accent/50"
                        }`}
                      >
                        {st.isCompleted && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-[13px] ${st.isCompleted ? "line-through text-asvo-text-dim" : "text-asvo-text"}`}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-asvo-text-dim hover:text-red-400 transition p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add subtask */}
                {!isClosed && (
                  <div className="flex items-center gap-2">
                    <input
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                      placeholder="Новая подзадача..."
                      className={inputCls + " flex-1"}
                      disabled={subtaskLoading}
                    />
                    <ActionBtn
                      variant="secondary"
                      icon={<Plus size={14} />}
                      onClick={handleAddSubtask}
                      disabled={subtaskLoading || !newSubtaskTitle.trim()}
                    >
                      Добавить
                    </ActionBtn>
                  </div>
                )}

                {subtasks.length === 0 && (
                  <p className="text-[13px] text-asvo-text-dim">Подзадачи не добавлены</p>
                )}
              </div>
            )}

            {/* ─── Tab: Checklists ─── */}
            {tab === "checklists" && (
              <div className="space-y-4">
                {checklists.map(cl => {
                  const clDone = cl.items.filter(i => i.isCompleted).length;
                  const clTotal = cl.items.length;
                  return (
                    <div key={cl.id} className="bg-asvo-surface border border-asvo-border rounded-lg p-3 space-y-2">
                      {/* Checklist header */}
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} className="text-asvo-accent shrink-0" />
                        <input
                          defaultValue={cl.title}
                          onBlur={e => {
                            const v = e.target.value.trim();
                            if (v && v !== cl.title) handleUpdateChecklistTitle(cl, v);
                          }}
                          className="flex-1 bg-transparent text-[13px] text-asvo-text font-semibold focus:outline-none focus:border-b focus:border-asvo-accent/30"
                        />
                        <button
                          onClick={() => handleDeleteChecklist(cl.id)}
                          className="text-asvo-text-dim hover:text-red-400 transition p-0.5"
                          title="Удалить чеклист"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Progress */}
                      {clTotal > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-asvo-bg">
                            <div
                              className="h-1.5 rounded-full bg-asvo-accent transition-all"
                              style={{ width: `${Math.round((clDone / clTotal) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-asvo-text-dim">{clDone}/{clTotal}</span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-1">
                        {cl.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 group py-0.5 px-1 rounded hover:bg-asvo-surface-2/50">
                            <button
                              onClick={() => handleToggleChecklistItem(cl.id, item)}
                              className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition ${
                                item.isCompleted
                                  ? "bg-asvo-accent border-asvo-accent"
                                  : "border-asvo-border hover:border-asvo-accent/50"
                              }`}
                            >
                              {item.isCompleted && (
                                <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <span className={`flex-1 text-[12px] ${item.isCompleted ? "line-through text-asvo-text-dim" : "text-asvo-text"}`}>
                              {item.title}
                            </span>
                            <button
                              onClick={() => handleDeleteChecklistItem(cl.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-asvo-text-dim hover:text-red-400 transition p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add item */}
                      {!isClosed && (
                        <div className="flex items-center gap-2">
                          <input
                            value={newItemTitles[cl.id] || ""}
                            onChange={e => setNewItemTitles(prev => ({ ...prev, [cl.id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && handleAddChecklistItem(cl.id)}
                            placeholder="Добавить пункт..."
                            className="flex-1 bg-transparent border-b border-asvo-border/50 text-[12px] text-asvo-text py-1 focus:outline-none focus:border-asvo-accent/50 placeholder:text-asvo-text-dim"
                          />
                          <button
                            onClick={() => handleAddChecklistItem(cl.id)}
                            className="text-asvo-accent hover:text-asvo-accent/70 transition"
                            disabled={!(newItemTitles[cl.id] || "").trim()}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add checklist */}
                {!isClosed && (
                  <ActionBtn
                    variant="secondary"
                    icon={<Plus size={14} />}
                    onClick={handleAddChecklist}
                    disabled={checklistLoading}
                  >
                    Добавить чеклист
                  </ActionBtn>
                )}

                {checklists.length === 0 && (
                  <p className="text-[13px] text-asvo-text-dim">Чеклисты не добавлены</p>
                )}
              </div>
            )}

            {/* ─── Tab: Comments ─── */}
            {tab === "comments" && (
              <CommentsList taskId={taskId} users={users} />
            )}

            {/* ─── Tab: Activity ─── */}
            {tab === "activity" && (
              <ActivityTimeline taskId={taskId} />
            )}

            {/* ─── Tab: Breakdown ─── */}
            {tab === "breakdown" && (
              <>
                {detail.breakdown.length === 0 ? (
                  <p className="text-[13px] text-asvo-text-dim">Данные по производству отсутствуют</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-asvo-border">
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Участок</th>
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Статус</th>
                          <th className="text-right py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Кол-во</th>
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold w-32">Доля</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.breakdown.map((item, idx) => {
                          const share = detail.totalQty > 0 ? Math.round((item.qty / detail.totalQty) * 100) : 0;
                          const statusCol = COLUMNS.find(c => c.key === item.status);
                          return (
                            <tr key={idx} className="border-b border-asvo-border/50">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={12} className="text-asvo-accent shrink-0" />
                                  <span className="text-asvo-text">{item.sectionTitle || "Основной склад"}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                {statusCol ? (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusCol.badgeCls}`}>
                                    {statusCol.label}
                                  </span>
                                ) : (
                                  <span className="text-asvo-text-dim">{item.status}</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-asvo-text">{item.qty}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-asvo-bg">
                                    <div
                                      className="h-1.5 rounded-full bg-asvo-accent"
                                      style={{ width: `${share}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-asvo-text-dim w-8 text-right">{share}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-2 text-[12px] text-asvo-text-dim">
                      Итого: <span className="text-asvo-text font-bold ml-1">{detail.totalQty} {detail.task.unit}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── Tab: Boxes ─── */}
            {tab === "boxes" && (
              <>
                {detail.boxes.length === 0 ? (
                  <p className="text-[13px] text-asvo-text-dim">Коробки не привязаны к задаче</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-asvo-border">
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Код</th>
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Название</th>
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Участок</th>
                          <th className="text-left py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Статус</th>
                          <th className="text-right py-2 px-2 text-[10px] text-asvo-text-dim uppercase font-bold">Кол-во</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.boxes.map((box) => (
                          <tr key={box.id} className="border-b border-asvo-border/50">
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                <Package size={12} className="text-asvo-text-dim shrink-0" />
                                <span className="font-mono text-asvo-accent text-[12px]">{box.shortCode || box.qrCode?.slice(-8) || `#${box.id}`}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-asvo-text truncate max-w-[200px]">{box.displayName || box.label}</td>
                            <td className="py-2 px-2 text-asvo-text-mid">{box.section?.title || box.currentSection?.title || "\u2014"}</td>
                            <td className="py-2 px-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-asvo-surface text-asvo-text-mid">{box.status}</span>
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-asvo-text">{box.quantity} {box.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Удаление задачи"
        message={`Удалить задачу "${detail?.task.title}"?`}
        confirmText="Удалить"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  );
};

export default TaskDetailModal;

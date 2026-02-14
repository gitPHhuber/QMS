import React from "react";
import { Edit3, Save, X, ChevronRight, MapPin, Maximize2 } from "lucide-react";
import { TaskDetailResponse } from "src/api/tasksApi";
import { ProjectModel } from "src/api/projectsApi";
import { userGetModel } from "src/types/UserModel";
import Badge from "src/components/qms/Badge";
import Avatar from "src/components/qms/Avatar";
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
  if (!drawerOpen || !drawerTask) return null;

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
        </div>
      </div>
    </>
  );
};

export default TaskDrawer;

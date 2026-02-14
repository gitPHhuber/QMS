import React, { DragEvent } from "react";
import { Plus, Loader2, Calendar, AlertTriangle, ListChecks, CheckSquare } from "lucide-react";
import { ProductionTask, TaskDetailResponse } from "src/api/tasksApi";
import Badge from "src/components/qms/Badge";
import StatusDot from "src/components/qms/StatusDot";
import ProgressBar from "src/components/qms/ProgressBar";
import Avatar from "src/components/qms/Avatar";
import {
  ColumnDef,
  COLUMNS,
  originToBadge,
  getPriority,
  isOverdue,
  formatDate,
  TaskStats,
} from "./tasksConstants";

interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

interface TaskBoardViewProps {
  grouped: Record<string, ExtendedTask[]>;
  columns: ColumnDef[];
  dragOverCol: string | null;
  draggingId: number | null;
  drawerTask: TaskDetailResponse | null;
  drawerOpen: boolean;
  loading: boolean;
  onDragStart: (e: DragEvent, task: ExtendedTask) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent, colKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent, toStatus: string) => void;
  openDrawer: (id: number) => void;
  setIsModalOpen: (open: boolean) => void;
}

const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  grouped,
  columns,
  dragOverCol,
  draggingId,
  drawerTask,
  drawerOpen,
  loading,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  openDrawer,
  setIsModalOpen,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {columns.map(col => {
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

                    {/* Row 4.5: Subtask/Checklist indicators */}
                    {((task.subtaskProgress?.total ?? 0) > 0 || (task.checklistProgress?.total ?? 0) > 0) && (
                      <div className="flex items-center gap-3 mb-1.5 text-[10px] text-asvo-text-dim">
                        {(task.subtaskProgress?.total ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <ListChecks size={10} />
                            {task.subtaskProgress!.completed}/{task.subtaskProgress!.total}
                          </span>
                        )}
                        {(task.checklistProgress?.total ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckSquare size={10} />
                            {task.checklistProgress!.completed}/{task.checklistProgress!.total}
                          </span>
                        )}
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
  );
};

export default TaskBoardView;

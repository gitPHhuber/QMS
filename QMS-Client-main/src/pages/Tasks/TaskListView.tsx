import React from "react";
import { Loader2 } from "lucide-react";
import { ProductionTask, TaskDetailResponse } from "src/api/tasksApi";
import { userGetModel } from "src/types/UserModel";
import Badge from "src/components/qms/Badge";
import ProgressBar from "src/components/qms/ProgressBar";
import Avatar from "src/components/qms/Avatar";
import {
  COLUMNS,
  originToBadge,
  getPriority,
  isOverdue,
  TaskStats,
} from "./tasksConstants";

interface ExtendedTask extends ProductionTask { stats?: TaskStats; }

interface TaskListViewProps {
  filtered: ExtendedTask[];
  loading: boolean;
  drawerTask: TaskDetailResponse | null;
  drawerOpen: boolean;
  users: userGetModel[];
  openDrawer: (id: number) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  filtered,
  loading,
  drawerTask,
  drawerOpen,
  users,
  openDrawer,
}) => {
  return (
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
  );
};

export default TaskListView;

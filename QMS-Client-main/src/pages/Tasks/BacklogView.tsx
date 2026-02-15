import React, { useEffect, useState, useCallback } from "react";
import { Inbox, ArrowRight } from "lucide-react";
import { ProductionTask, fetchTasks, updateTask } from "src/api/tasksApi";
import { SprintModel, fetchSprintsForProject } from "src/api/sprintsApi";

interface BacklogViewProps {
  projectId: number;
  onRefresh?: () => void;
}

const BacklogView: React.FC<BacklogViewProps> = ({ projectId, onRefresh }) => {
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [sprints, setSprints] = useState<SprintModel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sp] = await Promise.all([
        fetchTasks({ projectId, backlog: true, limit: 500 }),
        fetchSprintsForProject(projectId),
      ]);
      setTasks(res.rows);
      setSprints(sp.filter(s => s.status !== "COMPLETED"));
    } catch {} finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (taskId: number, sprintId: number) => {
    try {
      await updateTask(taskId, { sprintId });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      onRefresh?.();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Inbox size={14} className="text-asvo-accent" />
        <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
          Бэклог ({tasks.length})
        </span>
      </div>

      {tasks.length === 0 && (
        <p className="text-[12px] text-asvo-text-dim text-center py-4">
          Все задачи распределены по спринтам
        </p>
      )}

      {tasks.length > 0 && (
        <div className="space-y-1.5">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-2.5 bg-asvo-card border border-asvo-border rounded-lg group hover:border-asvo-border-lt transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-asvo-accent">#{task.id}</span>
                  <span className="text-[12px] text-asvo-text font-medium truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-asvo-text-dim">
                  {task.responsible && (
                    <span>{task.responsible.surname} {task.responsible.name}</span>
                  )}
                  {task.dueDate && (
                    <span>{new Date(task.dueDate).toLocaleDateString("ru")}</span>
                  )}
                </div>
              </div>

              {sprints.length > 0 && (
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <select
                    onChange={e => {
                      if (e.target.value) handleAssign(task.id, Number(e.target.value));
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="px-2 py-1 bg-asvo-surface border border-asvo-border rounded text-[11px] text-asvo-text focus:outline-none"
                  >
                    <option value="" disabled>
                      <ArrowRight size={10} /> В спринт...
                    </option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BacklogView;

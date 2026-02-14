import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Layers, AlertTriangle } from "lucide-react";
import { EpicModel, fetchEpicById } from "src/api/epicsApi";
import ProgressBar from "src/components/qms/ProgressBar";
import TasksList from "./TasksList";

interface EpicDetailViewProps {
  epicId: number;
  onBack: () => void;
}

const EpicDetailView: React.FC<EpicDetailViewProps> = ({ epicId, onBack }) => {
  const [epic, setEpic] = useState<EpicModel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEpicById(epicId);
      setEpic(data);
    } catch {} finally { setLoading(false); }
  }, [epicId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!epic) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400 text-[13px]">Эпик не найден</p>
        <button onClick={onBack} className="mt-2 text-asvo-accent text-sm">Назад</button>
      </div>
    );
  }

  const progress = epic.stats && epic.stats.totalTasks > 0
    ? Math.round((epic.stats.completedTasks / epic.stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-asvo-surface border border-asvo-border rounded-lg hover:bg-asvo-surface-2 transition mt-0.5"
        >
          <ArrowLeft size={16} className="text-asvo-text-mid" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${epic.color}20` }}
            >
              <Layers size={18} style={{ color: epic.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-asvo-text">{epic.title}</h2>
              <span className="text-[10px] text-asvo-text-dim uppercase font-semibold">{epic.status}</span>
            </div>
          </div>

          {epic.description && (
            <p className="text-[13px] text-asvo-text-mid mt-2">{epic.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-asvo-card border border-asvo-border rounded-xl p-4">
        <ProgressBar value={progress} color="accent" />
        <div className="flex items-center gap-4 mt-3 text-[12px] text-asvo-text-dim">
          <span>Всего задач: <b className="text-asvo-text">{epic.stats?.totalTasks || 0}</b></span>
          <span>Завершено: <b className="text-[#2DD4A8]">{epic.stats?.completedTasks || 0}</b></span>
          {(epic.stats?.overdueTasks || 0) > 0 && (
            <span className="flex items-center gap-1 text-[#F06060]">
              <AlertTriangle size={12} /> Просрочено: {epic.stats!.overdueTasks}
            </span>
          )}
          <span className="text-asvo-accent font-bold ml-auto">{progress}%</span>
        </div>
      </div>

      {/* Tasks filtered by epicId */}
      <TasksList epicId={epicId} />
    </div>
  );
};

export default EpicDetailView;

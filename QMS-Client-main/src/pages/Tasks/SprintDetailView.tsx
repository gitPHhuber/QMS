import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Target,
  Play,
  CheckCircle2,
  Clock,
  ClipboardList,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import {
  SprintModel,
  BurndownPoint,
  fetchSprintById,
  fetchBurndown,
  startSprint,
  completeSprint,
} from "src/api/sprintsApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TasksList from "./TasksList";

interface SprintDetailViewProps {
  sprintId: number;
  projectId: number;
  onBack: () => void;
}

const SprintDetailView: React.FC<SprintDetailViewProps> = ({ sprintId, projectId, onBack }) => {
  const [sprint, setSprint] = useState<SprintModel | null>(null);
  const [burndown, setBurndown] = useState<BurndownPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        fetchSprintById(sprintId),
        fetchBurndown(sprintId),
      ]);
      setSprint(s);
      setBurndown(b);
    } catch {} finally { setLoading(false); }
  }, [sprintId]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    try {
      await startSprint(sprintId);
      load();
    } catch {}
  };

  const handleComplete = async () => {
    try {
      await completeSprint(sprintId);
      load();
    } catch {}
  };

  if (loading || !sprint) {
    return (
      <div className="flex items-center justify-center py-20 text-asvo-text-dim">
        <Clock className="animate-spin mr-2" size={16} /> Загрузка...
      </div>
    );
  }

  const progress = sprint.taskCount && sprint.taskCount > 0
    ? Math.round(((sprint.completedCount || 0) / sprint.taskCount) * 100)
    : 0;
  const remaining = (sprint.taskCount || 0) - (sprint.completedCount || 0);

  const chartData = burndown.map(p => ({
    date: new Date(p.date).toLocaleDateString("ru", { day: "2-digit", month: "2-digit" }),
    remaining: p.remainingTasks,
    ideal: p.idealRemaining != null ? Math.round(p.idealRemaining * 10) / 10 : null,
  }));

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 bg-asvo-surface border border-asvo-border rounded-xl text-asvo-text-mid hover:text-asvo-text hover:border-asvo-border-lt transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="p-3 bg-asvo-accent/10 text-asvo-accent rounded-xl border border-asvo-accent/15">
          <Target size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              sprint.status === "ACTIVE"
                ? "bg-[#2DD4A8]/10 text-[#2DD4A8]"
                : sprint.status === "COMPLETED"
                  ? "bg-[#3A4E62]/10 text-[#3A4E62]"
                  : "bg-[#4A90E8]/10 text-[#4A90E8]"
            }`}>
              {sprint.status === "ACTIVE" ? "Активный" : sprint.status === "COMPLETED" ? "Завершён" : "Планирование"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-asvo-text truncate">{sprint.title}</h2>
          {sprint.goal && (
            <p className="text-sm text-asvo-text-mid mt-0.5 line-clamp-2">{sprint.goal}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-asvo-text-dim">
            {sprint.startDate && sprint.endDate && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(sprint.startDate).toLocaleDateString("ru")} — {new Date(sprint.endDate).toLocaleDateString("ru")}
              </span>
            )}
            <span>Автор: {sprint.createdBy?.surname} {sprint.createdBy?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {sprint.status === "PLANNING" && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-2 bg-asvo-accent/15 text-asvo-accent rounded-lg text-xs font-semibold hover:bg-asvo-accent/25 transition"
            >
              <Play size={14} /> Запустить
            </button>
          )}
          {sprint.status === "ACTIVE" && (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#2DD4A8]/15 text-[#2DD4A8] rounded-lg text-xs font-semibold hover:bg-[#2DD4A8]/25 transition"
            >
              <CheckCircle2 size={14} /> Завершить
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-[#4A90E8]/10 border-[#4A90E8]/20">
            <ClipboardList size={18} className="text-[#4A90E8]" />
          </div>
          <div>
            <div className="text-xl font-bold text-asvo-text">{sprint.taskCount || 0}</div>
            <div className="text-[10px] text-asvo-text-dim uppercase font-semibold tracking-wide">Всего задач</div>
          </div>
        </div>
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-[#2DD4A8]/10 border-[#2DD4A8]/20">
            <CheckCircle2 size={18} className="text-[#2DD4A8]" />
          </div>
          <div>
            <div className="text-xl font-bold text-asvo-text">{sprint.completedCount || 0}</div>
            <div className="text-[10px] text-asvo-text-dim uppercase font-semibold tracking-wide">Выполнено</div>
          </div>
        </div>
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-[#E8A830]/10 border-[#E8A830]/20">
            <AlertTriangle size={18} className="text-[#E8A830]" />
          </div>
          <div>
            <div className="text-xl font-bold text-asvo-text">{remaining}</div>
            <div className="text-[10px] text-asvo-text-dim uppercase font-semibold tracking-wide">Осталось</div>
          </div>
        </div>
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-asvo-accent/10 border-asvo-accent/20">
            <TrendingDown size={18} className="text-asvo-accent" />
          </div>
          <div>
            <div className="text-xl font-bold text-asvo-text">{progress}%</div>
            <div className="text-[10px] text-asvo-text-dim uppercase font-semibold tracking-wide">Прогресс</div>
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      {chartData.length > 0 && (
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={14} className="text-asvo-accent" />
            <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
              Burndown Chart
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
              <XAxis
                dataKey="date"
                stroke="#3A4E62"
                tick={{ fill: "#8BA3B8", fontSize: 11 }}
              />
              <YAxis
                stroke="#3A4E62"
                tick={{ fill: "#8BA3B8", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111D2B",
                  border: "1px solid #1A2D42",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#E2E8F0",
                }}
                labelStyle={{ color: "#8BA3B8" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#8BA3B8" }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#3A4E62"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Идеальная линия"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#2DD4A8"
                strokeWidth={2.5}
                dot={{ fill: "#2DD4A8", r: 3 }}
                activeDot={{ r: 5, fill: "#2DD4A8" }}
                name="Оставшиеся задачи"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={14} className="text-asvo-accent" />
          <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
            Задачи спринта
          </span>
        </div>
        <TasksList projectId={projectId} sprintId={sprintId} />
      </div>
    </div>
  );
};

export default SprintDetailView;

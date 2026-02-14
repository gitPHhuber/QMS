import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Target,
  ChevronRight,
} from "lucide-react";
import {
  SprintModel,
  fetchSprintsForProject,
  createSprint,
  startSprint,
  completeSprint,
} from "src/api/sprintsApi";
import { Modal } from "src/components/Modal/Modal";
import ProgressBar from "src/components/qms/ProgressBar";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PLANNING:  { bg: "bg-[#4A90E8]/10", text: "text-[#4A90E8]", label: "Планирование" },
  ACTIVE:    { bg: "bg-[#2DD4A8]/10", text: "text-[#2DD4A8]", label: "Активный" },
  COMPLETED: { bg: "bg-[#3A4E62]/10", text: "text-[#3A4E62]", label: "Завершён" },
};

interface SprintSectionProps {
  projectId: number;
  onSelectSprint: (sprint: SprintModel) => void;
}

const SprintSection: React.FC<SprintSectionProps> = ({ projectId, onSelectSprint }) => {
  const [sprints, setSprints] = useState<SprintModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", goal: "", startDate: "", endDate: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSprintsForProject(projectId);
      setSprints(data);
    } catch {} finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await createSprint({
        projectId,
        title: form.title.trim(),
        goal: form.goal.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setShowCreate(false);
      setForm({ title: "", goal: "", startDate: "", endDate: "" });
      load();
    } catch {}
  };

  const handleStart = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await startSprint(id);
      load();
    } catch {}
  };

  const handleComplete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await completeSprint(id);
      load();
    } catch {}
  };

  const activeSprint = sprints.find(s => s.status === "ACTIVE");

  return (
    <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-asvo-accent" />
          <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
            Спринты ({sprints.length})
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-asvo-accent/10 text-asvo-accent rounded-lg text-[11px] font-semibold hover:bg-asvo-accent/20 transition"
        >
          <Plus size={12} /> Спринт
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {!loading && sprints.length === 0 && (
        <p className="text-[12px] text-asvo-text-dim text-center py-4">
          Спринты не созданы
        </p>
      )}

      {!loading && sprints.length > 0 && (
        <div className="space-y-2">
          {sprints.map(sprint => {
            const st = STATUS_COLORS[sprint.status] || STATUS_COLORS.PLANNING;
            const progress = sprint.taskCount && sprint.taskCount > 0
              ? Math.round(((sprint.completedCount || 0) / sprint.taskCount) * 100)
              : 0;
            const isActive = sprint.status === "ACTIVE";

            return (
              <div
                key={sprint.id}
                onClick={() => onSelectSprint(sprint)}
                className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? "bg-asvo-accent/5 border-asvo-accent/20 hover:border-asvo-accent/40"
                    : "bg-asvo-card border-asvo-border hover:border-asvo-border-lt"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                    <h4 className="text-[13px] font-bold text-asvo-text truncate">{sprint.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {sprint.status === "PLANNING" && (
                      <button
                        onClick={e => handleStart(e, sprint.id)}
                        className="p-1 bg-asvo-accent/10 text-asvo-accent rounded hover:bg-asvo-accent/20 transition"
                        title="Запустить спринт"
                      >
                        <Play size={12} />
                      </button>
                    )}
                    {sprint.status === "ACTIVE" && (
                      <button
                        onClick={e => handleComplete(e, sprint.id)}
                        className="p-1 bg-[#2DD4A8]/10 text-[#2DD4A8] rounded hover:bg-[#2DD4A8]/20 transition"
                        title="Завершить спринт"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    )}
                    <ChevronRight size={14} className="text-asvo-text-dim group-hover:text-asvo-text transition" />
                  </div>
                </div>

                {sprint.startDate && sprint.endDate && (
                  <div className="flex items-center gap-1 text-[10px] text-asvo-text-dim mb-1.5">
                    <Clock size={10} />
                    {new Date(sprint.startDate).toLocaleDateString("ru")} — {new Date(sprint.endDate).toLocaleDateString("ru")}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={progress} color="accent" />
                  </div>
                  <span className="text-[10px] text-asvo-text-dim shrink-0">
                    {sprint.completedCount || 0}/{sprint.taskCount || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <div className="p-1">
          <h2 className="text-lg font-bold text-asvo-text mb-5">Создать спринт</h2>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Название спринта"
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
            />
            <textarea
              value={form.goal}
              onChange={e => setForm({ ...form, goal: e.target.value })}
              placeholder="Цель спринта (опционально)"
              rows={2}
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-asvo-text-dim mb-1">Начало</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-asvo-text-dim mb-1">Окончание</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.title.trim()}
              className="w-full mt-2 py-3 bg-gradient-to-r from-asvo-accent to-asvo-accent/80 hover:from-asvo-accent hover:to-asvo-accent text-asvo-bg font-bold rounded-xl transition-all text-sm shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SprintSection;

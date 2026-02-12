import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  FolderOpen,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  X,
  Edit3,
  Users,
} from "lucide-react";
import {
  fetchProjectById,
  updateProject,
  ProjectModel,
} from "src/api/projectsApi";
import Avatar from "src/components/qms/Avatar";
import TasksList from "./TasksList";

const AVATAR_COLORS = ["accent", "blue", "purple", "amber", "red", "green", "orange"] as const;

const STATUS_SEGMENTS: { key: string; label: string; color: string }[] = [
  { key: "NEW",         label: "Новые",       color: "#4A90E8" },
  { key: "IN_PROGRESS", label: "В работе",    color: "#E8A830" },
  { key: "REVIEW",      label: "Проверка",    color: "#A06AE8" },
  { key: "DONE",        label: "Готово",       color: "#2DD4A8" },
  { key: "CLOSED",      label: "Закрыто",     color: "#3A4E62" },
];

interface ProjectDetailViewProps {
  projectId: number;
  onBack: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<ProjectModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  const load = async () => {
    const data = await fetchProjectById(projectId);
    setProject(data);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const startEditing = () => {
    if (!project) return;
    setEditForm({ title: project.title, description: project.description || "" });
    setIsEditing(true);
  };

  const saveEditing = async () => {
    if (!project) return;
    await updateProject(project.id, editForm);
    setIsEditing(false);
    load();
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20 text-asvo-text-dim">
        <Clock className="animate-spin mr-2" size={16} /> Загрузка...
      </div>
    );
  }

  const stats = project.taskStats;
  const members = project.members || [];
  const byStatus = stats?.byStatus ?? { NEW: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CLOSED: 0 };
  const total = stats?.total ?? 0;
  const overdue = stats?.overdue ?? 0;
  const progressPercent = stats?.progressPercent ?? 0;
  const inProgress = byStatus.IN_PROGRESS + byStatus.REVIEW;
  const done = byStatus.DONE + byStatus.CLOSED;

  return (
    <div className="animate-fade-in space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 bg-asvo-surface border border-asvo-border rounded-xl text-asvo-text-mid hover:text-asvo-text hover:border-asvo-border-lt transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="p-3 bg-asvo-accent/10 text-asvo-accent rounded-xl border border-asvo-accent/15">
          <FolderOpen size={24} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-1.5 bg-asvo-card border border-asvo-border rounded-lg text-base font-bold text-asvo-text focus:border-asvo-accent/50 focus:outline-none"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-1.5 bg-asvo-card border border-asvo-border rounded-lg text-sm text-asvo-text-mid focus:border-asvo-accent/50 focus:outline-none resize-none"
                rows={2}
              />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-asvo-text truncate">{project.title}</h2>
              <p className="text-sm text-asvo-text-mid mt-0.5 line-clamp-2">
                {project.description || "Нет описания"}
              </p>
            </>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-asvo-text-dim">
            <span>Автор: {project.author?.surname} {project.author?.name}</span>
            <span>{new Date(project.createdAt).toLocaleDateString("ru")}</span>
            <span className="px-2 py-0.5 rounded-full bg-asvo-accent/10 text-asvo-accent font-semibold text-[10px]">
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={saveEditing}
                className="p-2 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 bg-asvo-card text-asvo-text-mid rounded-lg hover:bg-asvo-card-hover transition"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="p-2 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<ClipboardList size={18} className="text-[#4A90E8]" />}
          label="Всего задач"
          value={total}
          color="#4A90E8"
        />
        <KpiCard
          icon={<Clock size={18} className="text-[#E8A830]" />}
          label="В работе"
          value={inProgress}
          color="#E8A830"
        />
        <KpiCard
          icon={<CheckCircle2 size={18} className="text-[#2DD4A8]" />}
          label="Выполнено"
          value={done}
          color="#2DD4A8"
        />
        <KpiCard
          icon={<AlertTriangle size={18} className="text-[#F06060]" />}
          label="Просрочено"
          value={overdue}
          color="#F06060"
        />
      </div>

      {/* ── Segmented progress bar + legend ── */}
      {total > 0 && (
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
              Прогресс по статусам
            </span>
            <span className="text-xs text-asvo-text-mid font-mono">
              {progressPercent}% завершено
            </span>
          </div>

          {/* Segmented bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-asvo-bg">
            {STATUS_SEGMENTS.map(seg => {
              const count = byStatus[seg.key as keyof typeof byStatus] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={seg.key}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {STATUS_SEGMENTS.map(seg => {
              const count = byStatus[seg.key as keyof typeof byStatus] ?? 0;
              return (
                <div key={seg.key} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-asvo-text-mid">{seg.label}</span>
                  <span className="text-asvo-text font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Members panel ── */}
      {members.length > 0 && (
        <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-asvo-accent" />
            <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
              Участники ({members.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 bg-asvo-card border border-asvo-border rounded-lg px-3 py-1.5">
                <Avatar
                  name={`${m.name} ${m.surname}`}
                  size="sm"
                  color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                />
                <span className="text-xs text-asvo-text">{m.surname} {m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Embedded Kanban ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={14} className="text-asvo-accent" />
          <span className="text-[10px] text-asvo-text-dim font-bold uppercase tracking-wide">
            Задачи проекта
          </span>
        </div>
        <TasksList projectId={projectId} />
      </div>
    </div>
  );
};

/* ── KPI card sub-component ── */

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center border"
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}20`,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-asvo-text">{value}</div>
        <div className="text-[10px] text-asvo-text-dim uppercase font-semibold tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailView;

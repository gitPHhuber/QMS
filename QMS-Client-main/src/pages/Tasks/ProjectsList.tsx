import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, FolderOpen, Search, AlertTriangle } from "lucide-react";
import {
  fetchProjects,
  createProject,
  deleteProject,
  ProjectModel,
} from "src/api/projectsApi";
import { Modal } from "src/components/Modal/Modal";
import ProgressBar from "src/components/qms/ProgressBar";
import Avatar from "src/components/qms/Avatar";

const AVATAR_COLORS = ["accent", "blue", "purple", "amber", "red", "green", "orange"] as const;

const STATUS_CHIPS: { key: string; label: string; color: string }[] = [
  { key: "NEW",         label: "Новые",       color: "#4A90E8" },
  { key: "IN_PROGRESS", label: "В работе",    color: "#E8A830" },
  { key: "REVIEW",      label: "Проверка",    color: "#A06AE8" },
  { key: "DONE",        label: "Готово",       color: "#2DD4A8" },
  { key: "CLOSED",      label: "Закрыто",     color: "#3A4E62" },
];

interface ProjectsListProps {
  onSelectProject: (project: ProjectModel) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [search, setSearch] = useState("");

  const load = async () => {
    const data = await fetchProjects();
    setProjects(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.title) return alert("Введите название");
    await createProject(form.title, form.description);
    setIsModalOpen(false);
    setForm({ title: "", description: "" });
    load();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Удалить проект?")) {
      await deleteProject(id);
      load();
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск проектов..."
            className="w-full pl-8 pr-3 py-1.5 bg-transparent border border-asvo-border rounded-lg text-xs text-asvo-text placeholder:text-asvo-text-dim focus:bg-asvo-surface focus:border-asvo-border-lt focus:outline-none transition-all"
          />
        </div>
        <span className="text-xs text-asvo-text-dim">
          Всего: <b className="text-asvo-text">{projects.length}</b>
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-br from-asvo-accent to-asvo-accent/80 text-asvo-bg font-bold rounded-lg text-xs transition-all shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)] ml-auto"
        >
          <Plus size={14} /> Новый проект
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const stats = p.taskStats;
          const members = p.members || [];
          const progress = stats?.progressPercent ?? 0;
          const byStatus = stats?.byStatus ?? { NEW: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CLOSED: 0 };
          const overdue = stats?.overdue ?? 0;
          const total = stats?.total ?? 0;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="bg-asvo-surface border border-asvo-border rounded-2xl p-5 hover:border-asvo-border-lt hover:bg-asvo-surface-2 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-asvo-accent/10 text-asvo-accent rounded-xl border border-asvo-accent/15">
                  <FolderOpen size={22} />
                </div>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="text-asvo-text-dim hover:text-[#F06060] transition opacity-0 group-hover:opacity-100 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Title & description */}
              <h3 className="text-base font-bold text-asvo-text mb-1 line-clamp-1">
                {p.title}
              </h3>
              <p className="text-sm text-asvo-text-dim mb-4 line-clamp-2 h-10 leading-relaxed">
                {p.description || "Нет описания"}
              </p>

              {/* Progress bar */}
              {total > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-asvo-text-dim font-semibold uppercase tracking-wide">Прогресс</span>
                    <span className="text-[10px] text-asvo-text-mid font-mono">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} color={progress >= 100 ? "accent" : "blue"} />
                </div>
              )}

              {/* Status chips */}
              {total > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {STATUS_CHIPS.map(sc => {
                    const count = byStatus[sc.key as keyof typeof byStatus] ?? 0;
                    if (count === 0) return null;
                    return (
                      <span
                        key={sc.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        style={{
                          borderColor: `${sc.color}30`,
                          backgroundColor: `${sc.color}10`,
                          color: sc.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: sc.color }}
                        />
                        {count}
                      </span>
                    );
                  })}
                  {overdue > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#F06060]/30 bg-[#F06060]/10 text-[#F06060]">
                      <AlertTriangle size={9} />
                      {overdue}
                    </span>
                  )}
                </div>
              )}

              {/* Footer: members + meta */}
              <div className="flex items-center justify-between border-t border-asvo-border pt-3">
                <div className="flex items-center -space-x-1.5">
                  {members.slice(0, 4).map((m, i) => (
                    <Avatar
                      key={m.id}
                      name={`${m.name} ${m.surname}`}
                      size="sm"
                      color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                    />
                  ))}
                  {members.length > 4 && (
                    <span className="ml-1.5 text-[10px] text-asvo-text-dim font-semibold">
                      +{members.length - 4}
                    </span>
                  )}
                  {members.length === 0 && (
                    <span className="text-[10px] text-asvo-text-dim">Нет участников</span>
                  )}
                </div>
                <span className="text-[11px] text-asvo-text-dim">
                  {new Date(p.createdAt).toLocaleDateString("ru")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && projects.length > 0 && (
        <div className="text-center py-12 text-asvo-text-dim text-sm">
          Проекты не найдены по запросу &laquo;{search}&raquo;
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-asvo-surface rounded-2xl">
          <h2 className="text-lg font-bold text-asvo-text mb-5">
            Создать проект
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-asvo-text-dim uppercase font-bold tracking-wider mb-1.5">
                Название
              </label>
              <input
                className="w-full px-3 py-2.5 bg-asvo-bg border border-asvo-border rounded-xl text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none focus:ring-1 focus:ring-asvo-accent/20 transition"
                placeholder="Напр. Дрон-разведчик"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-asvo-text-dim uppercase font-bold tracking-wider mb-1.5">
                Описание
              </label>
              <textarea
                className="w-full px-3 py-2.5 bg-asvo-bg border border-asvo-border rounded-xl text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none focus:ring-1 focus:ring-asvo-accent/20 transition resize-none"
                placeholder="Что входит в проект..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <button
              onClick={handleCreate}
              className="w-full mt-2 py-3 bg-gradient-to-r from-asvo-accent to-asvo-accent/80 hover:from-asvo-accent hover:to-asvo-accent text-asvo-bg font-bold rounded-xl transition-all text-sm shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)]"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectsList;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Layers, Trash2, AlertTriangle } from "lucide-react";
import { EpicModel, fetchEpics, createEpic, deleteEpic } from "src/api/epicsApi";
import ProgressBar from "src/components/qms/ProgressBar";
import { Modal } from "src/components/Modal/Modal";

const EPIC_COLORS = [
  "#A06AE8", "#2DD4A8", "#E8A830", "#4A9EF5", "#F06060",
  "#E84A8A", "#6AE8C0", "#E8D44A", "#8A6AE8", "#4AE8E8",
];

interface EpicsListProps {
  onSelectEpic: (epic: EpicModel) => void;
}

const EpicsList: React.FC<EpicsListProps> = ({ onSelectEpic }) => {
  const [epics, setEpics] = useState<EpicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", color: EPIC_COLORS[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEpics();
      setEpics(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await createEpic({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
      });
      setShowModal(false);
      setForm({ title: "", description: "", color: EPIC_COLORS[0] });
      load();
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Удалить эпик?")) return;
    try {
      await deleteEpic(id);
      setEpics(prev => prev.filter(ep => ep.id !== id));
    } catch {}
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return epics;
    const q = search.toLowerCase();
    return epics.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  }, [epics, search]);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-asvo-text-dim">
          Эпиков: <b className="text-asvo-text">{epics.length}</b>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-1.5 bg-transparent border border-asvo-border rounded-lg text-xs text-asvo-text placeholder:text-asvo-text-dim focus:bg-asvo-surface focus:border-asvo-border-lt focus:outline-none w-[180px]"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-br from-asvo-accent to-asvo-accent/80 text-asvo-bg font-bold rounded-lg text-xs transition-all shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)]"
          >
            <Plus size={14} /> Эпик
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(epic => {
            const progress = epic.stats && epic.stats.totalTasks > 0
              ? Math.round((epic.stats.completedTasks / epic.stats.totalTasks) * 100)
              : 0;

            return (
              <div
                key={epic.id}
                onClick={() => onSelectEpic(epic)}
                className="bg-asvo-card border border-asvo-border rounded-xl p-4 cursor-pointer hover:border-asvo-border-lt hover:shadow-lg transition group"
              >
                {/* Color accent bar */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${epic.color}20` }}
                    >
                      <Layers size={16} style={{ color: epic.color }} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-asvo-text">{epic.title}</h3>
                      <span className="text-[10px] text-asvo-text-dim uppercase font-semibold">{epic.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, epic.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-asvo-text-dim hover:text-red-400 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {epic.description && (
                  <p className="text-[12px] text-asvo-text-mid mb-3 line-clamp-2">{epic.description}</p>
                )}

                {/* Progress */}
                <ProgressBar value={progress} color="accent" />
                <div className="flex items-center gap-3 mt-2 text-[11px] text-asvo-text-dim">
                  <span>Задач: <b className="text-asvo-text">{epic.stats?.totalTasks || 0}</b></span>
                  <span>Готово: <b className="text-[#2DD4A8]">{epic.stats?.completedTasks || 0}</b></span>
                  {(epic.stats?.overdueTasks || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[#F06060]">
                      <AlertTriangle size={10} /> {epic.stats!.overdueTasks}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-[13px] text-asvo-text-dim py-10">
          {search ? "Ничего не найдено" : "Эпики не созданы"}
        </p>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-1">
          <h2 className="text-lg font-bold text-asvo-text mb-5">Создать эпик</h2>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Название эпика"
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
            />
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Описание (опционально)"
              rows={3}
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none resize-none"
            />
            <div>
              <label className="block text-[11px] text-asvo-text-dim mb-1.5">Цвет</label>
              <div className="flex gap-2 flex-wrap">
                {EPIC_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-lg transition ${form.color === c ? "ring-2 ring-offset-2 ring-offset-asvo-card" : ""}`}
                    style={{ backgroundColor: c, ringColor: c }}
                  />
                ))}
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

export default EpicsList;

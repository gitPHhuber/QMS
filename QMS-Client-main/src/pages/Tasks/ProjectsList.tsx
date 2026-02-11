import React, { useEffect, useState } from "react";
import { Plus, Trash2, FolderOpen } from "lucide-react";
import {
  fetchProjects,
  createProject,
  deleteProject,
  ProjectModel,
} from "src/api/projectsApi";
import { Modal } from "src/components/Modal/Modal";

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

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

  const handleDelete = async (id: number) => {
    if (window.confirm("Удалить проект?")) {
      await deleteProject(id);
      load();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus size={18} /> Новый проект
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 relative group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
                <FolderOpen size={22} />
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">
              {p.title}
            </h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10 leading-relaxed">
              {p.description || "Нет описания"}
            </p>

            <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-700/40 pt-3">
              <span>Создал: {p.author?.surname || "Admin"}</span>
              <span>{new Date(p.createdAt).toLocaleDateString("ru")}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-slate-800 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100 mb-5">
            Создать проект
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                Название
              </label>
              <input
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition"
                placeholder="Напр. Дрон-разведчик"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                Описание
              </label>
              <textarea
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition resize-none"
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
              className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-teal-500/20"
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

import React, { useState } from "react";
import {
  ClipboardList,
  Layout,
  Briefcase,
} from "lucide-react";
import TasksList from "./TasksList";
import ProjectsList from "./ProjectsList";

const TasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TASKS" | "PROJECTS">("TASKS");

  return (
    <div className="p-6 pb-20 space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-teal-500/20 to-cyan-600/10 rounded-xl border border-teal-500/20 shadow-lg shadow-teal-500/5">
          <ClipboardList className="text-teal-400" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Планирование проектов и задач
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Управление задачами и отслеживание прогресса по всем направлениям
            качества
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50 ml-auto">
          <button
            onClick={() => setActiveTab("TASKS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "TASKS"
                ? "bg-teal-500/15 text-teal-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Layout size={15} />
            Канбан-доска
          </button>
          <button
            onClick={() => setActiveTab("PROJECTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "PROJECTS"
                ? "bg-teal-500/15 text-teal-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Briefcase size={15} />
            Проекты
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {activeTab === "TASKS" && <TasksList />}
      {activeTab === "PROJECTS" && <ProjectsList />}
    </div>
  );
};

export default TasksPage;

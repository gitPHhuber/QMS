import React, { useState } from "react";
import { Layout, Briefcase } from "lucide-react";
import TasksList from "./TasksList";
import ProjectsList from "./ProjectsList";

const TasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TASKS" | "PROJECTS">("TASKS");

  return (
    <div className="p-6 pb-20 space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            {activeTab === "TASKS"
              ? <Layout className="text-teal-400" size={24} />
              : <Briefcase className="text-teal-400" size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Управление производством</h1>
            <p className="text-slate-400 text-sm">Планирование проектов и задач</p>
          </div>
        </div>

        <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("TASKS")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "TASKS"
                ? "bg-teal-900/40 text-teal-400 border border-teal-700/50"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            Канбан-доска
          </button>
          <button
            onClick={() => setActiveTab("PROJECTS")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "PROJECTS"
                ? "bg-teal-900/40 text-teal-400 border border-teal-700/50"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            Проекты
          </button>
        </div>
      </div>

      <div>
        {activeTab === "TASKS" && <TasksList />}
        {activeTab === "PROJECTS" && <ProjectsList />}
      </div>
    </div>
  );
};

export default TasksPage;

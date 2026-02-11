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
    <div className="bg-asvo-bg min-h-screen animate-fade-in">
      {/* ── Header ── */}
      <div className="bg-asvo-bg border-b border-asvo-border px-7 pt-5 pb-3.5">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-asvo-accent/15 to-asvo-accent/5 border border-asvo-accent/20 flex items-center justify-center shadow-lg shadow-asvo-accent/5">
            <ClipboardList className="text-asvo-accent" size={20} />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-lg font-bold text-asvo-text tracking-tight">
              Планирование проектов и задач
            </h1>
            <p className="text-xs text-asvo-text-dim">
              Управление задачами и отслеживание прогресса
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-asvo-surface border border-asvo-border rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setActiveTab("TASKS")}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all ${
                activeTab === "TASKS"
                  ? "bg-asvo-accent text-asvo-bg"
                  : "text-asvo-text-mid hover:text-asvo-text"
              }`}
            >
              <Layout size={14} />
              Канбан
            </button>
            <button
              onClick={() => setActiveTab("PROJECTS")}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all ${
                activeTab === "PROJECTS"
                  ? "bg-asvo-accent text-asvo-bg"
                  : "text-asvo-text-mid hover:text-asvo-text"
              }`}
            >
              <Briefcase size={14} />
              Проекты
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-7 py-4">
        {activeTab === "TASKS" && <TasksList />}
        {activeTab === "PROJECTS" && <ProjectsList />}
      </div>
    </div>
  );
};

export default TasksPage;

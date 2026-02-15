import React, { useState } from "react";
import {
  ClipboardList,
  Layout,
  Briefcase,
  Layers,
} from "lucide-react";
import TasksList from "./TasksList";
import ProjectsList from "./ProjectsList";
import ProjectDetailView from "./ProjectDetailView";
import EpicsList from "./EpicsList";
import EpicDetailView from "./EpicDetailView";
import { ProjectModel } from "src/api/projectsApi";
import { EpicModel } from "src/api/epicsApi";

type ActiveView = "TASKS" | "PROJECTS" | "PROJECT_DETAIL" | "EPICS" | "EPIC_DETAIL";

const TasksPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>("TASKS");
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<EpicModel | null>(null);

  const handleSelectProject = (project: ProjectModel) => {
    setSelectedProject(project);
    setActiveView("PROJECT_DETAIL");
  };

  const handleBackFromProject = () => {
    setActiveView("PROJECTS");
    setSelectedProject(null);
  };

  const handleSelectEpic = (epic: EpicModel) => {
    setSelectedEpic(epic);
    setActiveView("EPIC_DETAIL");
  };

  const handleBackFromEpic = () => {
    setActiveView("EPICS");
    setSelectedEpic(null);
  };

  const isDetailView = activeView === "PROJECT_DETAIL" || activeView === "EPIC_DETAIL";

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

          {/* Tab switcher — hidden when viewing detail */}
          {!isDetailView && (
            <div className="flex bg-asvo-surface border border-asvo-border rounded-lg overflow-hidden ml-auto">
              <button
                onClick={() => setActiveView("TASKS")}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all ${
                  activeView === "TASKS"
                    ? "bg-asvo-accent text-asvo-bg"
                    : "text-asvo-text-mid hover:text-asvo-text"
                }`}
              >
                <Layout size={14} />
                Канбан
              </button>
              <button
                onClick={() => setActiveView("PROJECTS")}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all ${
                  activeView === "PROJECTS"
                    ? "bg-asvo-accent text-asvo-bg"
                    : "text-asvo-text-mid hover:text-asvo-text"
                }`}
              >
                <Briefcase size={14} />
                Проекты
              </button>
              <button
                onClick={() => setActiveView("EPICS")}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all ${
                  activeView === "EPICS"
                    ? "bg-asvo-accent text-asvo-bg"
                    : "text-asvo-text-mid hover:text-asvo-text"
                }`}
              >
                <Layers size={14} />
                Эпики
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-7 py-4">
        {activeView === "TASKS" && <TasksList />}
        {activeView === "PROJECTS" && (
          <ProjectsList onSelectProject={handleSelectProject} />
        )}
        {activeView === "PROJECT_DETAIL" && selectedProject && (
          <ProjectDetailView
            projectId={selectedProject.id}
            onBack={handleBackFromProject}
          />
        )}
        {activeView === "EPICS" && (
          <EpicsList onSelectEpic={handleSelectEpic} />
        )}
        {activeView === "EPIC_DETAIL" && selectedEpic && (
          <EpicDetailView
            epicId={selectedEpic.id}
            onBack={handleBackFromEpic}
          />
        )}
      </div>
    </div>
  );
};

export default TasksPage;

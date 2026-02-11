import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  ChevronDown,
  Layout,
  Briefcase,
} from "lucide-react";
import TasksList from "./TasksList";
import ProjectsList from "./ProjectsList";
import { fetchUsers } from "src/api/userApi";
import { userGetModel } from "src/types/UserModel";

const FILTER_CHIPS = [
  { key: "ALL", label: "Все" },
  { key: "PRODUCT", label: "Изделие" },
  { key: "COMPONENT", label: "Компонент" },
];

const TasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TASKS" | "PROJECTS">("TASKS");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<userGetModel[]>([]);

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

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
      </div>

      {/* ── Search + Assignee + Tab switcher ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Поиск задач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition"
          />
        </div>

        {/* Assignee dropdown */}
        <div className="relative">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-400 focus:outline-none focus:border-teal-500/50 transition cursor-pointer min-w-[160px]"
          >
            <option value="">Исполнитель</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.surname} {u.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            size={14}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50 lg:ml-auto">
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

      {/* ── Filter chips ── */}
      {activeTab === "TASKS" && (
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeFilter === chip.key
                  ? "bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm shadow-teal-500/10"
                  : "bg-slate-800/40 text-slate-500 border border-slate-700/40 hover:border-slate-600 hover:text-slate-400"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {activeTab === "TASKS" && (
        <TasksList
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          selectedUserId={selectedUserId}
        />
      )}
      {activeTab === "PROJECTS" && <ProjectsList />}
    </div>
  );
};

export default TasksPage;

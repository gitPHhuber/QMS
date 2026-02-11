import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  RefreshCw,
  Target,
  Factory,
  ClipboardList,
  GraduationCap,
  Wrench,
  Users,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Дашборд",         to: "/qms",             icon: LayoutDashboard },
  { label: "Документы",       to: "/qms/documents",   icon: FileText },
  { label: "Несоответствия",  to: "/qms/nonconformity", icon: AlertTriangle },
  { label: "CAPA",            to: "/qms/capa",        icon: RefreshCw },
  { label: "Риски",           to: "/qms/risks",       icon: Target },
  { label: "Поставщики",      to: "/qms/suppliers",   icon: Factory },
  { label: "Аудиты",          to: "/qms/audits",      icon: ClipboardList },
  { label: "Обучение",        to: "/qms/training",    icon: GraduationCap },
  { label: "Оборудование",    to: "/qms/equipment",   icon: Wrench },
  { label: "Анализ руководства", to: "/qms/review",   icon: Users },
];

const QmsLayout: React.FC = () => (
  <div className="flex h-[calc(100vh-56px)] bg-asvo-bg">
    {/* Sidebar */}
    <aside className="w-[220px] shrink-0 bg-[#0C161F] border-r border-asvo-border overflow-y-auto">
      <div className="py-3">
        {SIDEBAR_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/qms"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all border-l-[3px] ${
                isActive
                  ? "bg-asvo-accent-dim text-asvo-accent font-semibold border-asvo-accent"
                  : "text-asvo-text-dim border-transparent hover:text-asvo-text-mid hover:bg-asvo-surface/50"
              }`
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

export default QmsLayout;

import React, { useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "src/main";
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
  MessageSquareWarning,
  GitBranch,
  FlaskConical,
  Package,
  ShieldCheck,
  Compass,
  PenTool,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Дашборд",         to: "/qms",                icon: LayoutDashboard, moduleCode: "qms.dashboard" },
  { label: "Документы",       to: "/qms/documents",      icon: FileText,        moduleCode: "qms.dms" },
  { label: "Несоответствия",  to: "/qms/nonconformity",  icon: AlertTriangle,   moduleCode: "qms.nc" },
  { label: "CAPA",            to: "/qms/capa",           icon: RefreshCw,       moduleCode: "qms.capa" },
  { label: "Риски",           to: "/qms/risks",          icon: Target,          moduleCode: "qms.risk" },
  { label: "Файл риск-менеджмента", to: "/qms/risk-management", icon: ShieldCheck, moduleCode: "qms.risk" },
  { label: "Поставщики",      to: "/qms/suppliers",      icon: Factory,         moduleCode: "qms.supplier" },
  { label: "Аудиты",          to: "/qms/audits",         icon: ClipboardList,   moduleCode: "qms.audit" },
  { label: "Обучение",        to: "/qms/training",       icon: GraduationCap,   moduleCode: "qms.training" },
  { label: "Оборудование",    to: "/qms/equipment",      icon: Wrench,          moduleCode: "qms.equipment" },
  { label: "Анализ руководства", to: "/qms/review",      icon: Users,           moduleCode: "qms.review" },
  { label: "Рекламации",      to: "/qms/complaints",     icon: MessageSquareWarning, moduleCode: "qms.complaints" },
  { label: "Управление изм.", to: "/qms/change-control",  icon: GitBranch,      moduleCode: "qms.changes" },
  { label: "Валидация",       to: "/qms/validation",     icon: FlaskConical,    moduleCode: "qms.validation" },
  { label: "Реестр изделий",  to: "/qms/products",       icon: Package,         moduleCode: "qms.product" },
  { label: "Design Control", to: "/qms/design-control", icon: Compass,         moduleCode: "qms.design" },
  { label: "Эл. подписи",   to: "/qms/esign",          icon: PenTool,         moduleCode: "core.esign" },
];

const QmsLayout: React.FC = observer(() => {
  const context = useContext(Context);
  if (!context) throw new Error("Context is required");
  const { modules } = context;

  const visibleItems = SIDEBAR_ITEMS.filter(
    item => modules.isEnabled(item.moduleCode)
  );

  return (
    <div className="flex h-[calc(100vh-56px)] bg-asvo-bg">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#0C161F] border-r border-asvo-border overflow-y-auto">
        <div className="py-3">
          {visibleItems.map((item) => (
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
});

export default QmsLayout;

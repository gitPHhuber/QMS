import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  FileText,
  Wrench,
  XCircle,
  MessageSquareWarning,
  GraduationCap,
  GitBranch,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NotificationType =
  | "CAPA_OVERDUE" | "CAPA_ASSIGNED" | "DOCUMENT_PENDING"
  | "CALIBRATION_DUE" | "AUDIT_UPCOMING" | "NC_CREATED"
  | "COMPLAINT_RECEIVED" | "TRAINING_EXPIRED"
  | "CHANGE_REQUEST_PENDING" | "REVALIDATION_DUE"
  | "REVIEW_SCHEDULED" | "GENERAL";

type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link?: string;
  isRead: boolean;
  createdAt: string; // relative time label
}

/* ------------------------------------------------------------------ */
/*  Icon & color config by type                                        */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  CAPA_OVERDUE:           { icon: AlertTriangle,       color: "#F06060" },
  CAPA_ASSIGNED:          { icon: CheckCircle2,        color: "#4A90E8" },
  DOCUMENT_PENDING:       { icon: FileText,            color: "#E8A830" },
  CALIBRATION_DUE:        { icon: Wrench,              color: "#E8A830" },
  AUDIT_UPCOMING:         { icon: ClipboardCheck,      color: "#4A90E8" },
  NC_CREATED:             { icon: XCircle,             color: "#F06060" },
  COMPLAINT_RECEIVED:     { icon: MessageSquareWarning, color: "#F06060" },
  TRAINING_EXPIRED:       { icon: GraduationCap,       color: "#E8A830" },
  CHANGE_REQUEST_PENDING: { icon: GitBranch,           color: "#4A90E8" },
  REVALIDATION_DUE:       { icon: Wrench,              color: "#E8A830" },
  REVIEW_SCHEDULED:       { icon: ClipboardCheck,      color: "#4A90E8" },
  GENERAL:                { icon: Bell,                color: "#2DD4A8" },
};

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  CRITICAL: "bg-[#F06060]",
  WARNING:  "bg-[#E8A830]",
  INFO:     "bg-[#4A90E8]",
};

/* ------------------------------------------------------------------ */
/*  Mock notifications                                                 */
/* ------------------------------------------------------------------ */

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, type: "CAPA_OVERDUE",           severity: "CRITICAL", title: "CAPA-019 просрочена на 3 дня",                     message: "Требуется немедленное внимание",                          link: "/qms/capa",           isRead: false, createdAt: "10 мин назад" },
  { id: 2, type: "DOCUMENT_PENDING",       severity: "WARNING",  title: "2 документа ожидают согласования",                 message: "СТО-045 и ИИ-012 требуют вашего решения",                link: "/qms/documents",      isRead: false, createdAt: "1 час назад" },
  { id: 3, type: "CALIBRATION_DUE",        severity: "WARNING",  title: "Калибровка EQ-003 через 5 дней",                  message: "Осциллограф Rigol DS1104 — срок 17.02.2026",              link: "/qms/equipment",      isRead: false, createdAt: "2 часа назад" },
  { id: 4, type: "NC_CREATED",             severity: "INFO",     title: "Назначен ответственным за NC-051",                 message: "Сбой ПО при калибровке DensiBot v2",                      link: "/qms/nonconformity",  isRead: false, createdAt: "3 часа назад" },
  { id: 5, type: "COMPLAINT_RECEIVED",     severity: "CRITICAL", title: "Получена рекламация CMP-2026-005",                message: "AXR-100: некорректные показания после 6 мес",             link: "/qms/complaints",     isRead: false, createdAt: "вчера" },
  { id: 6, type: "TRAINING_EXPIRED",       severity: "WARNING",  title: "Обучение IPC-A-610 истекло",                      message: "Омельченко А.Г. — требуется переаттестация",              link: "/qms/training",       isRead: true,  createdAt: "вчера" },
  { id: 7, type: "CHANGE_REQUEST_PENDING", severity: "INFO",     title: "ECR-2026-004 ожидает одобрения",                  message: "Обновление алгоритма BMD v2.1",                           link: "/qms/change-control", isRead: true,  createdAt: "2 дня назад" },
  { id: 8, type: "AUDIT_UPCOMING",         severity: "INFO",     title: "Аудит AUD-013 запланирован на 20.02",             message: "Внутренний аудит процесса 8.2 Мониторинг",               link: "/qms/audits",         isRead: true,  createdAt: "3 дня назад" },
];

/* ================================================================== */
/*  NotificationBell Component                                         */
/* ================================================================== */

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-asvo-dark-2 transition-colors"
      >
        <Bell size={18} className="text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#F06060] text-white text-[10px] font-bold leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[400px] max-h-[520px] bg-[#1e293b] border border-teal-500/20 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/30">
            <h3 className="text-sm font-bold text-white">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[440px]">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;

              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-700/30 ${
                    !n.isRead
                      ? "bg-slate-800/60 hover:bg-slate-700/50"
                      : "hover:bg-slate-800/30"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                    style={{ background: `${cfg.color}1A` }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[n.severity]}`} />
                      )}
                      <span className={`text-[12px] font-semibold truncate ${!n.isRead ? "text-white" : "text-slate-300"}`}>
                        {n.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{n.createdAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

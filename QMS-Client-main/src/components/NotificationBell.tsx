import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/qmsApi";
import { parseRetryAfter } from "../api/rateLimitUtils";

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
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Icon & color config by type                                        */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
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

/* ================================================================== */
/*  NotificationBell Component                                         */
/* ================================================================== */

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Adaptive notification polling
  //  - 30 s when tab is visible (base)
  //  - 120 s when tab is hidden
  //  - 180 s after 5 consecutive polls with no change
  //  - Retry-After value (capped at 300 s) after a 429 response
  useEffect(() => {
    const BASE_MS      = 30_000;
    const HIDDEN_MS    = 120_000;
    const IDLE_MS      = 180_000;
    const RATE_LIMIT_MS = 300_000;
    const IDLE_THRESHOLD = 5;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentInterval = BASE_MS;
    let consecutiveNoChange = 0;
    let prevCount = 0;
    let cancelled = false;

    const getInterval = () => {
      let base: number;
      if (document.hidden) base = HIDDEN_MS;
      else if (consecutiveNoChange >= IDLE_THRESHOLD) base = IDLE_MS;
      else base = BASE_MS;
      // Never poll sooner than a server-requested rate-limit delay
      return Math.max(base, currentInterval);
    };

    const poll = async () => {
      if (cancelled) return;

      try {
        const data = await notificationsApi.getCount();
        if (cancelled) return;

        const newCount = data.count ?? 0;
        if (newCount === prevCount) {
          consecutiveNoChange += 1;
        } else {
          consecutiveNoChange = 0;
        }
        prevCount = newCount;
        setUnreadCount(newCount);
        currentInterval = BASE_MS;
      } catch (error: any) {
        if (cancelled) return;

        if (error?.response?.status === 429) {
          const seconds = parseRetryAfter(
            error.response.headers?.['retry-after'] as string | undefined,
            error.response.data,
            RATE_LIMIT_MS / 1000,
          );
          currentInterval = Math.min(seconds * 1000, RATE_LIMIT_MS);
        }
      }

      if (!cancelled) {
        timeoutId = setTimeout(poll, getInterval());
      }
    };

    // Immediate first fetch
    poll();

    // When tab becomes visible again, reset and poll immediately
    const handleVisibility = () => {
      if (!document.hidden && !cancelled) {
        consecutiveNoChange = 0;
        // Only reset and poll immediately when not rate-limited
        if (currentInterval <= BASE_MS) {
          if (timeoutId) clearTimeout(timeoutId);
          poll();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Fetch full list when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getAll({ limit: 20 });
      const rows: NotificationItem[] = (data.rows ?? data ?? []).map((n: any) => ({
        id: n.id,
        type: n.type || "GENERAL",
        title: n.title || "",
        message: n.message || "",
        severity: n.severity || "INFO",
        link: n.link,
        isRead: n.isRead ?? false,
        createdAt: n.createdAt
          ? new Date(n.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
          : "",
      }));
      setNotifications(rows);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

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

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // fallback local
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    await markRead(n.id);
    if (n.link) {
      navigate(n.link);
      setIsOpen(false);
    }
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                Нет уведомлений
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
                const Icon = cfg.icon;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
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
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[n.severity] || SEVERITY_DOT.INFO}`} />
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

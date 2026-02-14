import React, { useEffect, useState, useCallback } from "react";
import { fetchAuditLogs, AuditLogResponse } from "src/api/auditApi";
import { AuditLogModel } from "src/types/AuditLogModel";
import { Search, ChevronLeft, ChevronRight, ShieldAlert, ShieldPlus, ShieldMinus, Clock } from "lucide-react";

/**
 * RBAC actions to filter from audit log
 */
const RBAC_ACTIONS = [
  "ROLE_CREATE",
  "ROLE_UPDATE",
  "ROLE_DELETE",
  "ROLE_ABILITY_GRANT",
  "ROLE_ABILITY_REVOKE",
  "USER_ROLE_CHANGE",
];

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ROLE_CREATE:        { label: "Роль создана",        color: "text-green-700 bg-green-50 border-green-200",  icon: <ShieldPlus size={14} /> },
  ROLE_UPDATE:        { label: "Роль обновлена",      color: "text-blue-700 bg-blue-50 border-blue-200",    icon: <ShieldAlert size={14} /> },
  ROLE_DELETE:        { label: "Роль удалена",         color: "text-red-700 bg-red-50 border-red-200",      icon: <ShieldMinus size={14} /> },
  ROLE_ABILITY_GRANT: { label: "Права выданы",        color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <ShieldPlus size={14} /> },
  ROLE_ABILITY_REVOKE:{ label: "Права отозваны",      color: "text-orange-700 bg-orange-50 border-orange-200",   icon: <ShieldMinus size={14} /> },
  USER_ROLE_CHANGE:   { label: "Роль пользователя",   color: "text-purple-700 bg-purple-50 border-purple-200",  icon: <ShieldAlert size={14} /> },
};

interface AuditViewProps {
  // no props needed — self-contained component
}

export const AuditView: React.FC<AuditViewProps> = () => {
  const [logs, setLogs] = useState<AuditLogModel[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const LIMIT = 25;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      // We filter by action on the client side from the combined RBAC actions
      const params: Record<string, any> = {
        page,
        limit: LIMIT,
        severity: "SECURITY",
      };

      if (actionFilter) {
        params.action = actionFilter;
      }
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const data: AuditLogResponse = await fetchAuditLogs(params);

      // Filter to only RBAC-related actions on client side
      const rbacLogs = actionFilter
        ? data.rows
        : data.rows.filter((log) => RBAC_ACTIONS.includes(log.action));

      setLogs(rbacLogs);
      setCount(data.count);
    } catch (e) {
      console.error("Failed to load RBAC audit logs:", e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(count / LIMIT);

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtUser = (log: AuditLogModel) => {
    if (log.User) {
      return `${log.User.surname} ${log.User.name}`;
    }
    return log.userId ? `ID: ${log.userId}` : "Система";
  };

  const renderMetadata = (log: AuditLogModel) => {
    const meta = log.metadata;
    if (!meta) return null;

    const parts: string[] = [];

    if (meta.roleName) parts.push(`Роль: ${meta.roleName}`);
    if (Array.isArray(meta.granted) && meta.granted.length > 0) {
      parts.push(`Выдано: ${meta.granted.join(", ")}`);
    }
    if (Array.isArray(meta.revoked) && meta.revoked.length > 0) {
      parts.push(`Отозвано: ${meta.revoked.join(", ")}`);
    }
    if (meta.ip) parts.push(`IP: ${meta.ip}`);

    if (parts.length === 0) return null;

    return (
      <div className="mt-1 text-[11px] text-asvo-text-dim leading-relaxed">
        {parts.map((p, i) => (
          <span key={i} className="inline-block mr-3">
            {p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-asvo-card border border-asvo-border rounded-lg px-3 py-2 text-sm text-asvo-text focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Все действия</option>
            {RBAC_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a]?.label || a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-asvo-text-mid">
          <Clock size={14} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-asvo-card border border-asvo-border rounded-lg px-2 py-1.5 text-sm text-asvo-text"
          />
          <span>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-asvo-card border border-asvo-border rounded-lg px-2 py-1.5 text-sm text-asvo-text"
          />
        </div>

        <span className="text-xs text-asvo-text-dim ml-auto">
          Записей: {count}
        </span>
      </div>

      {/* Table */}
      <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="sticky top-0 bg-asvo-surface z-10">
            <tr className="border-b border-asvo-border">
              <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left w-[160px]">Дата</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left w-[160px]">Действие</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left w-[160px]">Пользователь</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Описание</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-[13px] text-asvo-text-dim">
                  Загрузка...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-[13px] text-asvo-text-dim">
                  Нет записей по выбранным фильтрам
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: "text-gray-700 bg-gray-50 border-gray-200",
                  icon: <ShieldAlert size={14} />,
                };

                return (
                  <tr
                    key={log.id}
                    className="border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px]"
                  >
                    <td className="px-3 py-2.5 text-asvo-text-mid whitespace-nowrap">
                      {fmtDate(log.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${actionInfo.color}`}
                      >
                        {actionInfo.icon}
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-asvo-text font-medium">
                      {fmtUser(log)}
                    </td>
                    <td className="px-3 py-2.5 text-asvo-text-mid">
                      <div>{log.description || "—"}</div>
                      {renderMetadata(log)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-asvo-border hover:bg-asvo-surface-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-asvo-text-mid px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-asvo-border hover:bg-asvo-surface-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

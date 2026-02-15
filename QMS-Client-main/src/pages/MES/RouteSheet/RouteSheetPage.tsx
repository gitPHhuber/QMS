/**
 * RouteSheetPage.tsx — Реестр маршрутных карт
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §7.5.1 — Протоколы выполнения операций
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Route,
  Search,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import DataTable from "src/components/qms/DataTable";
import TabBar from "src/components/qms/TabBar";
import { routeSheetApi } from "src/api/qms/routeSheets";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RouteSheetStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED"
  | "ON_HOLD";

interface RouteSheetRow {
  [key: string]: unknown;
  id: number;
  serialNumber: string;
  stepName: string;
  stepOrder: number;
  status: RouteSheetStatus;
  operatorName: string;
  startedAt: string | null;
}

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<RouteSheetStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "Ожидание",        color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  IN_PROGRESS: { label: "В работе",        color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  COMPLETED:   { label: "Выполнено",       color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  FAILED:      { label: "Ошибка",          color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  SKIPPED:     { label: "Пропущено",       color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  ON_HOLD:     { label: "Приостановлено",  color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
};

const STATUS_TABS = [
  { key: "ALL",         label: "Все" },
  { key: "PENDING",     label: "Ожидание" },
  { key: "IN_PROGRESS", label: "В работе" },
  { key: "COMPLETED",   label: "Выполнено" },
  { key: "FAILED",      label: "Ошибка" },
  { key: "ON_HOLD",     label: "Приостановлено" },
];

/* ---- Helpers ---- */

const fmtDate = (iso: string | null): string => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const RouteSheetPage: React.FC = () => {
  const navigate = useNavigate();

  /* ---- state ---- */
  const [rows, setRows] = useState<RouteSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ---- search debounce ---- */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [search]);

  /* ---- fetch ---- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await routeSheetApi.getActive(params);
      const list = (res.rows ?? res.data ?? []).map((r: any) => ({
        id: r.id,
        serialNumber: r.serialNumber ?? r.unit?.serialNumber ?? "\u2014",
        stepName: r.stepName ?? r.name ?? "\u2014",
        stepOrder: r.stepOrder ?? r.stepNumber ?? r.order ?? 0,
        status: r.status ?? "PENDING",
        operatorName: r.operator
          ? `${r.operator.surname ?? ""} ${(r.operator.name ?? "").charAt(0)}.`.trim()
          : r.operatorName ?? "\u2014",
        startedAt: r.startedAt ?? null,
      }));

      setRows(list);
      setTotalPages((res.totalPages ?? Math.ceil((res.count ?? list.length) / 20)) || 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- columns ---- */

  const columns = [
    {
      key: "serialNumber",
      label: "Серийный №",
      width: "150px",
      render: (r: RouteSheetRow) => (
        <span className="font-mono text-asvo-accent font-semibold">{r.serialNumber}</span>
      ),
    },
    {
      key: "stepName",
      label: "Операция",
      render: (r: RouteSheetRow) => <span className="text-asvo-text">{r.stepName}</span>,
    },
    {
      key: "stepOrder",
      label: "Шаг",
      width: "80px",
      align: "center" as const,
      render: (r: RouteSheetRow) => (
        <span className="text-asvo-text-mid font-mono">{r.stepOrder}</span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      width: "160px",
      align: "center" as const,
      render: (r: RouteSheetRow) => {
        const s = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "operatorName",
      label: "Оператор",
      width: "160px",
      render: (r: RouteSheetRow) => <span className="text-asvo-text-mid">{r.operatorName}</span>,
    },
    {
      key: "startedAt",
      label: "Начало",
      width: "150px",
      render: (r: RouteSheetRow) => (
        <span className="text-asvo-text-mid">{fmtDate(r.startedAt)}</span>
      ),
    },
  ];

  /* ---- loading state ---- */

  if (loading && rows.length === 0) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка маршрутных карт...</span>
        </div>
      </div>
    );
  }

  /* ---- error state ---- */

  if (error && rows.length === 0) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error}</span>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-surface text-asvo-accent border border-asvo-border hover:bg-asvo-border transition"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
            <Route size={22} style={{ color: "#4A90E8" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">
              Маршрутные карты
            </h1>
            <p className="text-xs text-asvo-text-dim">
              ISO 13485 &sect;7.5.1 &mdash; Протоколы выполнения операций
            </p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <TabBar
          tabs={STATUS_TABS}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setPage(1);
          }}
        />

        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по серийному номеру..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-asvo-bg/50 z-10 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-asvo-accent" />
          </div>
        )}
        <DataTable
          columns={columns}
          data={rows}
          onRowClick={(row: RouteSheetRow) => navigate(`/qms/route-sheets/${row.serialNumber}`)}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-asvo-border text-asvo-text-mid hover:bg-asvo-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] text-asvo-text-mid">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-asvo-border text-asvo-text-mid hover:bg-asvo-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteSheetPage;

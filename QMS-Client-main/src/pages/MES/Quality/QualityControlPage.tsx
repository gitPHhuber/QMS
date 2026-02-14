/**
 * QualityControlPage.tsx — Контроль качества MES
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.2.4 — Мониторинг и измерение продукции
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Search,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import DataTable from "src/components/qms/DataTable";
import TabBar from "src/components/qms/TabBar";
import { mesQualityApi } from "src/api/qms/mesQuality";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type HoldStatus = "ON_HOLD" | "QC_PENDING" | "QC_PASSED" | "QC_FAILED";

interface HoldRow {
  [key: string]: unknown;
  id: number;
  serialNumber: string;
  workOrderTitle: string;
  holdReason: string;
  status: HoldStatus;
  heldAt: string | null;
}

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<HoldStatus, { label: string; color: string; bg: string }> = {
  ON_HOLD:    { label: "На удержании", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  QC_PENDING: { label: "Ожидает КК",  color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  QC_PASSED:  { label: "КК пройден",  color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  QC_FAILED:  { label: "КК не пройден", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const STATUS_TABS = [
  { key: "ALL", label: "Все" },
  { key: "ON_HOLD", label: "На удержании" },
  { key: "QC_PENDING", label: "Ожидает КК" },
  { key: "QC_PASSED", label: "КК пройден" },
  { key: "QC_FAILED", label: "КК не пройден" },
];

/* ---- Helpers ---- */

const fmtDate = (iso: string | null): string => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const QualityControlPage: React.FC = () => {
  /* ---- state ---- */
  const [rows, setRows] = useState<HoldRow[]>([]);
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

      const res = await mesQualityApi.getHolds(params);
      const list = (res.rows ?? res.data ?? []).map((r: any) => ({
        id: r.id,
        serialNumber: r.serialNumber ?? r.unit?.serialNumber ?? `SN-${r.id}`,
        workOrderTitle: r.workOrderTitle ?? r.workOrder?.title ?? "\u2014",
        holdReason: r.holdReason ?? r.reason ?? "\u2014",
        status: r.status ?? "ON_HOLD",
        heldAt: r.heldAt ?? r.createdAt ?? null,
      }));

      setRows(list);
      setTotalPages(res.totalPages ?? Math.ceil((res.count ?? list.length) / 20) || 1);
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
      width: "140px",
      render: (r: HoldRow) => (
        <span className="font-mono text-asvo-accent font-semibold">{r.serialNumber}</span>
      ),
    },
    {
      key: "workOrderTitle",
      label: "Рабочий заказ",
      render: (r: HoldRow) => <span className="text-asvo-text">{r.workOrderTitle}</span>,
    },
    {
      key: "holdReason",
      label: "Причина удержания",
      render: (r: HoldRow) => <span className="text-asvo-text">{r.holdReason}</span>,
    },
    {
      key: "status",
      label: "Статус",
      width: "150px",
      align: "center" as const,
      render: (r: HoldRow) => {
        const s = STATUS_CFG[r.status] ?? STATUS_CFG.ON_HOLD;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "heldAt",
      label: "Дата удержания",
      width: "150px",
      render: (r: HoldRow) => (
        <span className="text-asvo-text-mid">{fmtDate(r.heldAt)}</span>
      ),
    },
  ];

  /* ---- loading state ---- */

  if (loading && rows.length === 0) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка контроля качества...</span>
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
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
          <Shield size={22} style={{ color: "#4A90E8" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-asvo-text">
            Контроль качества MES
          </h1>
          <p className="text-xs text-asvo-text-dim">
            ISO 13485 &sect;8.2.4 &mdash; Мониторинг и измерение продукции
          </p>
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

export default QualityControlPage;

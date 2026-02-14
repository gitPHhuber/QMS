/**
 * AcceptanceTestPage.tsx — Приёмо-сдаточные испытания (ПСИ)
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §7.5.1.1 — Верификация продукции
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import DataTable from "src/components/qms/DataTable";
import TabBar from "src/components/qms/TabBar";
import { acceptanceTestApi } from "src/api/qms/acceptanceTests";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PsiStatus = "DRAFT" | "SUBMITTED" | "IN_TESTING" | "PASSED" | "FAILED" | "CONDITIONAL";

interface PsiRow {
  [key: string]: unknown;
  id: number;
  testNumber: string;
  serialNumber: string;
  productTitle: string;
  status: PsiStatus;
  testerName: string;
  completedAt: string | null;
}

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<PsiStatus, { label: string; color: string; bg: string }> = {
  DRAFT:       { label: "Черновик",   color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  SUBMITTED:   { label: "Подан",      color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  IN_TESTING:  { label: "Испытания",  color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  PASSED:      { label: "Годен",      color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  FAILED:      { label: "Брак",       color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  CONDITIONAL: { label: "Условно",    color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
};

const STATUS_TABS = [
  { key: "ALL", label: "Все" },
  { key: "DRAFT", label: "Черновик" },
  { key: "SUBMITTED", label: "Подан" },
  { key: "IN_TESTING", label: "Испытания" },
  { key: "PASSED", label: "Годен" },
  { key: "FAILED", label: "Брак" },
  { key: "CONDITIONAL", label: "Условно" },
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

const AcceptanceTestPage: React.FC = () => {
  const navigate = useNavigate();

  /* ---- state ---- */
  const [rows, setRows] = useState<PsiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ productId: "", serialNumber: "", templateId: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

      const res = await acceptanceTestApi.getAll(params);
      const list = (res.rows ?? res.data ?? []).map((r: any) => ({
        id: r.id,
        testNumber: r.testNumber ?? r.number ?? `PSI-${r.id}`,
        serialNumber: r.serialNumber ?? "\u2014",
        productTitle: r.product?.title ?? r.productTitle ?? "\u2014",
        status: r.status ?? "DRAFT",
        testerName: r.tester
          ? `${r.tester.surname ?? ""} ${(r.tester.name ?? "").charAt(0)}.`.trim()
          : r.testerName ?? "\u2014",
        completedAt: r.completedAt ?? null,
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

  /* ---- create ---- */

  const handleCreate = async () => {
    setCreateError(null);
    if (!createForm.productId) {
      setCreateError("Укажите ID изделия");
      return;
    }
    if (!createForm.serialNumber) {
      setCreateError("Укажите серийный номер");
      return;
    }
    setCreating(true);
    try {
      await acceptanceTestApi.create({
        productId: Number(createForm.productId),
        serialNumber: createForm.serialNumber,
        templateId: createForm.templateId ? Number(createForm.templateId) : undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ productId: "", serialNumber: "", templateId: "" });
      fetchData();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || "Ошибка создания");
    } finally {
      setCreating(false);
    }
  };

  /* ---- columns ---- */

  const columns = [
    {
      key: "testNumber",
      label: "Номер испытания",
      width: "160px",
      render: (r: PsiRow) => (
        <span className="font-mono text-asvo-accent font-semibold">{r.testNumber}</span>
      ),
    },
    {
      key: "serialNumber",
      label: "Серийный №",
      width: "140px",
      render: (r: PsiRow) => (
        <span className="text-asvo-text-mid font-mono">{r.serialNumber}</span>
      ),
    },
    {
      key: "productTitle",
      label: "Продукт",
      render: (r: PsiRow) => <span className="text-asvo-text">{r.productTitle}</span>,
    },
    {
      key: "status",
      label: "Статус",
      width: "130px",
      align: "center" as const,
      render: (r: PsiRow) => {
        const s = STATUS_CFG[r.status] ?? STATUS_CFG.DRAFT;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "testerName",
      label: "Испытатель",
      width: "160px",
      render: (r: PsiRow) => <span className="text-asvo-text-mid">{r.testerName}</span>,
    },
    {
      key: "completedAt",
      label: "Дата завершения",
      width: "150px",
      render: (r: PsiRow) => (
        <span className="text-asvo-text-mid">{fmtDate(r.completedAt)}</span>
      ),
    },
  ];

  /* ---- loading state ---- */

  if (loading && rows.length === 0) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка реестра ПСИ...</span>
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
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(167,139,250,0.12)" }}>
            <Award size={22} style={{ color: "#A78BFA" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">
              Приёмо-сдаточные испытания (ПСИ)
            </h1>
            <p className="text-xs text-asvo-text-dim">
              ISO 13485 &sect;7.5.1.1 &mdash; Верификация продукции
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition-all hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)]"
        >
          <Plus size={15} />
          Создать ПСИ
        </button>
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
            placeholder="Поиск по номеру испытания..."
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
          onRowClick={(row: PsiRow) => navigate(`/qms/acceptance-testing/${row.id}`)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-asvo-text">Создать ПСИ</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="text-asvo-text-dim hover:text-asvo-text transition"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="text-sm text-[#F06060] bg-[rgba(240,96,96,0.08)] border border-[#F06060]/20 rounded-lg px-3 py-2">
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                  ID Изделия
                </label>
                <input
                  type="number"
                  value={createForm.productId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, productId: e.target.value }))}
                  placeholder="Введите ID изделия"
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                  Серийный номер
                </label>
                <input
                  type="text"
                  value={createForm.serialNumber}
                  onChange={(e) => setCreateForm((f) => ({ ...f, serialNumber: e.target.value }))}
                  placeholder="Введите серийный номер"
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                  ID Шаблона
                </label>
                <input
                  type="number"
                  value={createForm.templateId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, templateId: e.target.value }))}
                  placeholder="Необязательно"
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 rounded-lg border border-asvo-border text-[13px] text-asvo-text-mid hover:bg-asvo-surface transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition-all hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptanceTestPage;

/**
 * NonconformityPage.tsx — Реестр несоответствий (NC)
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.3 — Управление несоответствующей продукцией
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Plus, Download, ClipboardList, Loader2,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import StatusDot from "src/components/qms/StatusDot";
import ProgressBar from "src/components/qms/ProgressBar";

import {
  ncApi,
  type NcShort,
  type NcCapaStats,
  type NcStatus,
  type NcClassification,
} from "../../api/qmsApi";

import CreateNcModal from "./CreateNcModal";
import NcDetailModal from "./NcDetailModal";

/* ─── Helpers ────────────────────────────────────────────────── */

/** Map backend NcStatus to a StatusDot color */
const statusDotColor = (s: NcStatus): "red" | "blue" | "purple" | "amber" | "accent" | "orange" | "grey" => {
  switch (s) {
    case "OPEN":          return "red";
    case "INVESTIGATING": return "blue";
    case "DISPOSITION":   return "purple";
    case "IMPLEMENTING":  return "orange";
    case "VERIFICATION":  return "amber";
    case "CLOSED":        return "accent";
    case "REOPENED":      return "red";
    default:              return "grey";
  }
};

/** Map backend NcStatus to a human-readable Russian label */
const statusLabel = (s: NcStatus): string => {
  switch (s) {
    case "OPEN":          return "Открыто";
    case "INVESTIGATING": return "Расследование";
    case "DISPOSITION":   return "Диспозиция";
    case "IMPLEMENTING":  return "Коррекция";
    case "VERIFICATION":  return "Верификация";
    case "CLOSED":        return "Закрыто";
    case "REOPENED":      return "Переоткрыто";
    default:              return s;
  }
};

/** Map backend NcClassification to a Russian label */
const classificationLabel = (c: NcClassification): string => {
  switch (c) {
    case "CRITICAL": return "Критическое";
    case "MAJOR":    return "Серьёзное";
    case "MINOR":    return "Незначительное";
    default:         return c;
  }
};

/** Badge colours per classification */
const classificationBadge: Record<NcClassification, { color: string; bg: string }> = {
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  MAJOR:    { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  MINOR:    { color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
};

/** Format ISO date string as DD.MM.YYYY */
const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

/** Format a person object as "Фамилия И." */
const fmtPerson = (p: { name: string; surname: string } | null): string => {
  if (!p) return "—";
  return `${p.surname} ${p.name.charAt(0)}.`;
};

/** Helper: sum all counts from a stats array */
const sumCounts = (arr: Array<{ count: string }> | undefined): number =>
  (arr || []).reduce((acc, item) => acc + Number(item.count), 0);

/** Helper: get count for a specific key in stats array */
const countFor = (arr: Array<{ status?: string; count: string }> | undefined, key: string): number => {
  const found = (arr || []).find((item) => item.status === key);
  return found ? Number(found.count) : 0;
};

/* ─── Static data ────────────────────────────────────────────── */

const workflowSteps = [
  { label: "Регистрация", key: "OPEN" },
  { label: "Расследование", key: "INVESTIGATING" },
  { label: "Диспозиция", key: "DISPOSITION" },
  { label: "Коррекция", key: "IMPLEMENTING" },
  { label: "Верификация", key: "VERIFICATION" },
  { label: "Закрытие", key: "CLOSED" },
];

/* ─── Component ──────────────────────────────────────────────── */

export const NonconformityPage: React.FC = () => {
  const [data, setData] = useState<NcShort[]>([]);
  const [stats, setStats] = useState<NcCapaStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailNcId, setDetailNcId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, statsResult] = await Promise.all([
        ncApi.getAll({}),
        ncApi.getStats(),
      ]);
      setData(listResult.rows ?? []);
      setStats(statsResult);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── KPI values derived from stats ─────────────────────────── */
  const totalNc = stats ? sumCounts(stats.ncByStatus) : 0;
  const openNc = stats
    ? countFor(stats.ncByStatus, "OPEN") +
      countFor(stats.ncByStatus, "INVESTIGATING") +
      countFor(stats.ncByStatus, "DISPOSITION") +
      countFor(stats.ncByStatus, "IMPLEMENTING") +
      countFor(stats.ncByStatus, "VERIFICATION") +
      countFor(stats.ncByStatus, "REOPENED")
    : 0;
  const overdueNc = stats?.overdueNc ?? 0;
  const closedNc = stats ? countFor(stats.ncByStatus, "CLOSED") : 0;

  /* ── Pareto items from ncBySource ──────────────────────────── */
  const paretoColors: Array<"red" | "amber" | "blue" | "purple" | "accent"> = [
    "red", "amber", "blue", "purple", "accent",
  ];
  const totalBySource = stats ? sumCounts(stats.ncBySource) : 0;
  const paretoItems = stats
    ? stats.ncBySource
        .map((item, idx) => ({
          label: item.source,
          pct: totalBySource > 0 ? Math.round((Number(item.count) / totalBySource) * 100) : 0,
          color: paretoColors[idx % paretoColors.length],
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5)
    : [];

  /* ── Handle "Register NC" button ───────────────────────────── */
  const handleRegisterNc = () => setShowCreateModal(true);

  /* ── Render ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-asvo-accent animate-spin" />
          <span className="text-sm text-asvo-text-dim">Загрузка данных...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="bg-asvo-surface-2 border border-asvo-red/30 rounded-xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-asvo-red mx-auto" />
          <h2 className="text-lg font-semibold text-asvo-text">Ошибка загрузки</h2>
          <p className="text-sm text-asvo-text-dim">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-asvo-accent text-asvo-bg rounded-lg text-sm font-semibold hover:brightness-110 transition"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-red-dim rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-asvo-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Несоответствия</h1>
            <p className="text-sm text-asvo-text-dim">ISO 13485 §8.3 — Управление несоответствующей продукцией</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegisterNc}
            className="flex items-center gap-2 px-4 py-2 bg-asvo-accent text-asvo-bg rounded-lg text-sm font-semibold hover:brightness-110 transition"
          >
            <Plus size={16} />
            Регистрировать NC
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-asvo-border text-asvo-text-mid rounded-lg text-sm font-medium hover:border-asvo-text-dim transition">
            <Download size={16} />
            Экспорт
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего NC", value: totalNc, cls: "text-asvo-blue" },
          { label: "Открытых", value: openNc, cls: "text-asvo-red" },
          { label: "Просрочено", value: overdueNc, cls: "text-asvo-red" },
          { label: "Закрыто", value: closedNc, cls: "text-asvo-accent" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${kpi.cls}`}>{kpi.value}</div>
            <div className="text-xs text-asvo-text-dim mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-asvo-surface border-b border-asvo-border">
              {["ID", "Название", "Источник", "Классификация", "Статус", "Ответственный", "Дата", "Срок"].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-asvo-text-dim">
                  Нет записей о несоответствиях
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const cls = classificationBadge[row.classification];
                return (
                  <tr
                    key={row.id}
                    onClick={() => setDetailNcId(row.id)}
                    className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-mono font-bold text-asvo-accent">{row.number}</td>
                    <td className="px-4 py-3 text-sm text-asvo-text">{row.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="audit">{row.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={cls.color} bg={cls.bg}>{classificationLabel(row.classification)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-asvo-text">
                        <StatusDot color={statusDotColor(row.status)} />
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {fmtPerson(row.assignedTo ?? row.reportedBy)}
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">{fmtDate(row.detectedAt)}</td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">{fmtDate(row.dueDate)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom panels: Workflow + Pareto ─────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Workflow 6 steps (vertical, border-left) */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-asvo-accent" />
            <h3 className="text-sm font-semibold text-asvo-text">Workflow несоответствия</h3>
          </div>

          <div className="flex flex-col gap-1">
            {workflowSteps.map((step, idx) => {
              const stepCount = stats ? countFor(stats.ncByStatus, step.key) : 0;
              const active = stepCount > 0;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg border-l-[3px] ${
                    active
                      ? "border-l-asvo-accent bg-asvo-accent-dim"
                      : "border-l-asvo-border bg-transparent"
                  }`}
                >
                  <span
                    className={`text-xs font-bold w-5 text-center ${
                      active ? "text-asvo-accent" : "text-asvo-text-dim"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      active ? "text-asvo-accent" : "text-asvo-text-dim"
                    }`}
                  >
                    {step.label}
                  </span>
                  {active && (
                    <span className="ml-auto text-xs font-semibold text-asvo-accent">
                      {stepCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pareto chart (source distribution with ProgressBar) */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-asvo-text mb-4">Pareto: источники NC</h3>

          <div className="flex flex-col gap-3">
            {paretoItems.length === 0 ? (
              <p className="text-sm text-asvo-text-dim">Нет данных по источникам</p>
            ) : (
              paretoItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-asvo-text">{item.label}</span>
                    <span className="text-sm font-semibold text-asvo-text-mid">{item.pct}%</span>
                  </div>
                  <ProgressBar value={item.pct} color={item.color} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateNcModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />

      {detailNcId !== null && (
        <NcDetailModal
          ncId={detailNcId}
          isOpen={true}
          onClose={() => setDetailNcId(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
};

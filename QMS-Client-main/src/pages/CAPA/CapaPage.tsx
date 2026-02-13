/**
 * CapaPage.tsx — Реестр CAPA
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия
 *
 * Подключён к API /api/nc/capa и /api/nc/stats
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Plus, Download, Grid3X3,
  AlertTriangle, RefreshCw, Clock, Activity,
} from "lucide-react";

import { capaApi, ncApi } from "../../api/qmsApi";
import type { CapaShort, CapaStatus, NcCapaStats } from "../../api/qmsApi";

import Badge from "../../components/qms/Badge";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import DataTable from "../../components/qms/DataTable";

/* ─── Constants & Maps ───────────────────────────────────────── */

const STATUS_LABELS: Record<CapaStatus, string> = {
  INITIATED:     "Инициировано",
  INVESTIGATING: "Расследование",
  PLANNING:      "Планирование",
  PLAN_APPROVED: "План утверждён",
  IMPLEMENTING:  "Выполнение",
  VERIFYING:     "Проверка",
  EFFECTIVE:     "Эффективно",
  INEFFECTIVE:   "Неэффективно",
  CLOSED:        "Закрыто",
};

const STATUS_VARIANT: Record<CapaStatus, "nc" | "capa" | "risk" | "audit" | "closed" | "sop" | "training"> = {
  INITIATED:     "audit",
  INVESTIGATING: "audit",
  PLANNING:      "risk",
  PLAN_APPROVED: "risk",
  IMPLEMENTING:  "capa",
  VERIFYING:     "training",
  EFFECTIVE:     "sop",
  INEFFECTIVE:   "nc",
  CLOSED:        "closed",
};

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE:  "Корректирующее",
  PREVENTIVE:  "Предупреждающее",
};

const typeBadge: Record<string, { color: string; bg: string }> = {
  CORRECTIVE:  { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  PREVENTIVE:  { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW:      "Низкий",
  MEDIUM:   "Средний",
  HIGH:     "Высокий",
  CRITICAL: "Критический",
};

const PRIORITY_VARIANT: Record<string, "closed" | "capa" | "nc" | "risk"> = {
  LOW:      "closed",
  MEDIUM:   "capa",
  HIGH:     "nc",
  CRITICAL: "nc",
};

const d8Steps = [
  { d: "D1", label: "Команда",        done: true },
  { d: "D2", label: "Описание",       done: true },
  { d: "D3", label: "Сдерживание",    done: true },
  { d: "D4", label: "Root Cause",     done: true },
  { d: "D5", label: "Действия",       done: false },
  { d: "D6", label: "Внедрение",      done: false },
  { d: "D7", label: "Предотвращение", done: false },
  { d: "D8", label: "Закрытие",       done: false },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

function formatPerson(person: { name: string; surname: string } | null): string {
  if (!person) return "\u2014";
  return `${person.surname} ${person.name.charAt(0)}.`;
}

function sumByStatus(stats: NcCapaStats, ...statuses: string[]): number {
  return stats.capaByStatus
    .filter((s) => statuses.includes(s.status))
    .reduce((acc, s) => acc + Number(s.count), 0);
}

/* ─── Component ──────────────────────────────────────────────── */

export const CapaPage: React.FC = () => {
  /* ── State ── */
  const [data, setData] = useState<CapaShort[]>([]);
  const [stats, setStats] = useState<NcCapaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [capaResult, statsResult] = await Promise.all([
        capaApi.getAll({}),
        ncApi.getStats(),
      ]);
      setData(capaResult.rows);
      setStats(statsResult);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки CAPA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── KPI items from stats ── */
  const totalCapa = stats
    ? stats.capaByStatus.reduce((sum, s) => sum + Number(s.count), 0)
    : 0;

  const activeCapa = stats
    ? sumByStatus(stats, "INITIATED", "INVESTIGATING", "PLANNING", "PLAN_APPROVED", "IMPLEMENTING", "VERIFYING")
    : 0;

  const overdueCapa = stats ? stats.overdueCapa : 0;

  const effectiveCapa = stats
    ? sumByStatus(stats, "EFFECTIVE", "CLOSED")
    : 0;

  const kpiItems = [
    { label: "Всего CAPA",    value: totalCapa,     color: "#4A90E8",  icon: <CheckCircle2 size={18} /> },
    { label: "Активных",      value: activeCapa,    color: "#E8A830",  icon: <Activity size={18} /> },
    { label: "Просрочено",    value: overdueCapa,   color: "#F06060",  icon: <AlertTriangle size={18} /> },
    { label: "Эффективных",   value: effectiveCapa, color: "#2DD4A8",  icon: <Clock size={18} /> },
  ];

  /* ── Table columns ── */
  const columns = [
    {
      key: "number",
      label: "ID",
      width: "110px",
      render: (row: CapaShort) => (
        <span className="font-mono text-[12px] font-bold text-asvo-accent">
          {row.number}
        </span>
      ),
    },
    {
      key: "title",
      label: "Название",
      render: (row: CapaShort) => (
        <span className="text-asvo-text text-[13px]">{row.title}</span>
      ),
    },
    {
      key: "type",
      label: "Тип",
      width: "160px",
      render: (row: CapaShort) => {
        const tp = typeBadge[row.type] || typeBadge.CORRECTIVE;
        return (
          <Badge color={tp.color} bg={tp.bg}>
            {TYPE_LABELS[row.type] || row.type}
          </Badge>
        );
      },
    },
    {
      key: "nonconformity",
      label: "NC",
      width: "110px",
      render: (row: CapaShort) =>
        row.nonconformity ? (
          <span className="text-[12px] font-mono font-semibold text-asvo-accent cursor-pointer hover:underline">
            {row.nonconformity.number}
          </span>
        ) : (
          <span className="text-[12px] text-asvo-text-dim">{"\u2014"}</span>
        ),
    },
    {
      key: "status",
      label: "Статус",
      width: "140px",
      render: (row: CapaShort) => {
        const variant = STATUS_VARIANT[row.status] || "closed";
        return (
          <Badge variant={variant}>
            {STATUS_LABELS[row.status] || row.status}
          </Badge>
        );
      },
    },
    {
      key: "priority",
      label: "Приоритет",
      width: "130px",
      render: (row: CapaShort) => {
        const variant = PRIORITY_VARIANT[row.priority] || "closed";
        return (
          <Badge variant={variant}>
            {PRIORITY_LABELS[row.priority] || row.priority}
          </Badge>
        );
      },
    },
    {
      key: "assignedTo",
      label: "Ответственный",
      width: "150px",
      render: (row: CapaShort) => (
        <span className="text-asvo-text-mid text-[12px]">
          {formatPerson(row.assignedTo)}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Срок",
      width: "110px",
      render: (row: CapaShort) => {
        const isOverdue =
          row.dueDate &&
          new Date(row.dueDate) < new Date() &&
          row.status !== "CLOSED" &&
          row.status !== "EFFECTIVE";
        return (
          <span
            className={`text-[12px] ${
              isOverdue ? "text-red-400 font-semibold" : "text-asvo-text-mid"
            }`}
          >
            {formatDate(row.dueDate)}
          </span>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-amber-dim rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-asvo-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">CAPA</h1>
            <p className="text-sm text-asvo-text-dim">ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ActionBtn variant="primary" icon={<Plus size={16} />}>
            Создать CAPA
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={16} />}>
            Экспорт
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchData}>
            Обновить
          </ActionBtn>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <KpiRow items={kpiItems} />

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
          <span className="text-red-400 text-[13px] flex-1">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchData}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="mx-auto text-asvo-text-dim mb-3" size={48} />
          <p className="text-asvo-text-mid text-[14px]">CAPA не найдены</p>
          <p className="text-asvo-text-dim text-[12px] mt-1">
            Создайте первое корректирующее/предупреждающее действие
          </p>
        </div>
      )}

      {/* ── Data Table ── */}
      {!loading && !error && data.length > 0 && (
        <DataTable<CapaShort> columns={columns} data={data} />
      )}

      {/* ── 8D Workflow ──────────────────────────────────────── */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 size={16} className="text-asvo-accent" />
          <h3 className="text-sm font-semibold text-asvo-text">8D Workflow</h3>
        </div>

        <div className="grid grid-cols-8 gap-3">
          {d8Steps.map((step) => (
            <div
              key={step.d}
              className={`rounded-lg p-3 text-center border ${
                step.done
                  ? "bg-asvo-accent-dim border-asvo-accent/30"
                  : "bg-asvo-surface border-asvo-border"
              }`}
            >
              <div
                className={`text-lg font-bold ${
                  step.done ? "text-asvo-accent" : "text-asvo-text-dim"
                }`}
              >
                {step.d}
              </div>
              <div
                className={`text-[10px] mt-1 ${
                  step.done ? "text-asvo-accent" : "text-asvo-text-dim"
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

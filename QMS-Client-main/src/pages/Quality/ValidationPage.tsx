import React, { useState } from "react";
import {
  FlaskConical,
  Plus,
  Download,
  CheckCircle2,
  RefreshCw,
  XCircle,
  CalendarClock,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import ProgressBar from "../../components/qms/ProgressBar";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type QualPhase = "PASSED" | "NOT_STARTED" | "IN_PROGRESS" | "FAILED" | "N_A";

type ValidationStatus =
  | "PLANNED"
  | "IQ_PHASE"
  | "OQ_PHASE"
  | "PQ_PHASE"
  | "VALIDATED"
  | "REVALIDATION_DUE"
  | "EXPIRED"
  | "FAILED";

interface ValidationRow {
  [key: string]: unknown;
  id: string;
  process: string;
  owner: string;
  iq: QualPhase;
  oq: QualPhase;
  pq: QualPhase;
  status: ValidationStatus;
  validationDate: string;
  revalidationDate: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const VALIDATIONS: ValidationRow[] = [
  { id: "PV-2026-001", process: "Пайка SMD (IPC-A-610 Кл.3)",         owner: "Омельченко А.", iq: "PASSED",      oq: "PASSED",      pq: "PASSED",      status: "VALIDATED",        validationDate: "10.01.2026", revalidationDate: "10.01.2027" },
  { id: "PV-2026-002", process: "Нанесение влагозащитного покрытия",   owner: "Яровой Е.",     iq: "PASSED",      oq: "PASSED",      pq: "IN_PROGRESS", status: "PQ_PHASE",         validationDate: "—",          revalidationDate: "—" },
  { id: "PV-2026-003", process: "Калибровка рентген-трубки",           owner: "Чирков И.",     iq: "PASSED",      oq: "IN_PROGRESS", pq: "NOT_STARTED", status: "OQ_PHASE",         validationDate: "—",          revalidationDate: "—" },
  { id: "PV-2026-004", process: "Финальная сборка DEXA",               owner: "Омельченко А.", iq: "PASSED",      oq: "PASSED",      pq: "PASSED",      status: "REVALIDATION_DUE", validationDate: "01.03.2025", revalidationDate: "01.03.2026" },
  { id: "PV-2026-005", process: "Упаковка и маркировка",               owner: "Яровой Е.",     iq: "NOT_STARTED", oq: "NOT_STARTED", pq: "NOT_STARTED", status: "PLANNED",          validationDate: "—",          revalidationDate: "—" },
];

/* ---- IQ / OQ / PQ phase rendering ---- */

const PHASE_CFG: Record<QualPhase, { symbol: string; color: string }> = {
  PASSED:      { symbol: "✓", color: "#2DD4A8" },
  NOT_STARTED: { symbol: "○", color: "#64748B" },
  IN_PROGRESS: { symbol: "⟳", color: "#E8A830" },
  FAILED:      { symbol: "✕", color: "#F06060" },
  N_A:         { symbol: "—", color: "#64748B" },
};

const renderPhase = (phase: QualPhase) => {
  const cfg = PHASE_CFG[phase];
  return (
    <span className="text-sm font-bold" style={{ color: cfg.color }}>
      {cfg.symbol}
    </span>
  );
};

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<ValidationStatus, { label: string; color: string; bg: string }> = {
  PLANNED:          { label: "Запланирован",      color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  IQ_PHASE:         { label: "IQ фаза",           color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  OQ_PHASE:         { label: "OQ фаза",           color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  PQ_PHASE:         { label: "PQ фаза",           color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  VALIDATED:        { label: "Валидирован",        color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  REVALIDATION_DUE: { label: "Треб. ревалидация", color: "#E87040", bg: "rgba(232,112,64,0.12)" },
  EXPIRED:          { label: "Истёк",              color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  FAILED:           { label: "Не пройден",         color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ValidationPage: React.FC = () => {
  /* ---- columns for DataTable ---- */

  const columns = [
    {
      key: "id",
      label: "PV #",
      width: "120px",
      render: (r: ValidationRow) => (
        <span className="font-mono text-asvo-accent">{r.id}</span>
      ),
    },
    {
      key: "process",
      label: "Процесс",
      render: (r: ValidationRow) => <span className="text-asvo-text">{r.process}</span>,
    },
    {
      key: "owner",
      label: "Владелец",
      render: (r: ValidationRow) => <span className="text-asvo-text-mid">{r.owner}</span>,
    },
    {
      key: "iq",
      label: "IQ",
      align: "center" as const,
      render: (r: ValidationRow) => renderPhase(r.iq),
    },
    {
      key: "oq",
      label: "OQ",
      align: "center" as const,
      render: (r: ValidationRow) => renderPhase(r.oq),
    },
    {
      key: "pq",
      label: "PQ",
      align: "center" as const,
      render: (r: ValidationRow) => renderPhase(r.pq),
    },
    {
      key: "status",
      label: "Статус",
      align: "center" as const,
      render: (r: ValidationRow) => {
        const s = STATUS_CFG[r.status];
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "validationDate",
      label: "Валидация",
      render: (r: ValidationRow) => <span className="text-asvo-text-mid">{r.validationDate}</span>,
    },
    {
      key: "revalidationDate",
      label: "Ревалидация",
      render: (r: ValidationRow) => <span className="text-asvo-text-mid">{r.revalidationDate}</span>,
    },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(160,106,232,0.12)" }}>
            <FlaskConical size={22} style={{ color: "#A06AE8" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Валидация процессов</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;7.5.6 &mdash; Валидация специальных процессов</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />}>+ Новая валидация</ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего процессов",        value: 12, icon: <FlaskConical size={18} />,  color: "#4A90E8" },
          { label: "Валидировано",            value: 8,  icon: <CheckCircle2 size={18} />,  color: "#2DD4A8" },
          { label: "Требует ревалидации",     value: 3,  icon: <RefreshCw size={18} />,     color: "#E8A830" },
          { label: "Не пройдено",             value: 1,  icon: <XCircle size={18} />,       color: "#F06060" },
          { label: "Ближайшая ревалидация дн.", value: 18, icon: <CalendarClock size={18} />, color: "#E8A830" },
        ]}
      />

      {/* Data Table */}
      <DataTable columns={columns} data={VALIDATIONS} />

      {/* Progress IQ → OQ → PQ */}
      <Card>
        <SectionTitle>Прогресс IQ → OQ → PQ</SectionTitle>

        <div className="space-y-5">
          {/* PV-2026-001 */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-asvo-text">PV-2026-001 — Пайка SMD (IPC-A-610 Кл.3)</span>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">IQ</span>
                  <span className="text-[11px] text-asvo-text-mid">100%</span>
                </div>
                <ProgressBar value={100} color="blue" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">OQ</span>
                  <span className="text-[11px] text-asvo-text-mid">100%</span>
                </div>
                <ProgressBar value={100} color="amber" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">PQ</span>
                  <span className="text-[11px] text-asvo-text-mid">100%</span>
                </div>
                <ProgressBar value={100} color="accent" />
              </div>
            </div>
          </div>

          {/* PV-2026-002 */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-asvo-text">PV-2026-002 — Нанесение влагозащитного покрытия</span>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">IQ</span>
                  <span className="text-[11px] text-asvo-text-mid">100%</span>
                </div>
                <ProgressBar value={100} color="blue" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">OQ</span>
                  <span className="text-[11px] text-asvo-text-mid">100%</span>
                </div>
                <ProgressBar value={100} color="amber" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-asvo-text-dim">PQ</span>
                  <span className="text-[11px] text-asvo-text-mid">50%</span>
                </div>
                <ProgressBar value={50} color="accent" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ValidationPage;

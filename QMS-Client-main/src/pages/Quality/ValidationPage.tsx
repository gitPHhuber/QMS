import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  Download,
  CheckCircle2,
  RefreshCw,
  XCircle,
  CalendarClock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import ProgressBar from "../../components/qms/ProgressBar";
import { validationsApi } from "../../api/qmsApi";

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

/* ---- IQ / OQ / PQ phase rendering ---- */

const PHASE_CFG: Record<QualPhase, { symbol: string; color: string }> = {
  PASSED:      { symbol: "\u2713", color: "#2DD4A8" },
  NOT_STARTED: { symbol: "\u25CB", color: "#64748B" },
  IN_PROGRESS: { symbol: "\u27F3", color: "#E8A830" },
  FAILED:      { symbol: "\u2715", color: "#F06060" },
  N_A:         { symbol: "\u2014", color: "#64748B" },
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

/* ---- Helper: phase to percentage ---- */

const phaseToPercent = (phase: QualPhase): number => {
  switch (phase) {
    case "PASSED":      return 100;
    case "IN_PROGRESS": return 50;
    case "FAILED":      return 100;
    default:            return 0;
  }
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ValidationPage: React.FC = () => {
  /* ---- state ---- */

  const [validations, setValidations] = useState<ValidationRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- fetch data on mount ---- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [validationsRes, statsRes] = await Promise.all([
          validationsApi.getAll(),
          validationsApi.getStats(),
        ]);

        setValidations(validationsRes.rows ?? []);
        setStats(statsRes);
      } catch (err: any) {
        console.error("Failed to load validation data:", err);
        setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка данных валидации...</span>
        </div>
      </div>
    );
  }

  /* ---- error state ---- */

  if (error) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-card text-asvo-accent border border-asvo-border hover:bg-asvo-border transition"
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
          { label: "Всего процессов",          value: stats?.totalProcesses    ?? 0, icon: <FlaskConical size={18} />,  color: "#4A90E8" },
          { label: "Валидировано",              value: stats?.validated         ?? 0, icon: <CheckCircle2 size={18} />,  color: "#2DD4A8" },
          { label: "Требует ревалидации",       value: stats?.revalidationDue   ?? 0, icon: <RefreshCw size={18} />,     color: "#E8A830" },
          { label: "Не пройдено",               value: stats?.failed            ?? 0, icon: <XCircle size={18} />,       color: "#F06060" },
          { label: "Ближайшая ревалидация дн.", value: stats?.nearestRevalidationDays ?? 0, icon: <CalendarClock size={18} />, color: "#E8A830" },
        ]}
      />

      {/* Data Table */}
      <DataTable columns={columns} data={validations} />

      {/* Progress IQ -> OQ -> PQ */}
      <Card>
        <SectionTitle>Прогресс IQ &rarr; OQ &rarr; PQ</SectionTitle>

        <div className="space-y-5">
          {validations
            .filter((v) => v.status !== "PLANNED" && v.status !== "VALIDATED")
            .map((v) => (
              <div key={v.id} className="space-y-2">
                <span className="text-[13px] font-medium text-asvo-text">
                  {v.id} &mdash; {v.process}
                </span>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-asvo-text-dim">IQ</span>
                      <span className="text-[11px] text-asvo-text-mid">{phaseToPercent(v.iq)}%</span>
                    </div>
                    <ProgressBar value={phaseToPercent(v.iq)} color="blue" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-asvo-text-dim">OQ</span>
                      <span className="text-[11px] text-asvo-text-mid">{phaseToPercent(v.oq)}%</span>
                    </div>
                    <ProgressBar value={phaseToPercent(v.oq)} color="amber" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-asvo-text-dim">PQ</span>
                      <span className="text-[11px] text-asvo-text-mid">{phaseToPercent(v.pq)}%</span>
                    </div>
                    <ProgressBar value={phaseToPercent(v.pq)} color="accent" />
                  </div>
                </div>
              </div>
            ))}

          {validations.filter((v) => v.status !== "PLANNED" && v.status !== "VALIDATED").length === 0 && (
            <p className="text-sm text-asvo-text-dim text-center py-4">
              Нет процессов в активной фазе валидации
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ValidationPage;

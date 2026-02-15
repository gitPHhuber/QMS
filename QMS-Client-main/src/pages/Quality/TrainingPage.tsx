import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Plus,
  Download,
  Users,
  UserCheck,
  CalendarClock,
  AlertCircle,
  Grid3X3,
  Calendar,
  Award,
  Loader2,
  CalendarRange,
  BarChart3,
  ShieldAlert,
  Target,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import { trainingApi } from "../../api/qmsApi";
import { useExport } from "../../hooks/useExport";
import CreateTrainingModal from "./CreateTrainingModal";
import TrainingDetailModal from "./TrainingDetailModal";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface TrainingRow {
  [key: string]: unknown;
  employee: string;
  position: string;
  department: string;
  training: string;
  status: "passed" | "in_progress" | "assigned" | "overdue";
  date: string;
  certificate: string;
}

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<TrainingRow["status"], { label: string; color: string; bg: string }> = {
  passed:      { label: "Пройдено",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  in_progress: { label: "В процессе",  color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  assigned:    { label: "Назначено",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  overdue:     { label: "Просрочено",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ---- Competency matrix ---- */

interface CompetencyRow {
  name: string;
  skills: string[];
  levels: number[]; // 0-3
}

const LEVEL_CFG: Record<number, { dots: string; cls: string }> = {
  3: { dots: "\u25CF\u25CF\u25CF", cls: "bg-[rgba(45,212,168,0.20)] text-[#2DD4A8]" },
  2: { dots: "\u25CF\u25CF",       cls: "bg-[rgba(74,144,232,0.20)] text-[#4A90E8]" },
  1: { dots: "\u25CF",             cls: "bg-[rgba(232,168,48,0.20)] text-[#E8A830]" },
  0: { dots: "\u2014",             cls: "bg-[rgba(240,96,96,0.20)] text-[#F06060]" },
};

/* ---- Default skills for competency matrix header ---- */

const DEFAULT_SKILLS = ["ISO 13485", "IPC-A-610", "Пайка SMD", "ESD", "GMP"];

/* ---- Plan item types ---- */

type PlanItemStatus = "PLANNED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";

const PLAN_STATUS_CFG: Record<PlanItemStatus, { label: string; color: string; bg: string }> = {
  PLANNED:     { label: "Запланировано", color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  SCHEDULED:   { label: "Назначено",    color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  IN_PROGRESS: { label: "В процессе",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  COMPLETED:   { label: "Завершено",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  CANCELLED:   { label: "Отменено",     color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  OVERDUE:     { label: "Просрочено",   color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const PLAN_MONTH_COLORS: Record<PlanItemStatus, string> = {
  PLANNED:     "#64748B",
  SCHEDULED:   "#4A90E8",
  IN_PROGRESS: "#E8A830",
  COMPLETED:   "#2DD4A8",
  CANCELLED:   "#3B4252",
  OVERDUE:     "#F06060",
};

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

/* ---- Plan item type config ---- */

const PLAN_TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  MANDATORY:  { label: "Обязательное", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  ELECTIVE:   { label: "По выбору",    color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  REFRESHER:  { label: "Повторное",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  ONBOARDING: { label: "Вводное",      color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
};

/* ---- View toggle ---- */

type View = "table" | "matrix" | "plan" | "gaps";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const TrainingPage: React.FC = () => {
  const { exporting, doExport } = useExport();
  const [view, setView] = useState<View>("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailRecordId, setDetailRecordId] = useState<number | null>(null);

  /* ---- API state ---- */
  const [plans, setPlans] = useState<TrainingRow[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [competency, setCompetency] = useState<CompetencyRow[]>([]);
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch data on mount and when view changes ---- */

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch stats
      const statsData = await trainingApi.getStats();
      setStats(statsData);

      if (view === "table") {
        const [plansRes, recordsRes] = await Promise.all([
          trainingApi.getPlans(),
          trainingApi.getRecords(),
        ]);
        setPlans(plansRes.rows ?? []);
        setRecords(recordsRes.rows ?? []);
      } else if (view === "matrix") {
        const compRes = await trainingApi.getCompetency();
        setCompetency(compRes.rows ?? []);
      } else if (view === "plan") {
        const planRes = await trainingApi.getPlanItems();
        setPlanItems(planRes.rows ?? planRes ?? []);
      } else if (view === "gaps") {
        const gapRes = await trainingApi.getGapAnalysis();
        setGapData(gapRes);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Ошибка загрузки данных обучения");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ---- Derive skills list from competency data ---- */

  const skills: string[] =
    competency.length > 0 && competency[0].skills?.length > 0
      ? competency[0].skills
      : DEFAULT_SKILLS;

  /* ---- columns for DataTable ---- */

  const columns = [
    {
      key: "employee",
      label: "Сотрудник",
      render: (r: TrainingRow) => (
        <span className="font-medium text-asvo-text">{r.employee}</span>
      ),
    },
    {
      key: "position",
      label: "Должность",
      render: (r: TrainingRow) => <span className="text-asvo-text-mid">{r.position}</span>,
    },
    {
      key: "department",
      label: "Отдел",
      render: (r: TrainingRow) => <span className="text-asvo-text-mid">{r.department}</span>,
    },
    {
      key: "training",
      label: "Обучение",
      render: (r: TrainingRow) => <span className="text-asvo-text">{r.training}</span>,
    },
    {
      key: "status",
      label: "Статус",
      align: "center" as const,
      render: (r: TrainingRow) => {
        const s = STATUS_CFG[r.status] ?? STATUS_CFG.assigned;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "date",
      label: "Дата",
      render: (r: TrainingRow) => (
        <span className="flex items-center gap-1 text-asvo-text-mid">
          <Calendar size={12} className="text-asvo-text-dim" />
          {r.date}
        </span>
      ),
    },
    {
      key: "certificate",
      label: "Сертификат",
      align: "center" as const,
      render: (r: TrainingRow) =>
        r.certificate === "Да" ? (
          <span className="flex items-center justify-center gap-1 text-asvo-accent">
            <Award size={13} />
            Да
          </span>
        ) : (
          <span className="text-asvo-text-dim">{r.certificate}</span>
        ),
    },
  ];

  /* ---- Gap analysis table columns ---- */

  const gapColumns = [
    {
      key: "employee",
      label: "Сотрудник",
      render: (r: any) => <span className="font-medium text-asvo-text">{r.employee ?? r.employeeName ?? "\u2014"}</span>,
    },
    {
      key: "process",
      label: "Процесс",
      render: (r: any) => <span className="text-asvo-text">{r.process ?? r.skill ?? "\u2014"}</span>,
    },
    {
      key: "currentLevel",
      label: "Текущий",
      align: "center" as const,
      render: (r: any) => <span className="text-asvo-text-mid font-mono">{r.currentLevel ?? 0}</span>,
    },
    {
      key: "requiredLevel",
      label: "Требуемый",
      align: "center" as const,
      render: (r: any) => <span className="text-asvo-text-mid font-mono">{r.requiredLevel ?? 0}</span>,
    },
    {
      key: "gap",
      label: "GAP",
      align: "center" as const,
      render: (r: any) => {
        const gap = (r.requiredLevel ?? 0) - (r.currentLevel ?? 0);
        const color = gap <= 0 ? "#2DD4A8" : gap === 1 ? "#E8A830" : "#F06060";
        const bg = gap <= 0 ? "rgba(45,212,168,0.12)" : gap === 1 ? "rgba(232,168,48,0.12)" : "rgba(240,96,96,0.12)";
        return <Badge color={color} bg={bg}>{gap <= 0 ? "OK" : `-${gap}`}</Badge>;
      },
    },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-asvo-accent-dim rounded-xl">
            <GraduationCap size={22} className="text-asvo-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Обучение персонала</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;6.2 &mdash; Компетентность, обучение, осведомлённость</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>+ Назначить обучение</ActionBtn>
          <ActionBtn
            variant="secondary"
            color="#A06AE8"
            icon={<Grid3X3 size={15} />}
            onClick={() => setView(view === "matrix" ? "table" : "matrix")}
          >
            Матрица компетенций
          </ActionBtn>
          <ActionBtn
            variant="secondary"
            color="#4A90E8"
            icon={<CalendarRange size={15} />}
            onClick={() => setView(view === "plan" ? "table" : "plan")}
          >
            План на год
          </ActionBtn>
          <ActionBtn
            variant="secondary"
            color="#E8A830"
            icon={<BarChart3 size={15} />}
            onClick={() => setView(view === "gaps" ? "table" : "gaps")}
          >
            GAP-анализ
          </ActionBtn>
          <ActionBtn variant="secondary" icon={exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} disabled={exporting} onClick={() => doExport("training", "Training_Export")}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего сотрудников", value: stats?.totalEmployees ?? 0,  icon: <Users size={18} />,         color: "#4A90E8" },
          { label: "Обучено",           value: stats?.trained ?? 0,         icon: <UserCheck size={18} />,      color: "#2DD4A8" },
          { label: "План обучения",     value: stats?.planned ?? 0,         icon: <CalendarClock size={18} />,  color: "#E8A830" },
          { label: "Просрочено",        value: stats?.overdue ?? 0,         icon: <AlertCircle size={18} />,    color: "#F06060" },
        ]}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-t-4 border-asvo-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card>
          <div className="flex items-center gap-3 p-4 text-[#F06060]">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      {/* ---- View: Table ---- */}
      {!loading && !error && view === "table" && (
        <DataTable
          columns={columns}
          data={plans}
          onRowClick={(row: any) => row.id && setDetailRecordId(row.id)}
        />
      )}

      {/* ---- View: Competency Matrix ---- */}
      {!loading && !error && view === "matrix" && (
        <Card>
          <SectionTitle>Матрица компетенций</SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">
                    Сотрудник
                  </th>
                  {skills.map((sk) => (
                    <th key={sk} className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">
                      {sk}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competency.map((row) => (
                  <tr key={row.name} className="border-t border-asvo-border/40">
                    <td className="px-3 py-2.5 text-[13px] font-medium text-asvo-text whitespace-nowrap">
                      {row.name}
                    </td>
                    {(row.levels ?? []).map((lvl, ci) => {
                      const cfg = LEVEL_CFG[lvl] ?? LEVEL_CFG[0];
                      return (
                        <td key={ci} className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-lg text-[12px] font-bold px-2.5 py-1 min-w-[44px] ${cfg.cls}`}
                          >
                            {cfg.dots}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 text-[11px] text-asvo-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(45,212,168,0.20)]" /> 3 &mdash; Эксперт
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(74,144,232,0.20)]" /> 2 &mdash; Специалист
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(232,168,48,0.20)]" /> 1 &mdash; Базовый
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(240,96,96,0.20)]" /> 0 &mdash; Отсутствует
            </span>
          </div>
        </Card>
      )}

      {/* ---- View: Annual Plan ---- */}
      {!loading && !error && view === "plan" && (
        <Card>
          <SectionTitle>План обучения на год</SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5 min-w-[200px]">
                    Обучение
                  </th>
                  <th className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-2 py-2.5 min-w-[80px]">
                    Тип
                  </th>
                  <th className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-2 py-2.5 min-w-[90px]">
                    Статус
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-1 py-2.5 min-w-[44px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(planItems) ? planItems : []).map((item: any, idx: number) => {
                  const status: PlanItemStatus = item.status ?? "PLANNED";
                  const sc = PLAN_STATUS_CFG[status] ?? PLAN_STATUS_CFG.PLANNED;
                  const typeCfg = PLAN_TYPE_CFG[item.type] ?? { label: item.type ?? "\u2014", color: "#64748B", bg: "rgba(100,116,139,0.12)" };
                  const scheduledMonth: number = item.scheduledMonth ?? item.month ?? -1; // 1-12

                  return (
                    <tr key={item.id ?? idx} className="border-t border-asvo-border/40">
                      <td className="px-3 py-2.5 text-[13px] font-medium text-asvo-text whitespace-nowrap">
                        {item.title ?? item.name ?? "\u2014"}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <Badge color={typeCfg.color} bg={typeCfg.bg}>{typeCfg.label}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                      </td>
                      {MONTHS.map((_, mi) => {
                        const monthNum = mi + 1;
                        const isScheduled = monthNum === scheduledMonth;
                        return (
                          <td key={mi} className="px-1 py-2.5 text-center">
                            {isScheduled ? (
                              <div
                                className="w-6 h-6 mx-auto rounded-md"
                                style={{ backgroundColor: PLAN_MONTH_COLORS[status] ?? "#64748B" }}
                              />
                            ) : (
                              <div className="w-6 h-6 mx-auto rounded-md bg-asvo-border/20" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(Array.isArray(planItems) ? planItems : []).length === 0 && (
            <p className="text-sm text-asvo-text-dim text-center py-8">
              Нет элементов плана обучения
            </p>
          )}

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 text-[11px] text-asvo-text-dim flex-wrap">
            {(Object.entries(PLAN_STATUS_CFG) as [PlanItemStatus, { label: string; color: string }][]).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: PLAN_MONTH_COLORS[key] }}
                />
                {cfg.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ---- View: GAP Analysis ---- */}
      {!loading && !error && view === "gaps" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(240,96,96,0.12)" }}>
                  <ShieldAlert size={20} style={{ color: "#F06060" }} />
                </div>
                <div>
                  <p className="text-[11px] text-asvo-text-dim uppercase tracking-wider">Всего GAP</p>
                  <p className="text-2xl font-bold text-asvo-text">{gapData?.totalGaps ?? 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(45,212,168,0.12)" }}>
                  <Target size={20} style={{ color: "#2DD4A8" }} />
                </div>
                <div>
                  <p className="text-[11px] text-asvo-text-dim uppercase tracking-wider">Соответствие</p>
                  <p className="text-2xl font-bold text-asvo-text">{gapData?.compliancePercent ?? 0}%</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(240,96,96,0.12)" }}>
                  <AlertCircle size={20} style={{ color: "#F06060" }} />
                </div>
                <div>
                  <p className="text-[11px] text-asvo-text-dim uppercase tracking-wider">Критические GAP</p>
                  <p className="text-2xl font-bold text-asvo-text">{gapData?.criticalGaps ?? 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Gap table */}
          <DataTable
            columns={gapColumns}
            data={gapData?.gaps ?? gapData?.rows ?? []}
          />

          {(gapData?.gaps ?? gapData?.rows ?? []).length === 0 && (
            <Card>
              <p className="text-sm text-asvo-text-dim text-center py-8">
                Нет данных GAP-анализа
              </p>
            </Card>
          )}
        </>
      )}

      {/* ---- Modals ---- */}
      <CreateTrainingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={reload}
      />

      {detailRecordId !== null && (
        <TrainingDetailModal
          recordId={detailRecordId}
          isOpen={detailRecordId !== null}
          onClose={() => setDetailRecordId(null)}
          onAction={reload}
        />
      )}
    </div>
  );
};

export default TrainingPage;

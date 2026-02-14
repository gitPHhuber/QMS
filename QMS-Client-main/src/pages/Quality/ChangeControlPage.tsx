import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Plus,
  Download,
  Clock,
  PlayCircle,
  XCircle,
  Timer,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import TabBar from "../../components/qms/TabBar";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import { changeRequestsApi } from "../../api/qmsApi";
import { useExport } from "../../hooks/useExport";
import CreateChangeModal from "./CreateChangeModal";
import ChangeDetailModal from "./ChangeDetailModal";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ChangeType = "DESIGN" | "PROCESS" | "DOCUMENT" | "SOFTWARE" | "SUPPLIER" | "MATERIAL";
type ChangeCategory = "MAJOR" | "MINOR";
type ChangePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ChangeStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IMPACT_REVIEW"
  | "APPROVED"
  | "IN_PROGRESS"
  | "VERIFICATION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

interface ChangeRow {
  [key: string]: unknown;
  id: number;
  ecr: string;
  date: string;
  type: ChangeType;
  title: string;
  category: ChangeCategory;
  priority: ChangePriority;
  status: ChangeStatus;
  initiator: string;
  approver: string;
}

/* ------------------------------------------------------------------ */
/*  Display name maps                                                   */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<ChangeType, string> = {
  DESIGN: "Конструкция",
  PROCESS: "Процесс",
  DOCUMENT: "Документ",
  SOFTWARE: "ПО",
  SUPPLIER: "Поставщик",
  MATERIAL: "Материал",
};

const STATUS_LABELS: Record<ChangeStatus, string> = {
  DRAFT: "Черновик",
  SUBMITTED: "На согласовании",
  IMPACT_REVIEW: "Оценка влияния",
  APPROVED: "Одобрена",
  IN_PROGRESS: "Внедрение",
  VERIFICATION: "Верификация",
  COMPLETED: "Завершена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
};

/* ------------------------------------------------------------------ */
/*  Badge color maps                                                    */
/* ------------------------------------------------------------------ */

const typeColors: Record<ChangeType, { color: string; bg: string }> = {
  DESIGN:   { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
  PROCESS:  { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  DOCUMENT: { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  SOFTWARE: { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  SUPPLIER: { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  MATERIAL: { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
};

const categoryColors: Record<ChangeCategory, { color: string; bg: string }> = {
  MAJOR: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  MINOR: { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
};

const priorityColors: Record<ChangePriority, { color: string; bg: string }> = {
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  HIGH:     { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  MEDIUM:   { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  LOW:      { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
};

const statusColors: Record<ChangeStatus, { color: string; bg: string }> = {
  DRAFT:         { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
  SUBMITTED:     { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  IMPACT_REVIEW: { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  APPROVED:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  IN_PROGRESS:   { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
  VERIFICATION:  { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  COMPLETED:     { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  REJECTED:      { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  CANCELLED:     { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
};

/* ------------------------------------------------------------------ */
/*  Tabs                                                                */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "registry",  label: "Реестр" },
  { key: "workflow",  label: "Workflow" },
  { key: "analytics", label: "Аналитика" },
];

/* ------------------------------------------------------------------ */
/*  Workflow pipeline steps                                             */
/* ------------------------------------------------------------------ */

interface PipelineStep {
  label: string;
  description: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: "Черновик",          description: "Инициатор заполняет ECR-форму" },
  { label: "Подана",            description: "Запрос отправлен на согласование" },
  { label: "Оценка влияния",   description: "Анализ рисков и затронутых процессов" },
  { label: "Одобрена",         description: "Комиссия утвердила изменение" },
  { label: "Внедрение",        description: "Реализация изменений в производстве" },
  { label: "Верификация",      description: "Проверка корректности внедрения" },
  { label: "Завершена",        description: "Изменение закрыто и задокументировано" },
];

/* Current step index for the demo pipeline (0-based) */
const CURRENT_STEP = 4;

/* ------------------------------------------------------------------ */
/*  Table columns                                                       */
/* ------------------------------------------------------------------ */

const columns = [
  {
    key: "ecr",
    label: "ECR #",
    width: "130px",
    render: (r: ChangeRow) => <span className="font-mono text-asvo-accent">{r.ecr}</span>,
  },
  {
    key: "date",
    label: "Дата",
    width: "100px",
    render: (r: ChangeRow) => <span className="text-asvo-text-mid">{r.date}</span>,
  },
  {
    key: "type",
    label: "Тип",
    align: "center" as const,
    render: (r: ChangeRow) => {
      const c = typeColors[r.type];
      return <Badge color={c.color} bg={c.bg}>{TYPE_LABELS[r.type]}</Badge>;
    },
  },
  {
    key: "title",
    label: "Название",
    render: (r: ChangeRow) => <span className="text-asvo-text">{r.title}</span>,
  },
  {
    key: "category",
    label: "Категория",
    align: "center" as const,
    render: (r: ChangeRow) => {
      const c = categoryColors[r.category];
      return <Badge color={c.color} bg={c.bg}>{r.category}</Badge>;
    },
  },
  {
    key: "priority",
    label: "Приоритет",
    align: "center" as const,
    render: (r: ChangeRow) => {
      const c = priorityColors[r.priority];
      return <Badge color={c.color} bg={c.bg}>{r.priority}</Badge>;
    },
  },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: ChangeRow) => {
      const c = statusColors[r.status];
      return <Badge color={c.color} bg={c.bg}>{STATUS_LABELS[r.status]}</Badge>;
    },
  },
  {
    key: "initiator",
    label: "Инициатор",
    render: (r: ChangeRow) => <span className="text-asvo-text-mid">{r.initiator}</span>,
  },
  {
    key: "approver",
    label: "Одобрил",
    render: (r: ChangeRow) => <span className="text-asvo-text-mid">{r.approver}</span>,
  },
];

/* ================================================================== */
/*  Component                                                           */
/* ================================================================== */

const ChangeControlPage: React.FC = () => {
  const { exporting, doExport } = useExport();
  const [tab, setTab] = useState("registry");

  /* ---- Modal state ---- */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailChangeId, setDetailChangeId] = useState<number | null>(null);

  /* ---- API state ---- */
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => setRefreshKey((k) => k + 1);

  /* ---- Fetch data on mount ---- */
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [allResult, statsResult] = await Promise.all([
          changeRequestsApi.getAll(),
          changeRequestsApi.getStats(),
        ]);

        if (cancelled) return;

        const rows: ChangeRow[] = (allResult.rows ?? []).map((r: any) => ({
          id: r.id,
          ecr: r.ecr ?? r.number ?? `ECR-${r.id}`,
          date: r.date ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("ru-RU") : "\u2014"),
          type: r.type ?? "DESIGN",
          title: r.title ?? "",
          category: r.category ?? "MINOR",
          priority: r.priority ?? "MEDIUM",
          status: r.status ?? "DRAFT",
          initiator: r.initiator
            ?? (r.initiatedBy ? `${r.initiatedBy.surname ?? ""} ${(r.initiatedBy.name ?? "").charAt(0)}.`.trim() : "\u2014"),
          approver: r.approver
            ?? (r.approvedBy ? `${r.approvedBy.surname ?? ""} ${(r.approvedBy.name ?? "").charAt(0)}.`.trim() : "\u2014"),
        }));

        setChanges(rows);
        setStats(statsResult);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? "Ошибка загрузки данных");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* ---- KPI (driven by stats from API) ---- */
  const kpis = [
    { label: "Всего запросов",              value: stats?.totalRequests   ?? stats?.total   ?? changes.length, icon: <GitBranch size={18} />,    color: "#4A90E8" },
    { label: "Ожидают одобрения",           value: stats?.pendingApproval ?? stats?.pending ?? 0,              icon: <Clock size={18} />,        color: "#E8A830" },
    { label: "В работе",                    value: stats?.inProgress      ?? 0,                                icon: <PlayCircle size={18} />,   color: "#2DD4A8" },
    { label: "Отклонено",                   value: stats?.rejected        ?? 0,                                icon: <XCircle size={18} />,      color: "#F06060" },
    { label: "Среднее время внедрения дн.", value: stats?.avgImplementationDays ?? stats?.avgDays ?? 0,        icon: <Timer size={18} />,        color: "#2DD4A8" },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
            <GitBranch size={22} style={{ color: "#4A90E8" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Управление изменениями</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;7.3.9 &mdash; Управление изменениями проекта</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>+ Новый ECR</ActionBtn>
          <ActionBtn variant="secondary" icon={exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} disabled={exporting} onClick={() => doExport("changes", "Changes_Export")}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow items={kpis} />

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ---- Loading spinner ---- */}
      {loading && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={36} className="animate-spin text-asvo-accent mb-3" />
            <p className="text-[13px] text-asvo-text-dim">Загрузка данных...</p>
          </div>
        </Card>
      )}

      {/* ---- Error state ---- */}
      {!loading && error && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle size={36} className="mb-3" style={{ color: "#F06060" }} />
            <p className="text-[13px] text-asvo-text mb-1" style={{ color: "#F06060" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: "rgba(74,144,232,0.15)", color: "#4A90E8" }}
            >
              Повторить
            </button>
          </div>
        </Card>
      )}

      {/* ---- TAB: Registry ---- */}
      {!loading && !error && tab === "registry" && (
        <DataTable
          columns={columns}
          data={changes}
          onRowClick={(row: ChangeRow) => setDetailChangeId(row.id)}
        />
      )}

      {/* ---- TAB: Workflow ---- */}
      {!loading && !error && tab === "workflow" && (
        <Card>
          <SectionTitle>Workflow &mdash; Жизненный цикл ECR</SectionTitle>

          {/* Pipeline visualization */}
          <div className="flex items-start justify-between gap-0 mt-6 mb-2 overflow-x-auto">
            {PIPELINE_STEPS.map((step, i) => {
              const isCompleted = i < CURRENT_STEP;
              const isCurrent = i === CURRENT_STEP;
              const isFuture = i > CURRENT_STEP;

              return (
                <div key={step.label} className="flex items-start flex-1 min-w-0">
                  {/* Step circle + connector */}
                  <div className="flex flex-col items-center flex-1">
                    {/* Row with circle and line */}
                    <div className="flex items-center w-full">
                      {/* Left connector line */}
                      {i > 0 && (
                        <div
                          className="h-[2px] flex-1"
                          style={{
                            backgroundColor: isCompleted || isCurrent ? "#2DD4A8" : "#334155",
                          }}
                        />
                      )}

                      {/* Circle */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: isCompleted
                            ? "#2DD4A8"
                            : isCurrent
                            ? "rgba(45,212,168,0.15)"
                            : "#1E293B",
                          border: isCurrent
                            ? "2px solid #2DD4A8"
                            : isFuture
                            ? "2px solid #334155"
                            : "2px solid #2DD4A8",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={16} style={{ color: "#0F1A2A" }} />
                        ) : (
                          <span
                            className="text-[11px] font-bold"
                            style={{
                              color: isCurrent ? "#2DD4A8" : "#64748B",
                            }}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Right connector line */}
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div
                          className="h-[2px] flex-1"
                          style={{
                            backgroundColor: isCompleted ? "#2DD4A8" : "#334155",
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className="mt-2 text-[11px] font-semibold text-center leading-tight"
                      style={{
                        color: isCompleted || isCurrent ? "#2DD4A8" : "#64748B",
                      }}
                    >
                      {step.label}
                    </span>

                    {/* Description */}
                    <span className="mt-1 text-[10px] text-asvo-text-dim text-center leading-tight px-1">
                      {step.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ---- TAB: Analytics ---- */}
      {!loading && !error && tab === "analytics" && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
            <GitBranch size={40} className="mb-3 opacity-30" />
            <p className="text-[13px]">Раздел аналитики находится в разработке</p>
          </div>
        </Card>
      )}

      {/* ---- Modals ---- */}
      <CreateChangeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refreshData}
      />

      {detailChangeId !== null && (
        <ChangeDetailModal
          changeId={detailChangeId}
          isOpen={true}
          onClose={() => setDetailChangeId(null)}
          onAction={refreshData}
        />
      )}
    </div>
  );
};

export default ChangeControlPage;

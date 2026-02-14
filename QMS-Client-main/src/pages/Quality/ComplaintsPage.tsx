import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  Plus,
  Download,
  Clock,
  AlertTriangle,
  Timer,
  Shield,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import TabBar from "../../components/qms/TabBar";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import { complaintsApi } from "../../api/qmsApi";
import CreateComplaintModal from "./CreateComplaintModal";
import ComplaintDetailModal from "./ComplaintDetailModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Severity = "CRITICAL" | "MAJOR" | "MINOR" | "INFORMATIONAL";
type ComplaintStatus = "RECEIVED" | "UNDER_REVIEW" | "INVESTIGATING" | "RESOLVED" | "CLOSED" | "REJECTED";
type Source = "CUSTOMER" | "DISTRIBUTOR" | "INTERNAL" | "REGULATOR" | "FIELD_REPORT";

interface ComplaintRow {
  [key: string]: unknown;
  id: string;
  date: string;
  source: Source;
  product: string;
  description: string;
  severity: Severity;
  status: ComplaintStatus;
  owner: string;
  ncRef: string;
  capaRef: string;
  isReportable?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Display name maps                                                  */
/* ------------------------------------------------------------------ */

const SOURCE_LABELS: Record<Source, string> = {
  CUSTOMER: "Заказчик",
  DISTRIBUTOR: "Дистрибьютор",
  INTERNAL: "Внутренний",
  REGULATOR: "Регулятор",
  FIELD_REPORT: "Полевой отчёт",
};

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  RECEIVED: "Получена",
  UNDER_REVIEW: "На рассмотрении",
  INVESTIGATING: "Расследование",
  RESOLVED: "Решена",
  CLOSED: "Закрыта",
  REJECTED: "Отклонена",
};

/* ------------------------------------------------------------------ */
/*  Badge color maps                                                   */
/* ------------------------------------------------------------------ */

const SEVERITY_COLORS: Record<Severity, { color: string; bg: string }> = {
  CRITICAL:      { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  MAJOR:         { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  MINOR:         { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  INFORMATIONAL: { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
};

const STATUS_COLORS: Record<ComplaintStatus, { color: string; bg: string }> = {
  RECEIVED:      { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  UNDER_REVIEW:  { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  INVESTIGATING: { color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
  RESOLVED:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  CLOSED:        { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  REJECTED:      { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ------------------------------------------------------------------ */
/*  Source distribution colors                                         */
/* ------------------------------------------------------------------ */

const SOURCE_COLORS: Record<Source, string> = {
  CUSTOMER: "#4A90E8",
  DISTRIBUTOR: "#A06AE8",
  INTERNAL: "#E8A830",
  REGULATOR: "#F06060",
  FIELD_REPORT: "#2DD4A8",
};

/* ------------------------------------------------------------------ */
/*  Source distribution type                                           */
/* ------------------------------------------------------------------ */

interface SourceStat {
  source: Source;
  count: number;
  pct: number;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "registry",  label: "Реестр" },
  { key: "sources",   label: "По источникам" },
  { key: "analytics", label: "Аналитика" },
];

/* ------------------------------------------------------------------ */
/*  Table columns                                                      */
/* ------------------------------------------------------------------ */

const columns = [
  {
    key: "id",
    label: "ID",
    width: "130px",
    render: (r: ComplaintRow) => (
      <span className="font-mono text-asvo-accent">{r.id}</span>
    ),
  },
  {
    key: "date",
    label: "Дата",
    width: "100px",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.date}</span>
    ),
  },
  {
    key: "source",
    label: "Источник",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{SOURCE_LABELS[r.source]}</span>
    ),
  },
  {
    key: "product",
    label: "Продукт",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text">{r.product}</span>
    ),
  },
  {
    key: "description",
    label: "Описание",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.description}</span>
    ),
  },
  {
    key: "severity",
    label: "Серьёзность",
    align: "center" as const,
    render: (r: ComplaintRow) => {
      const c = SEVERITY_COLORS[r.severity];
      return <Badge color={c.color} bg={c.bg}>{r.severity}</Badge>;
    },
  },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: ComplaintRow) => {
      const c = STATUS_COLORS[r.status];
      return <Badge color={c.color} bg={c.bg}>{STATUS_LABELS[r.status]}</Badge>;
    },
  },
  {
    key: "owner",
    label: "Ответственный",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.owner}</span>
    ),
  },
  {
    key: "ncRef",
    label: "NC",
    align: "center" as const,
    render: (r: ComplaintRow) =>
      r.ncRef !== "\u2014" ? (
        <Badge color="#F06060" bg="rgba(240,96,96,0.12)">{r.ncRef}</Badge>
      ) : (
        <span className="text-asvo-text-dim">{r.ncRef}</span>
      ),
  },
  {
    key: "capaRef",
    label: "CAPA",
    align: "center" as const,
    render: (r: ComplaintRow) =>
      r.capaRef !== "\u2014" ? (
        <Badge color="#E8A830" bg="rgba(232,168,48,0.12)">{r.capaRef}</Badge>
      ) : (
        <span className="text-asvo-text-dim">{r.capaRef}</span>
      ),
  },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ComplaintsPage: React.FC = () => {
  const [tab, setTab] = useState("registry");

  /* ---- Data state ---- */
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Modal state ---- */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailComplaintId, setDetailComplaintId] = useState<number | null>(null);

  /* ---- Fetch data ---- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintsRes, statsRes] = await Promise.all([
        complaintsApi.getAll(),
        complaintsApi.getStats(),
      ]);

      setComplaints(complaintsRes.rows ?? []);
      setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to load complaints data:", err);
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const reloadData = async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        complaintsApi.getAll(),
        complaintsApi.getStats(),
      ]);
      setComplaints(complaintsRes.rows ?? []);
      setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to reload complaints data:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ---- Compute source stats from complaints ---- */
  const sourceStats: SourceStat[] = (() => {
    const total = complaints.length;
    const allSources: Source[] = ["CUSTOMER", "DISTRIBUTOR", "REGULATOR", "INTERNAL", "FIELD_REPORT"];
    return allSources.map((source) => {
      const count = complaints.filter((c) => c.source === source).length;
      return { source, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  })();

  /* ---- KPI (from stats or fallback to computed) ---- */
  const kpis = [
    {
      label: "Всего рекламаций",
      value: stats?.totalComplaints ?? complaints.length,
      icon: <MessageSquareWarning size={18} />,
      color: "#4A90E8",
    },
    {
      label: "Открытых",
      value: stats?.openComplaints ?? complaints.filter((c) => !["CLOSED", "REJECTED", "RESOLVED"].includes(c.status)).length,
      icon: <Clock size={18} />,
      color: "#E8A830",
    },
    {
      label: "Критических",
      value: stats?.criticalComplaints ?? complaints.filter((c) => c.severity === "CRITICAL").length,
      icon: <AlertTriangle size={18} />,
      color: "#F06060",
    },
    {
      label: "Среднее время закрытия дн.",
      value: stats?.avgClosingDays ?? 0,
      icon: <Timer size={18} />,
      color: "#2DD4A8",
    },
    {
      label: "Требуют уведомления",
      value: stats?.reportableComplaints ?? complaints.filter((c) => c.isReportable).length,
      icon: <Shield size={18} />,
      color: "#F06060",
    },
  ];

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-asvo-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-asvo-text-dim">Загрузка рекламаций...</span>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={36} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1.5 text-xs bg-asvo-surface border border-asvo-border rounded-lg text-asvo-text hover:bg-asvo-border transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-asvo-blue-dim rounded-xl">
            <MessageSquareWarning size={22} className="text-asvo-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Рекламации</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;8.2.2 &mdash; Обратная связь от потребителей</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>+ Новая рекламация</ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />} disabled title="Будет доступно в следующем спринте">Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow items={kpis} />

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ---- TAB: Registry ---- */}
      {tab === "registry" && <DataTable columns={columns} data={complaints} onRowClick={(row: ComplaintRow) => setDetailComplaintId(Number(row.id))} />}

      {/* ---- TAB: Sources ---- */}
      {tab === "sources" && (
        <Card>
          <SectionTitle>Распределение по источникам</SectionTitle>

          {/* Bar chart visualization */}
          <div className="space-y-4">
            {sourceStats.map((s) => (
              <div key={s.source} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-asvo-text">{SOURCE_LABELS[s.source]}</span>
                  <span className="text-[13px] font-semibold text-asvo-text-mid">
                    {s.count} ({s.pct}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-asvo-surface border border-asvo-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: SOURCE_COLORS[s.source],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pie chart visualization */}
          <div className="mt-8">
            <SectionTitle>Визуализация</SectionTitle>

            <div className="flex items-center justify-center gap-10">
              {/* Dynamic pie representation */}
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return sourceStats
                      .filter((s) => s.pct > 0)
                      .map((s) => {
                        const circle = (
                          <circle
                            key={s.source}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={SOURCE_COLORS[s.source]}
                            strokeWidth="20"
                            strokeDasharray={`${s.pct * 2.512} ${100 * 2.512}`}
                            strokeDashoffset={`${-offset * 2.512}`}
                          />
                        );
                        offset += s.pct;
                        return circle;
                      });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-asvo-text">{complaints.length}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5">
                {sourceStats.filter((s) => s.count > 0).map((s) => (
                  <div key={s.source} className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: SOURCE_COLORS[s.source] }}
                    />
                    <span className="text-[13px] text-asvo-text-mid">
                      {SOURCE_LABELS[s.source]}
                    </span>
                    <span className="text-[13px] font-semibold text-asvo-text">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ---- TAB: Analytics ---- */}
      {tab === "analytics" && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
            <MessageSquareWarning size={40} className="mb-3 opacity-30" />
            <p className="text-[13px]">Раздел аналитики находится в разработке</p>
          </div>
        </Card>
      )}

      {/* ---- Modals ---- */}
      <CreateComplaintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={reloadData}
      />

      {detailComplaintId !== null && (
        <ComplaintDetailModal
          complaintId={detailComplaintId}
          isOpen={true}
          onClose={() => setDetailComplaintId(null)}
          onAction={reloadData}
        />
      )}
    </div>
  );
};

export default ComplaintsPage;

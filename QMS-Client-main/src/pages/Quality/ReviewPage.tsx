import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Plus,
  FileText,
  ClipboardList,
  Users,
  Activity,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import DataTable from "../../components/qms/DataTable";
import Badge from "../../components/qms/Badge";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import { reviewsApi } from "../../api/qmsApi";

/* ─── types ──────────────────────────────────────────────────────── */

interface ReviewRow {
  [key: string]: unknown;
  id: string;
  date: string;
  topic: string;
  chairman: string;
  participants: string;
  decisions: string;
  status: string;
}

/* ─── ISO 13485 п.5.6.2 input data cards ─────────────────────────── */

interface InputCard {
  title: string;
  icon: React.ReactNode;
  color: string;
}

const inputDataCards: InputCard[] = [
  { title: "Результаты аудитов",            icon: <ClipboardList size={24} />, color: "#4A90E8" },
  { title: "Обратная связь потребителей",    icon: <Users size={24} />,         color: "#A06AE8" },
  { title: "Функционирование процессов",    icon: <Activity size={24} />,      color: "#2DD4A8" },
  { title: "Соответствие продукции",        icon: <CheckCircle2 size={24} />,  color: "#2DD4A8" },
  { title: "Статус CAPA",                   icon: <RefreshCw size={24} />,     color: "#E8A830" },
  { title: "Изменения СМК",                 icon: <FileText size={24} />,      color: "#E87040" },
  { title: "Рекомендации по улучшению",     icon: <TrendingUp size={24} />,    color: "#2DD4A8" },
  { title: "Новые требования",              icon: <AlertTriangle size={24} />, color: "#F06060" },
];

/* ─── decisions & actions ─────────────────────────────────────────── */

interface DecisionRow {
  [key: string]: unknown;
  action: string;
  responsible: string;
  status: string;
}

/* ─── helpers ────────────────────────────────────────────────────── */

const meetingStatusBadge = (s: string) => {
  switch (s) {
    case "Проведено":     return <Badge color="#2DD4A8">{s}</Badge>;
    case "Запланировано": return <Badge color="#4A90E8">{s}</Badge>;
    case "Отменено":      return <Badge color="#F06060">{s}</Badge>;
    default:              return <Badge>{s}</Badge>;
  }
};

const decisionStatusBadge = (s: string) => {
  switch (s) {
    case "Выполнено":  return <Badge color="#2DD4A8">{s}</Badge>;
    case "В работе":   return <Badge color="#E8A830">{s}</Badge>;
    case "Назначено":  return <Badge color="#4A90E8">{s}</Badge>;
    case "Просрочено": return <Badge color="#F06060">{s}</Badge>;
    default:           return <Badge>{s}</Badge>;
  }
};

/* ─── table columns ──────────────────────────────────────────────── */

const reviewColumns = [
  {
    key: "id",
    label: "ID",
    width: "90px",
    render: (r: ReviewRow) => (
      <span className="font-mono text-asvo-accent">{r.id}</span>
    ),
  },
  { key: "date",         label: "Дата",         render: (r: ReviewRow) => <span className="text-asvo-text-mid">{r.date}</span> },
  { key: "topic",        label: "Тема",         render: (r: ReviewRow) => <span className="text-asvo-text">{r.topic}</span> },
  { key: "chairman",     label: "Председатель", render: (r: ReviewRow) => <span className="text-asvo-text-mid">{r.chairman}</span> },
  { key: "participants", label: "Участники",    align: "center" as const, render: (r: ReviewRow) => <span className="text-asvo-text-mid">{r.participants}</span> },
  { key: "decisions",    label: "Решений",      align: "center" as const, render: (r: ReviewRow) => <span className="text-asvo-text-mid">{r.decisions}</span> },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: ReviewRow) => meetingStatusBadge(r.status),
  },
];

const decisionColumns = [
  { key: "action",      label: "Действие",     render: (r: DecisionRow) => <span className="text-asvo-text">{r.action}</span> },
  { key: "responsible", label: "Ответственный", render: (r: DecisionRow) => <span className="text-asvo-text-mid">{r.responsible}</span> },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: DecisionRow) => decisionStatusBadge(r.status),
  },
];

/* ─── component ──────────────────────────────────────────────────── */

const ReviewPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reviewsRes, statsRes] = await Promise.all([
          reviewsApi.getAll(),
          reviewsApi.getStats(),
        ]);

        const rows: ReviewRow[] = (reviewsRes.rows ?? []).map((r: any) => ({
          id: r.id ?? r.number ?? "",
          date: r.date ?? "",
          topic: r.topic ?? r.title ?? "",
          chairman: r.chairman ?? "",
          participants: r.participants ?? "\u2014",
          decisions: r.decisions ?? "\u2014",
          status: r.status ?? "",
        }));

        const actions: DecisionRow[] = (statsRes.actions ?? statsRes.decisions ?? []).map(
          (a: any) => ({
            action: a.action ?? a.description ?? "",
            responsible: a.responsible ?? a.assignedTo ?? "",
            status: a.status ?? "",
          }),
        );

        setReviews(rows);
        setDecisions(actions);
        setStats(statsRes);
      } catch (err: any) {
        console.error("ReviewPage fetch error:", err);
        setError(err?.response?.data?.message ?? err?.message ?? "Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ─── loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-asvo-accent" size={36} />
          <span className="text-asvo-text-dim text-sm">Загрузка данных...</span>
        </div>
      </div>
    );
  }

  /* ─── error state ─── */
  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="bg-asvo-surface-2 border border-red-500/30 rounded-xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="mx-auto text-red-400" size={36} />
          <h2 className="text-lg font-semibold text-asvo-text">Ошибка загрузки</h2>
          <p className="text-sm text-asvo-text-mid">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-asvo-accent/20 text-asvo-accent rounded-lg text-sm hover:bg-asvo-accent/30 transition"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  /* ─── KPI values from stats ─── */
  const totalMeetings = stats?.totalMeetings ?? stats?.total ?? reviews.length;
  const totalDecisions = stats?.totalDecisions ?? stats?.decisions ?? decisions.length;
  const openActions = stats?.openActions ?? stats?.open ?? 0;
  const completionRate = stats?.completionRate ?? stats?.completed ?? "0%";

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-asvo-blue-dim rounded-lg">
            <BarChart3 className="text-[#4A90E8]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">
              Анализ со стороны руководства
            </h1>
            <p className="text-asvo-text-dim text-sm">
              ISO 13485 &sect;5.6 &mdash; Management Review
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего совещаний",    value: totalMeetings,  icon: <BarChart3 size={18} />,    color: "#4A90E8" },
          { label: "Решений",            value: totalDecisions, icon: <CheckCircle2 size={18} />, color: "#2DD4A8" },
          { label: "Открытых действий",  value: openActions,    icon: <RefreshCw size={18} />,    color: "#E8A830" },
          { label: "Выполнено",          value: completionRate, icon: <TrendingUp size={18} />,   color: "#2DD4A8" },
        ]}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <ActionBtn variant="primary" icon={<Plus size={15} />}>
          + Новое совещание
        </ActionBtn>
        <ActionBtn variant="secondary" icon={<FileText size={15} />}>
          Протокол
        </ActionBtn>
      </div>

      {/* Meetings table */}
      <SectionTitle>Совещания руководства</SectionTitle>
      <DataTable<ReviewRow> columns={reviewColumns} data={reviews} />

      {/* ISO 13485 п.5.6.2 — Input data */}
      <SectionTitle>ISO 13485 п.5.6.2 — Входные данные анализа</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {inputDataCards.map((c) => (
          <div
            key={c.title}
            className="bg-asvo-surface-2 rounded-xl p-4 border border-asvo-border flex items-start gap-3"
          >
            <span style={{ color: c.color }} className="mt-0.5 shrink-0">
              {c.icon}
            </span>
            <span className="text-sm text-asvo-text leading-snug">{c.title}</span>
          </div>
        ))}
      </div>

      {/* Decisions & actions */}
      <SectionTitle>Решения и действия</SectionTitle>
      <DataTable<DecisionRow> columns={decisionColumns} data={decisions} />
    </div>
  );
};

export default ReviewPage;

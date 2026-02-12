import React from "react";
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
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import DataTable from "../../components/qms/DataTable";
import Badge from "../../components/qms/Badge";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";

/* ─── mock data — meetings table ─────────────────────────────────────── */

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

const reviewData: ReviewRow[] = [
  { id: "MR-008", date: "05.02.2026", topic: "Анализ СМК Q4-2025",  chairman: "Холтобин А.", participants: "8",  decisions: "5", status: "Проведено" },
  { id: "MR-007", date: "15.11.2025", topic: "Анализ СМК Q3-2025",  chairman: "Холтобин А.", participants: "7",  decisions: "6", status: "Проведено" },
  { id: "MR-006", date: "10.08.2025", topic: "Анализ СМК Q2-2025",  chairman: "Холтобин А.", participants: "6",  decisions: "4", status: "Проведено" },
  { id: "MR-005", date: "01.05.2025", topic: "Анализ СМК Q1-2025",  chairman: "Холтобин А.", participants: "8",  decisions: "7", status: "Проведено" },
  { id: "MR-009", date: "15.05.2026", topic: "Анализ СМК Q1-2026",  chairman: "Холтобин А.", participants: "\u2014", decisions: "\u2014", status: "Запланировано" },
];

/* ─── ISO 13485 п.5.6.2 input data cards ─────────────────────────────── */

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

/* ─── decisions & actions ─────────────────────────────────────────────── */

interface DecisionRow {
  [key: string]: unknown;
  action: string;
  responsible: string;
  status: string;
}

const decisionsData: DecisionRow[] = [
  { action: "Обновить процедуру закупок",             responsible: "Холтобин А.",   status: "В работе" },
  { action: "Провести дополнительный аудит SUP-012",  responsible: "Костюков И.",   status: "Выполнено" },
  { action: "Пересмотреть матрицу рисков",            responsible: "Яровой Е.",     status: "Назначено" },
  { action: "Обучение новых сотрудников ОТК",         responsible: "Омельченко А.", status: "Просрочено" },
];

/* ─── helpers ────────────────────────────────────────────────────────── */

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

/* ─── table columns ──────────────────────────────────────────────────── */

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

/* ─── component ──────────────────────────────────────────────────────── */

const ReviewPage: React.FC = () => (
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
        { label: "Всего совещаний",    value: 8,     icon: <BarChart3 size={18} />,    color: "#4A90E8" },
        { label: "Решений",            value: 24,    icon: <CheckCircle2 size={18} />, color: "#2DD4A8" },
        { label: "Открытых действий",  value: 6,     icon: <RefreshCw size={18} />,    color: "#E8A830" },
        { label: "Выполнено",          value: "85%", icon: <TrendingUp size={18} />,   color: "#2DD4A8" },
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
    <DataTable<ReviewRow> columns={reviewColumns} data={reviewData} />

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
    <DataTable<DecisionRow> columns={decisionColumns} data={decisionsData} />
  </div>
);

export default ReviewPage;

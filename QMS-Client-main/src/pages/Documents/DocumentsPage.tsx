/**
 * DocumentsPage.tsx — Реестр документов СМК
 * Dark theme (ASVO-QMS design system)
 * ISO 13485 §4.2.4 — Управление документацией
 */

import React, { useState } from "react";
import { FileText, Plus, Search, Upload, ChevronRight } from "lucide-react";

import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";
import TabBar from "../../components/qms/TabBar";
import DataTable from "../../components/qms/DataTable";
import ActionBtn from "../../components/qms/ActionBtn";

/* ─── Types ──────────────────────────────────────────────────── */

interface DocRow {
  [key: string]: unknown;
  id: string;
  title: string;
  type: string;
  version: string;
  status: string;
  owner: string;
  reviewDate: string;
}

type StatusKey = "Действующий" | "Согласование" | "Пересмотр" | "Черновик";
type TypeKey =
  | "Руководство"
  | "Процедура"
  | "Инструкция"
  | "Форма"
  | "План"
  | "Спецификация"
  | "Внешний";

/* ─── Mappings ───────────────────────────────────────────────── */

const STATUS_DOT: Record<StatusKey, "accent" | "blue" | "amber" | "grey"> = {
  "Действующий": "accent",
  "Согласование": "blue",
  "Пересмотр": "amber",
  "Черновик": "grey",
};

const TYPE_BADGE_COLOR: Record<TypeKey, string> = {
  "Руководство": "#4A90E8",
  "Процедура": "#2DD4A8",
  "Инструкция": "#A06AE8",
  "Форма": "#E8A830",
  "План": "#4A90E8",
  "Спецификация": "#E87040",
  "Внешний": "#3A4E62",
};

/* ─── Mock data ──────────────────────────────────────────────── */

const DOCUMENTS: DocRow[] = [
  {
    id: "DOC-001",
    title: "Руководство по качеству",
    type: "Руководство",
    version: "v3.2",
    status: "Действующий",
    owner: "Холтобин А.",
    reviewDate: "15.06.2026",
  },
  {
    id: "DOC-015",
    title: "СТО-015 Управление NC",
    type: "Процедура",
    version: "v2.1",
    status: "Действующий",
    owner: "Костюков И.",
    reviewDate: "20.03.2026",
  },
  {
    id: "DOC-023",
    title: "RI-023 Пайка SMD",
    type: "Инструкция",
    version: "v1.4",
    status: "Действующий",
    owner: "Омельченко А.",
    reviewDate: "10.04.2026",
  },
  {
    id: "DOC-045",
    title: "СТО-045 Калибровка",
    type: "Процедура",
    version: "v2.0",
    status: "Пересмотр",
    owner: "Яровой Е.",
    reviewDate: "01.02.2026",
  },
  {
    id: "DOC-067",
    title: "Форма протокола NC",
    type: "Форма",
    version: "v1.2",
    status: "Действующий",
    owner: "Костюков И.",
    reviewDate: "30.07.2026",
  },
  {
    id: "DOC-089",
    title: "План аудитов 2026",
    type: "План",
    version: "v1.0",
    status: "Согласование",
    owner: "Холтобин А.",
    reviewDate: "\u2014",
  },
  {
    id: "DOC-102",
    title: "Спецификация DEXA-200",
    type: "Спецификация",
    version: "v1.1",
    status: "Черновик",
    owner: "Чирков И.",
    reviewDate: "\u2014",
  },
  {
    id: "DOC-115",
    title: "IEC 62368-1:2023",
    type: "Внешний",
    version: "\u2014",
    status: "Действующий",
    owner: "\u2014",
    reviewDate: "\u2014",
  },
];

/* ─── Tabs definition ────────────────────────────────────────── */

const TABS = [
  { key: "all", label: "Все" },
  { key: "policy", label: "Политики" },
  { key: "procedure", label: "Процедуры" },
  { key: "instruction", label: "Инструкции" },
  { key: "form", label: "Формы" },
  { key: "record", label: "Записи" },
  { key: "external", label: "Внешние" },
];

const TAB_TYPE_MAP: Record<string, string | null> = {
  all: null,
  policy: "Руководство",
  procedure: "Процедура",
  instruction: "Инструкция",
  form: "Форма",
  record: "План",
  external: "Внешний",
};

/* ─── Workflow steps ─────────────────────────────────────────── */

const WORKFLOW_STEPS = [
  "Черновик",
  "Согласование",
  "Утверждение",
  "Действующий",
  "Пересмотр",
];
const ACTIVE_STEP = 3; // "Действующий" — 0-indexed

/* ─── Statistics ─────────────────────────────────────────────── */

const STATS = [
  { label: "Всего документов", value: 247, color: "#4A90E8" },
  { label: "Действующих", value: 189, color: "#2DD4A8" },
  { label: "На согласовании", value: 12, color: "#E8A830" },
  { label: "Просрочен пересмотр", value: 5, color: "#F06060" },
];

/* ─── Table columns ──────────────────────────────────────────── */

const columns = [
  {
    key: "id",
    label: "ID",
    width: "100px",
    render: (row: DocRow) => (
      <span className="font-mono text-[12px] font-bold text-asvo-accent">
        {row.id}
      </span>
    ),
  },
  {
    key: "title",
    label: "Название",
    render: (row: DocRow) => (
      <span className="font-medium text-asvo-text">{row.title}</span>
    ),
  },
  {
    key: "type",
    label: "Тип",
    width: "130px",
    render: (row: DocRow) => {
      const badgeColor = TYPE_BADGE_COLOR[row.type as TypeKey] ?? "#3A4E62";
      return (
        <Badge color={badgeColor} bg={`${badgeColor}22`}>
          {row.type}
        </Badge>
      );
    },
  },
  {
    key: "version",
    label: "Версия",
    width: "80px",
    render: (row: DocRow) => (
      <span className="font-mono text-[12px] text-asvo-text-mid">
        {row.version}
      </span>
    ),
  },
  {
    key: "status",
    label: "Статус",
    width: "140px",
    render: (row: DocRow) => {
      const dotColor = STATUS_DOT[row.status as StatusKey] ?? "grey";
      return (
        <span className="flex items-center gap-2">
          <StatusDot color={dotColor} />
          <span className="text-asvo-text text-[13px]">{row.status}</span>
        </span>
      );
    },
  },
  {
    key: "owner",
    label: "Владелец",
    width: "130px",
    render: (row: DocRow) => (
      <span className="text-asvo-text-mid text-[12px]">{row.owner}</span>
    ),
  },
  {
    key: "reviewDate",
    label: "Пересмотр",
    width: "110px",
    render: (row: DocRow) => (
      <span className="text-asvo-text-mid text-[12px]">{row.reviewDate}</span>
    ),
  },
  {
    key: "actions",
    label: "Действия",
    width: "50px",
    align: "center" as const,
    render: () => (
      <ChevronRight size={14} className="text-asvo-text-dim mx-auto" />
    ),
  },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                     */
/* ═══════════════════════════════════════════════════════════════ */

export const DocumentsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  /* Filter documents by tab + search */
  const typeFilter = TAB_TYPE_MAP[activeTab] ?? null;
  const filtered = DOCUMENTS.filter((doc) => {
    if (typeFilter && doc.type !== typeFilter) return false;
    if (
      search &&
      !doc.id.toLowerCase().includes(search.toLowerCase()) &&
      !doc.title.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-accent/15 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-asvo-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">
              Документы СМК
            </h1>
            <p className="text-[12px] text-asvo-text-dim">
              ISO 13485 &sect;4.2.4 &mdash; Управление документацией
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={14} />}>
            Создать документ
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<Upload size={14} />}>
            Импорт
          </ActionBtn>
        </div>
      </div>

      {/* ── Search + Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по коду, названию..."
            className="w-full pl-9 pr-3 py-2 bg-asvo-surface border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent/40 transition-colors"
          />
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── Data table ────────────────────────────────────────── */}
      <DataTable<DocRow>
        columns={columns}
        data={filtered}
      />

      {/* ── Workflow + Statistics row ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workflow card */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-asvo-text mb-4">
            Процесс согласования документа
          </h3>
          <div className="flex items-center justify-between px-2">
            {WORKFLOW_STEPS.map((step, i) => {
              const isCompleted = i < ACTIVE_STEP;
              const isActive = i === ACTIVE_STEP;
              const isFuture = i > ACTIVE_STEP;

              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        isActive
                          ? "bg-asvo-accent text-asvo-bg shadow-[0_0_10px_rgba(45,212,168,0.35)]"
                          : isCompleted
                          ? "border-2 border-asvo-accent text-asvo-accent bg-transparent"
                          : "border-2 border-asvo-border text-asvo-text-dim bg-transparent"
                      }`}
                    >
                      {isCompleted ? "\u2713" : i + 1}
                    </div>
                    <span
                      className={`text-[10px] whitespace-nowrap ${
                        isActive
                          ? "text-asvo-accent font-semibold"
                          : isCompleted
                          ? "text-asvo-accent"
                          : isFuture
                          ? "text-asvo-text-dim"
                          : "text-asvo-text-mid"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1.5 rounded ${
                        i < ACTIVE_STEP
                          ? "bg-asvo-accent"
                          : "bg-asvo-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-[11px] text-asvo-text-dim mt-4">
            Документ DOC-089 &laquo;План аудитов 2026&raquo; ожидает
            согласования от руководителя отдела качества
          </p>
        </div>

        {/* Statistics card */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-asvo-text mb-4">
            Статистика
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-bold leading-none"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] text-asvo-text-dim mt-1.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

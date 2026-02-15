/**
 * DesignControlPage.tsx — Design Control Registry
 * Dark theme, ASVO-QMS design system
 * ISO 13485 \u00a77.3 — Design and Development Control
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass, Plus, Download, RefreshCw,
  AlertTriangle, Activity, CheckCircle2, Clock, Search, Filter,
} from "lucide-react";

import { designApi } from "../../api/qms/design";

import Badge from "../../components/qms/Badge";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import DataTable from "../../components/qms/DataTable";
import StatusDot from "../../components/qms/StatusDot";

import CreateDesignModal from "./CreateDesignModal";
import DesignDetailModal from "./DesignDetailModal";

/* --- Types --- */

interface DesignProject {
  id: number;
  number: string;
  title: string;
  description?: string;
  productType: string;
  regulatoryClass?: string;
  status: DesignStatus;
  owner?: { name: string; surname: string } | null;
  teamLead?: { name: string; surname: string } | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  progress?: number;
  createdAt: string;
}

type DesignStatus =
  | "PLANNING"
  | "INPUTS_DEFINED"
  | "DESIGN_ACTIVE"
  | "REVIEW"
  | "VERIFICATION"
  | "VALIDATION"
  | "TRANSFER"
  | "CLOSED"
  | "ON_HOLD";

/* --- Constants & Maps --- */

const STATUS_LABELS: Record<DesignStatus, string> = {
  PLANNING:       "Планирование",
  INPUTS_DEFINED: "Входные данные",
  DESIGN_ACTIVE:  "Разработка",
  REVIEW:         "Анализ",
  VERIFICATION:   "Верификация",
  VALIDATION:     "Валидация",
  TRANSFER:       "Трансфер",
  CLOSED:         "Закрыт",
  ON_HOLD:        "Приостановлен",
};

const STATUS_DOT: Record<DesignStatus, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey" | "green"> = {
  PLANNING:       "blue",
  INPUTS_DEFINED: "purple",
  DESIGN_ACTIVE:  "orange",
  REVIEW:         "amber",
  VERIFICATION:   "amber",
  VALIDATION:     "purple",
  TRANSFER:       "green",
  CLOSED:         "accent",
  ON_HOLD:        "grey",
};

const STATUS_VARIANT: Record<DesignStatus, string> = {
  PLANNING:       "audit",
  INPUTS_DEFINED: "risk",
  DESIGN_ACTIVE:  "design",
  REVIEW:         "capa",
  VERIFICATION:   "training",
  VALIDATION:     "risk",
  TRANSFER:       "sop",
  CLOSED:         "closed",
  ON_HOLD:        "component",
};

const ALL_STATUSES: DesignStatus[] = [
  "PLANNING", "INPUTS_DEFINED", "DESIGN_ACTIVE", "REVIEW",
  "VERIFICATION", "VALIDATION", "TRANSFER", "CLOSED", "ON_HOLD",
];

/* --- Helpers --- */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

function formatPerson(person: { name: string; surname: string } | null | undefined): string {
  if (!person) return "\u2014";
  return `${person.surname} ${person.name.charAt(0)}.`;
}

/* --- Component --- */

export const DesignControlPage: React.FC = () => {
  /* -- State -- */
  const [data, setData] = useState<DesignProject[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailProjectId, setDetailProjectId] = useState<number | null>(null);

  /* -- Fetch data -- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const [listResult, statsResult] = await Promise.all([
        designApi.getAll(params),
        designApi.getStats().catch(() => null),
      ]);
      setData(listResult.rows ?? listResult ?? []);
      setStats(statsResult);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки проектов");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -- KPI values -- */
  const totalProjects = stats?.total ?? data.length;
  const activeProjects = stats?.active ?? data.filter(d =>
    !["CLOSED", "ON_HOLD"].includes(d.status)
  ).length;
  const inVerification = stats?.inVerification ?? data.filter(d =>
    d.status === "VERIFICATION"
  ).length;
  const closedProjects = stats?.closed ?? data.filter(d =>
    d.status === "CLOSED"
  ).length;

  const kpiItems = [
    { label: "Всего проектов",  value: totalProjects,  color: "#4A90E8",  icon: <Compass size={18} /> },
    { label: "Активных",        value: activeProjects,  color: "#E89030",  icon: <Activity size={18} /> },
    { label: "На верификации",  value: inVerification,  color: "#A06AE8",  icon: <Clock size={18} /> },
    { label: "Закрыто",         value: closedProjects,  color: "#2DD4A8",  icon: <CheckCircle2 size={18} /> },
  ];

  /* -- Table columns -- */
  const columns = [
    {
      key: "number",
      label: "Номер",
      width: "120px",
      render: (row: DesignProject) => (
        <span className="font-mono text-[12px] font-bold text-asvo-accent">
          {row.number}
        </span>
      ),
    },
    {
      key: "title",
      label: "Название",
      render: (row: DesignProject) => (
        <span className="text-asvo-text text-[13px]">{row.title}</span>
      ),
    },
    {
      key: "productType",
      label: "Тип изделия",
      width: "140px",
      render: (row: DesignProject) => (
        <span className="text-asvo-text-mid text-[12px]">{row.productType || "\u2014"}</span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      width: "150px",
      render: (row: DesignProject) => {
        const variant = STATUS_VARIANT[row.status] || "closed";
        return (
          <span className="flex items-center gap-2">
            <StatusDot color={STATUS_DOT[row.status] || "grey"} />
            <Badge variant={variant as any}>
              {STATUS_LABELS[row.status] || row.status}
            </Badge>
          </span>
        );
      },
    },
    {
      key: "owner",
      label: "Ответственный",
      width: "150px",
      render: (row: DesignProject) => (
        <span className="text-asvo-text-mid text-[12px]">
          {formatPerson(row.teamLead ?? row.owner)}
        </span>
      ),
    },
    {
      key: "plannedEnd",
      label: "Плановый срок",
      width: "120px",
      render: (row: DesignProject) => {
        const isOverdue =
          row.plannedEnd &&
          new Date(row.plannedEnd) < new Date() &&
          row.status !== "CLOSED";
        return (
          <span className={`text-[12px] ${isOverdue ? "text-red-400 font-semibold" : "text-asvo-text-mid"}`}>
            {formatDate(row.plannedEnd)}
          </span>
        );
      },
    },
    {
      key: "progress",
      label: "Прогресс",
      width: "100px",
      render: (row: DesignProject) => {
        const pct = row.progress ?? 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-asvo-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-asvo-accent transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-asvo-text-dim w-8 text-right">{pct}%</span>
          </div>
        );
      },
    },
  ];

  /* -- Render -- */
  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(232,144,48,0.12)] rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#E89030]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Design Control</h1>
            <p className="text-sm text-asvo-text-dim">ISO 13485 \u00a77.3 -- Управление проектированием и разработкой</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ActionBtn variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
            Новый проект
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={16} />}>
            Экспорт
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchData}>
            Обновить
          </ActionBtn>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiRow items={kpiItems} />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или номеру..."
            className="w-full pl-10 pr-4 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text focus:border-asvo-accent/50 focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">Все статусы</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
          <span className="text-red-400 text-[13px] flex-1">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchData}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-16">
          <Compass className="mx-auto text-asvo-text-dim mb-3" size={48} />
          <p className="text-asvo-text-mid text-[14px]">Проекты не найдены</p>
          <p className="text-asvo-text-dim text-[12px] mt-1">
            Создайте первый проект проектирования и разработки
          </p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && data.length > 0 && (
        <DataTable<DesignProject>
          columns={columns}
          data={data}
          onRowClick={(row) => setDetailProjectId(row.id)}
        />
      )}

      {/* Design Phases Workflow */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={16} className="text-[#E89030]" />
          <h3 className="text-sm font-semibold text-asvo-text">Design Control Workflow (ISO 13485 \u00a77.3)</h3>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Планирование",  ref: "\u00a77.3.2", status: "PLANNING" },
            { label: "Входные",        ref: "\u00a77.3.3", status: "INPUTS_DEFINED" },
            { label: "Выходные",       ref: "\u00a77.3.4", status: "DESIGN_ACTIVE" },
            { label: "Анализ",         ref: "\u00a77.3.5", status: "REVIEW" },
            { label: "Верификация",    ref: "\u00a77.3.6", status: "VERIFICATION" },
            { label: "Валидация",      ref: "\u00a77.3.7", status: "VALIDATION" },
            { label: "Трансфер",       ref: "\u00a77.3.8", status: "TRANSFER" },
            { label: "Изменения",      ref: "\u00a77.3.9", status: "CLOSED" },
          ].map((phase) => {
            const count = data.filter(d => d.status === phase.status).length;
            const active = count > 0;
            return (
              <div
                key={phase.ref}
                className={`rounded-lg p-3 text-center border ${
                  active
                    ? "bg-[rgba(232,144,48,0.08)] border-[#E89030]/30"
                    : "bg-asvo-surface border-asvo-border"
                }`}
              >
                <div className={`text-[10px] font-medium ${active ? "text-[#E89030]" : "text-asvo-text-dim"}`}>
                  {phase.ref}
                </div>
                <div className={`text-sm font-bold mt-1 ${active ? "text-[#E89030]" : "text-asvo-text-dim"}`}>
                  {phase.label}
                </div>
                {active && (
                  <div className="text-[11px] font-semibold text-[#E89030] mt-1">{count}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateDesignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />

      {detailProjectId !== null && (
        <DesignDetailModal
          projectId={detailProjectId}
          isOpen={true}
          onClose={() => setDetailProjectId(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
};

export default DesignControlPage;

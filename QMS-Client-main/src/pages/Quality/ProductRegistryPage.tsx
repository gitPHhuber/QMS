import React, { useState } from "react";
import {
  Package,
  Plus,
  Download,
  Boxes,
  Lightbulb,
  AlertTriangle,
  Shield,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";

/* ───── types ───── */

type RiskClass = "1" | "2A" | "2B" | "3";
type ProductionStatus = "DEVELOPMENT" | "PROTOTYPE" | "PILOT" | "SERIAL" | "DISCONTINUED";

interface ProductRow {
  [key: string]: unknown;
  code: string;
  name: string;
  model: string;
  ru: string;
  riskClass: RiskClass;
  status: ProductionStatus;
  validUntil: string;
}

/* ───── mock data ───── */

const PRODUCTS: ProductRow[] = [
  { code: "PRD-001", name: "Денситометр рентгеновский", model: "DEXA-PRO 3000", ru: "РЗН-2025-12345", riskClass: "2B", status: "SERIAL",      validUntil: "15.06.2030" },
  { code: "PRD-002", name: "Рентгеновский аппарат",     model: "AXR-100",       ru: "РЗН-2024-67890", riskClass: "2B", status: "SERIAL",      validUntil: "20.12.2029" },
  { code: "PRD-003", name: "ПО для денситометрии",       model: "DensiSoft v3",  ru: "\u2014",         riskClass: "1",  status: "DEVELOPMENT", validUntil: "\u2014" },
  { code: "PRD-004", name: "Калибровочный фантом",       model: "PHANTOM-ESP",   ru: "\u2014",         riskClass: "1",  status: "PROTOTYPE",   validUntil: "\u2014" },
  { code: "PRD-005", name: "Мобильный денситометр",      model: "DEXA-MOBILE",   ru: "\u2014",         riskClass: "2A", status: "DEVELOPMENT", validUntil: "\u2014" },
];

/* ───── badge helpers ───── */

const riskClassColors: Record<RiskClass, { color: string; bg: string }> = {
  "1":  { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  "2A": { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  "2B": { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  "3":  { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
};

const statusColors: Record<ProductionStatus, { color: string; bg: string }> = {
  DEVELOPMENT:   { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  PROTOTYPE:     { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
  PILOT:         { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  SERIAL:        { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  DISCONTINUED:  { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
};

const statusLabels: Record<ProductionStatus, string> = {
  DEVELOPMENT:  "Разработка",
  PROTOTYPE:    "Прототип",
  PILOT:        "Опытная",
  SERIAL:       "Серийный",
  DISCONTINUED: "Снят",
};

/* ───── table columns ───── */

const columns = [
  {
    key: "code",
    label: "Код",
    width: "100px",
    render: (r: ProductRow) => <span className="font-mono text-asvo-accent">{r.code}</span>,
  },
  {
    key: "name",
    label: "Наименование",
    render: (r: ProductRow) => <span className="text-asvo-text">{r.name}</span>,
  },
  {
    key: "model",
    label: "Модель",
    render: (r: ProductRow) => <span className="text-asvo-text-mid">{r.model}</span>,
  },
  {
    key: "ru",
    label: "РУ",
    render: (r: ProductRow) => <span className="text-asvo-text-mid">{r.ru}</span>,
  },
  {
    key: "riskClass",
    label: "Класс риска",
    align: "center" as const,
    render: (r: ProductRow) => {
      const c = riskClassColors[r.riskClass];
      return <Badge color={c.color} bg={c.bg}>{r.riskClass}</Badge>;
    },
  },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: ProductRow) => {
      const c = statusColors[r.status];
      return <Badge color={c.color} bg={c.bg}>{statusLabels[r.status]}</Badge>;
    },
  },
  {
    key: "validUntil",
    label: "Действует до",
    render: (r: ProductRow) => <span className="text-asvo-text-mid">{r.validUntil}</span>,
  },
];

/* ───── risk class distribution data ───── */

interface RiskDistribution {
  label: string;
  count: number;
  color: string;
}

const riskDistribution: RiskDistribution[] = [
  { label: "1",  count: 2, color: "#2DD4A8" },
  { label: "2\u0430", count: 1, color: "#4A90E8" },
  { label: "2\u0431", count: 2, color: "#E8A830" },
  { label: "3",  count: 0, color: "#F06060" },
];

const maxCount = Math.max(...riskDistribution.map((d) => d.count), 1);

/* ════════════════════════════════════════════════════ */

const ProductRegistryPage: React.FC = () => {
  const [_selected] = useState<string | null>(null);

  /* ───── KPI ───── */
  const kpis = [
    { label: "Всего изделий",     value: 5,  icon: <Package size={18} />,       color: "#4A90E8" },
    { label: "В серии",           value: 2,  icon: <Boxes size={18} />,          color: "#2DD4A8" },
    { label: "В разработке",      value: 2,  icon: <Lightbulb size={18} />,      color: "#E8A830" },
    { label: "Истекает РУ",       value: 0,  icon: <AlertTriangle size={18} />,  color: "#F06060" },
    { label: "Класс риска 2б+",   value: 2,  icon: <Shield size={18} />,         color: "#A06AE8" },
  ];

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(74,144,232,0.12)" }}>
            <Package className="text-[#4A90E8]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">
              Реестр медицинских изделий
            </h1>
            <p className="text-asvo-text-dim text-sm">
              ISO 13485 &sect;7.5.3 &mdash; Идентификация и прослеживаемость
            </p>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3">
        <ActionBtn variant="primary" icon={<Plus size={15} />}>
          + Новое изделие
        </ActionBtn>
        <ActionBtn variant="secondary" icon={<Download size={15} />}>
          Экспорт
        </ActionBtn>
      </div>

      {/* ── KPI Row ── */}
      <KpiRow items={kpis} />

      {/* ── Data table ── */}
      <DataTable<ProductRow> columns={columns} data={PRODUCTS} />

      {/* ── Risk class distribution ── */}
      <Card>
        <SectionTitle>Распределение по классам риска</SectionTitle>
        <div className="space-y-3">
          {riskDistribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-[13px] text-asvo-text-mid w-10 text-right font-medium">
                {d.label}
              </span>
              <div className="flex-1 h-6 bg-asvo-surface rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all"
                  style={{
                    width: `${maxCount > 0 ? (d.count / maxCount) * 100 : 0}%`,
                    backgroundColor: d.color,
                    minWidth: d.count > 0 ? "24px" : "0px",
                  }}
                />
              </div>
              <span className="text-[13px] text-asvo-text font-semibold w-6 text-right">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProductRegistryPage;

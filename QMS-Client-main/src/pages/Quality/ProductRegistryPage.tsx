import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Download,
  Boxes,
  Lightbulb,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import { productsApi } from "../../api/qmsApi";

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

/* ───── risk class distribution helpers ───── */

interface RiskDistribution {
  label: string;
  count: number;
  color: string;
}

const riskDistributionColors: Record<string, { label: string; color: string }> = {
  "1":  { label: "1",  color: "#2DD4A8" },
  "2A": { label: "2а", color: "#4A90E8" },
  "2B": { label: "2б", color: "#E8A830" },
  "3":  { label: "3",  color: "#F06060" },
};

/* ════════════════════════════════════════════════════ */

const ProductRegistryPage: React.FC = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, statsRes] = await Promise.all([
          productsApi.getAll(),
          productsApi.getStats(),
        ]);

        setProducts(productsRes.rows ?? []);
        setStats(statsRes);
      } catch (err: any) {
        console.error("ProductRegistryPage: failed to fetch data", err);
        setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ───── KPI (derived from stats or fallback to 0) ───── */
  const kpis = [
    { label: "Всего изделий",     value: stats?.totalProducts   ?? 0, icon: <Package size={18} />,       color: "#4A90E8" },
    { label: "В серии",           value: stats?.inSerial        ?? 0, icon: <Boxes size={18} />,          color: "#2DD4A8" },
    { label: "В разработке",      value: stats?.inDevelopment   ?? 0, icon: <Lightbulb size={18} />,      color: "#E8A830" },
    { label: "Истекает РУ",       value: stats?.expiringRu      ?? 0, icon: <AlertTriangle size={18} />,  color: "#F06060" },
    { label: "Класс риска 2б+",   value: stats?.highRiskClass   ?? 0, icon: <Shield size={18} />,         color: "#A06AE8" },
  ];

  /* ───── risk class distribution (derived from stats) ───── */
  const riskDistribution: RiskDistribution[] = (["1", "2A", "2B", "3"] as const).map((key) => ({
    label: riskDistributionColors[key].label,
    count: stats?.riskClassDistribution?.[key] ?? 0,
    color: riskDistributionColors[key].color,
  }));

  const maxCount = Math.max(...riskDistribution.map((d) => d.count), 1);

  /* ───── loading state ───── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-asvo-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#4A90E8]" size={32} />
          <span className="text-asvo-text-dim text-sm">Загрузка реестра изделий...</span>
        </div>
      </div>
    );
  }

  /* ───── error state ───── */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-asvo-bg">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="text-[#F06060]" size={32} />
          <span className="text-asvo-text font-medium">Не удалось загрузить данные</span>
          <span className="text-asvo-text-dim text-sm max-w-md">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-asvo-text text-sm hover:border-asvo-accent/50 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

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
      <DataTable<ProductRow> columns={columns} data={products} />

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

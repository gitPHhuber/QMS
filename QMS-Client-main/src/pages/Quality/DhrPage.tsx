import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PackageX,
  Archive,
  Loader2,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import { dhrApi } from "../../api/qmsApi";
import { useExport } from "../../hooks/useExport";
import CreateDhrModal from "./CreateDhrModal";
import DhrDetailModal from "./DhrDetailModal";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type DhrStatus =
  | "IN_PRODUCTION"
  | "QC_PENDING"
  | "QC_PASSED"
  | "QC_FAILED"
  | "RELEASED"
  | "ON_HOLD"
  | "QUARANTINE"
  | "RETURNED"
  | "RECALLED";

interface DhrRow {
  [key: string]: unknown;
  id: number;
  dhrNumber: string;
  product: string;
  serialNumber: string;
  lotNumber: string;
  status: DhrStatus;
  qcDate: string;
  releaseDate: string;
}

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<DhrStatus, { label: string; color: string; bg: string }> = {
  IN_PRODUCTION: { label: "Производство",   color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  QC_PENDING:    { label: "Ожидает ОТК",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  QC_PASSED:     { label: "ОТК пройден",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  QC_FAILED:     { label: "ОТК не пройден", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  RELEASED:      { label: "Выпущено",       color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  ON_HOLD:       { label: "Задержано",       color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  QUARANTINE:    { label: "Карантин",        color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  RETURNED:      { label: "Возврат",         color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
  RECALLED:      { label: "Отзыв",           color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const DhrPage: React.FC = () => {
  const { exporting, doExport } = useExport();

  /* ---- state ---- */

  const [dhrs, setDhrs] = useState<DhrRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailDhrId, setDetailDhrId] = useState<number | null>(null);

  /* ---- fetch data ---- */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dhrsRes, statsRes] = await Promise.all([
        dhrApi.getAll(),
        dhrApi.getStats(),
      ]);

      const rows: DhrRow[] = (dhrsRes.rows ?? []).map((r: any) => ({
        id: r.id,
        dhrNumber: r.dhrNumber ?? r.number ?? `DHR-${r.id}`,
        product: r.product ?? r.productName ?? "",
        serialNumber: r.serialNumber ?? "",
        lotNumber: r.lotNumber ?? "",
        status: r.status ?? "IN_PRODUCTION",
        qcDate: r.qcDate
          ? new Date(r.qcDate).toLocaleDateString("ru-RU")
          : "\u2014",
        releaseDate: r.releaseDate
          ? new Date(r.releaseDate).toLocaleDateString("ru-RU")
          : "\u2014",
      }));

      setDhrs(rows);
      setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to load DHR data:", err);
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---- columns for DataTable ---- */

  const columns = [
    {
      key: "dhrNumber",
      label: "DHR #",
      width: "130px",
      render: (r: DhrRow) => (
        <span className="font-mono text-asvo-accent">{r.dhrNumber}</span>
      ),
    },
    {
      key: "product",
      label: "Изделие",
      render: (r: DhrRow) => <span className="text-asvo-text">{r.product}</span>,
    },
    {
      key: "serialNumber",
      label: "Серийный №",
      render: (r: DhrRow) => <span className="text-asvo-text-mid">{r.serialNumber}</span>,
    },
    {
      key: "lotNumber",
      label: "Партия",
      render: (r: DhrRow) => <span className="text-asvo-text-mid">{r.lotNumber}</span>,
    },
    {
      key: "status",
      label: "Статус",
      align: "center" as const,
      render: (r: DhrRow) => {
        const s = STATUS_CFG[r.status] ?? STATUS_CFG.IN_PRODUCTION;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "qcDate",
      label: "Дата ОТК",
      render: (r: DhrRow) => <span className="text-asvo-text-mid">{r.qcDate}</span>,
    },
    {
      key: "releaseDate",
      label: "Дата выпуска",
      render: (r: DhrRow) => <span className="text-asvo-text-mid">{r.releaseDate}</span>,
    },
  ];

  /* ---- loading state ---- */

  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка записей DHR...</span>
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
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
            <ClipboardList size={22} style={{ color: "#4A90E8" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Записи об устройствах (DHR)</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;7.5.9 &mdash; Прослеживаемость</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>+ Новый DHR</ActionBtn>
          <ActionBtn variant="secondary" icon={exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} disabled={exporting} onClick={() => doExport("dhr", "DHR_Export")}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего DHR",    value: stats?.totalDhrs    ?? 0, icon: <ClipboardList size={18} />, color: "#4A90E8" },
          { label: "Выпущено",     value: stats?.released     ?? 0, icon: <CheckCircle2 size={18} />,  color: "#2DD4A8" },
          { label: "Ожидает ОТК",  value: stats?.qcPending    ?? 0, icon: <Clock size={18} />,         color: "#E8A830" },
          { label: "Задержано",    value: stats?.onHold       ?? 0, icon: <Archive size={18} />,       color: "#E8A830" },
          { label: "Отозвано",     value: stats?.recalled     ?? 0, icon: <PackageX size={18} />,      color: "#F06060" },
        ]}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={dhrs}
        onRowClick={(row: DhrRow) => setDetailDhrId(row.id)}
      />

      {/* Modals */}
      <CreateDhrModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />

      {detailDhrId !== null && (
        <DhrDetailModal
          dhrId={detailDhrId}
          isOpen={detailDhrId !== null}
          onClose={() => setDetailDhrId(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
};

export default DhrPage;

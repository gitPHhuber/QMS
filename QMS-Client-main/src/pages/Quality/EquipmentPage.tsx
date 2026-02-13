import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  CalendarClock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Boxes,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import DataTable from "../../components/qms/DataTable";
import Badge from "../../components/qms/Badge";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";
import Timeline from "../../components/qms/Timeline";
import { equipmentApi } from "../../api/qmsApi";

/* ─── types ─────────────────────────────────────────────────────────── */

interface EquipmentRow {
  [key: string]: unknown;
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  serial: string;
  lastCalibration: string;
  nextCalibration: string;
  daysUntil: number;
  status: string;
}

/* ─── helpers ────────────────────────────────────────────────────────── */

const daysBadge = (d: number) => {
  if (d <= 7)  return <Badge color="#F06060">{d}&nbsp;дн.</Badge>;
  if (d <= 30) return <Badge color="#E8A830">{d}&nbsp;дн.</Badge>;
  return <Badge color="#2DD4A8">{d}&nbsp;дн.</Badge>;
};

const statusBadge = (s: string) => {
  switch (s) {
    case "Исправно":    return <Badge color="#2DD4A8">{s}</Badge>;
    case "Калибровка":  return <Badge color="#E8A830">{s}</Badge>;
    case "Просрочено":  return <Badge color="#F06060">{s}</Badge>;
    default:            return <Badge>{s}</Badge>;
  }
};

/* ─── columns ────────────────────────────────────────────────────────── */

const columns = [
  {
    key: "id",
    label: "ID",
    width: "90px",
    render: (r: EquipmentRow) => (
      <span className="font-mono text-asvo-accent">{r.id}</span>
    ),
  },
  { key: "name",            label: "Название",             render: (r: EquipmentRow) => <span className="text-asvo-text">{r.name}</span> },
  { key: "type",            label: "Тип",                  render: (r: EquipmentRow) => <span className="text-asvo-text-mid">{r.type}</span> },
  { key: "manufacturer",    label: "Производитель",        render: (r: EquipmentRow) => <span className="text-asvo-text-mid">{r.manufacturer}</span> },
  { key: "serial",          label: "Серийный номер",       render: (r: EquipmentRow) => <span className="font-mono text-asvo-text-mid text-[12px]">{r.serial}</span> },
  { key: "lastCalibration", label: "Послед. калибровка",   render: (r: EquipmentRow) => <span className="text-asvo-text-mid">{r.lastCalibration}</span> },
  { key: "nextCalibration", label: "Следующая калибровка", render: (r: EquipmentRow) => <span className="text-asvo-text-mid">{r.nextCalibration}</span> },
  {
    key: "daysUntil",
    label: "Дней до калибр.",
    align: "center" as const,
    render: (r: EquipmentRow) => daysBadge(r.daysUntil),
  },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: EquipmentRow) => statusBadge(r.status),
  },
];

/* ─── component ──────────────────────────────────────────────────────── */

const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [calibrationHistory, setCalibrationHistory] = useState<
    { date: string; title: string; color: string }[]
  >([]);

  /* ─── fetch data on mount ─── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [equipmentRes, statsRes] = await Promise.all([
          equipmentApi.getAll(),
          equipmentApi.getStats(),
        ]);

        const rows: EquipmentRow[] = (equipmentRes.rows || []).map(
          (item: any) => ({
            id: item.equipmentNumber || item.id,
            name: item.name,
            type: item.type || "",
            manufacturer: item.manufacturer || "",
            serial: item.serialNumber || item.serial || "",
            lastCalibration: item.lastCalibration
              ? new Date(item.lastCalibration).toLocaleDateString("ru-RU")
              : "—",
            nextCalibration: item.nextCalibration
              ? new Date(item.nextCalibration).toLocaleDateString("ru-RU")
              : "—",
            daysUntil: item.daysUntilCalibration ?? item.daysUntil ?? 0,
            status: item.status || "",
            _raw: item,
          })
        );

        setEquipment(rows);
        setStats(statsRes);

        /* auto-select first row for passport / history */
        if (rows.length > 0) {
          loadEquipmentDetail((rows[0] as any)._raw?.id ?? rows[0].id);
        }
      } catch (err: any) {
        console.error("Equipment fetch error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Не удалось загрузить данные оборудования"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ─── load single equipment detail ─── */
  const loadEquipmentDetail = async (id: number | string) => {
    try {
      const detail = await equipmentApi.getOne(Number(id));
      setSelected(detail);

      const history = (detail.calibrations || []).map((c: any) => ({
        date: c.calibrationDate
          ? new Date(c.calibrationDate).toLocaleDateString("ru-RU")
          : "",
        title: `Калибровка выполнена. Результат: ${c.result || "годен"}. Отклонение: ${c.deviation || "—"}`,
        color: c.result === "не годен" ? "#F06060" : "#2DD4A8",
      }));

      setCalibrationHistory(history);
    } catch (err) {
      console.error("Equipment detail error:", err);
    }
  };

  /* ─── passport rows from selected ─── */
  const passportRows: { label: string; value: string }[] = selected
    ? [
        { label: "Название", value: selected.name || "—" },
        {
          label: "Инв.номер",
          value: selected.equipmentNumber || selected.id?.toString() || "—",
        },
        { label: "Серийный", value: selected.serialNumber || selected.serial || "—" },
        { label: "Производитель", value: selected.manufacturer || "—" },
        {
          label: "Дата ввода",
          value: selected.commissionedAt
            ? new Date(selected.commissionedAt).toLocaleDateString("ru-RU")
            : selected.createdAt
              ? new Date(selected.createdAt).toLocaleDateString("ru-RU")
              : "—",
        },
        { label: "Расположение", value: selected.location || "—" },
        { label: "Класс точности", value: selected.accuracyClass || "—" },
        {
          label: "Ответственный",
          value: selected.responsiblePerson
            ? `${selected.responsiblePerson.surname || ""} ${selected.responsiblePerson.name || ""}`.trim()
            : "—",
        },
      ]
    : [];

  /* ─── KPI values from stats ─── */
  const totalEquipment = stats?.totalEquipment ?? stats?.total ?? 0;
  const onCalibration = stats?.onCalibration ?? stats?.calibrating ?? 0;
  const overdue = stats?.overdue ?? stats?.overdueCalibration ?? 0;
  const operational = stats?.operational ?? stats?.active ?? totalEquipment - onCalibration - overdue;

  /* ─── loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-asvo-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-asvo-text-dim text-sm">Загрузка данных оборудования…</span>
        </div>
      </div>
    );
  }

  /* ─── error state ─── */
  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="bg-asvo-surface-2 border border-red-500/30 rounded-xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="mx-auto text-[#F06060]" size={32} />
          <h2 className="text-lg font-semibold text-asvo-text">Ошибка загрузки</h2>
          <p className="text-asvo-text-mid text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-asvo-accent text-white rounded-lg text-sm hover:opacity-90 transition"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-asvo-amber-dim rounded-lg">
            <Wrench className="text-[#E8A830]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">
              Оборудование и калибровка
            </h1>
            <p className="text-asvo-text-dim text-sm">
              ISO 13485 &sect;7.6 &mdash; Управление оборудованием для мониторинга и измерений
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего оборудования", value: totalEquipment, icon: <Boxes size={18} />,          color: "#4A90E8" },
          { label: "На калибровке",       value: onCalibration,  icon: <Clock size={18} />,           color: "#E8A830" },
          { label: "Просрочено",          value: overdue,        icon: <AlertTriangle size={18} />,   color: "#F06060" },
          { label: "Исправно",            value: operational,    icon: <CheckCircle2 size={18} />,    color: "#2DD4A8" },
        ]}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <ActionBtn variant="primary" icon={<Plus size={15} />} disabled title="Будет доступно в следующем спринте">
          + Добавить оборудование
        </ActionBtn>
        <ActionBtn variant="secondary" color="#4A90E8" icon={<CalendarClock size={15} />} disabled title="Будет доступно в следующем спринте">
          График калибровки
        </ActionBtn>
        <ActionBtn variant="secondary" icon={<Download size={15} />} disabled title="Будет доступно в следующем спринте">
          Экспорт
        </ActionBtn>
      </div>

      {/* Data table */}
      <SectionTitle>Реестр оборудования</SectionTitle>
      <DataTable<EquipmentRow> columns={columns} data={equipment} />

      {/* Passport + History for selected equipment */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Equipment passport */}
          <Card>
            <SectionTitle>
              Паспорт оборудования &mdash;{" "}
              {selected.equipmentNumber || selected.id}
            </SectionTitle>
            <div className="divide-y divide-asvo-border">
              {passportRows.map((r) => (
                <div key={r.label} className="flex justify-between py-2.5 text-[13px]">
                  <span className="text-asvo-text-mid">{r.label}</span>
                  <span className="text-asvo-text font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Calibration history */}
          <Card>
            <SectionTitle>
              История калибровок &mdash;{" "}
              {selected.equipmentNumber || selected.id}
            </SectionTitle>
            {calibrationHistory.length > 0 ? (
              <Timeline events={calibrationHistory} />
            ) : (
              <p className="text-asvo-text-dim text-sm">Нет записей о калибровках</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;

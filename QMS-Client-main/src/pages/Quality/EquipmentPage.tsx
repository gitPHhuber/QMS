import React, { useState } from "react";
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

/* ─── mock data ─────────────────────────────────────────────────────── */

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

const equipmentData: EquipmentRow[] = [
  { id: "EQ-001", name: "Мультиметр Fluke 87V",      type: "Измерительное",   manufacturer: "Fluke",     serial: "FL87V-2024-0891",  lastCalibration: "10.01.2026", nextCalibration: "10.07.2026", daysUntil: 149,  status: "Исправно" },
  { id: "EQ-005", name: "Осциллограф Rigol DS1104",   type: "Измерительное",   manufacturer: "Rigol",     serial: "RG-DS1104-2891",   lastCalibration: "15.12.2025", nextCalibration: "15.06.2026", daysUntil: 124,  status: "Исправно" },
  { id: "EQ-008", name: "Паяльная станция JBC CD-2BE", type: "Технологическое", manufacturer: "JBC",       serial: "JBC-CD2-7721",     lastCalibration: "01.01.2026", nextCalibration: "01.04.2026", daysUntil: 49,   status: "Исправно" },
  { id: "EQ-012", name: "Паяльная станция JBC DM-2A",  type: "Технологическое", manufacturer: "JBC",       serial: "JBC-DM2-4402",     lastCalibration: "15.09.2025", nextCalibration: "15.03.2026", daysUntil: 32,   status: "Калибровка" },
  { id: "EQ-015", name: "Микроскоп Olympus SZX7",     type: "Контрольное",     manufacturer: "Olympus",   serial: "OL-SZX7-1823",     lastCalibration: "01.06.2025", nextCalibration: "01.12.2025", daysUntil: -72,  status: "Просрочено" },
  { id: "EQ-020", name: "Климатическая камера",        type: "Испытательное",   manufacturer: "Binder",    serial: "BN-MK56-3301",     lastCalibration: "01.08.2025", nextCalibration: "01.02.2026", daysUntil: -10,  status: "Просрочено" },
  { id: "EQ-025", name: "Весы аналитические",          type: "Измерительное",   manufacturer: "Sartorius", serial: "SAR-224-8812",      lastCalibration: "20.01.2026", nextCalibration: "20.07.2026", daysUntil: 159,  status: "Исправно" },
];

/* ─── passport (EQ-001) ─────────────────────────────────────────────── */

const passportRows: { label: string; value: string }[] = [
  { label: "Название",        value: "Мультиметр Fluke 87V" },
  { label: "Инв.номер",       value: "EQ-001" },
  { label: "Серийный",        value: "FL87V-2024-0891" },
  { label: "Производитель",   value: "Fluke Corporation" },
  { label: "Дата ввода",      value: "15.03.2024" },
  { label: "Расположение",    value: "Лаборатория ОТК" },
  { label: "Класс точности",  value: "0.05%" },
  { label: "Ответственный",   value: "Чирков И.А." },
];

/* ─── calibration history ────────────────────────────────────────────── */

const calibrationHistory = [
  { date: "10.01.2026", title: "Калибровка выполнена. Результат: годен. Отклонение: 0.02%", color: "#2DD4A8" },
  { date: "10.07.2025", title: "Калибровка выполнена. Результат: годен. Отклонение: 0.03%", color: "#2DD4A8" },
  { date: "10.01.2025", title: "Калибровка выполнена. Результат: годен. Отклонение: 0.01%", color: "#2DD4A8" },
];

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
  const [_selected] = useState<string | null>("EQ-001");

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
          { label: "Всего оборудования", value: 56, icon: <Boxes size={18} />,          color: "#4A90E8" },
          { label: "На калибровке",       value: 4,  icon: <Clock size={18} />,           color: "#E8A830" },
          { label: "Просрочено",          value: 2,  icon: <AlertTriangle size={18} />,   color: "#F06060" },
          { label: "Исправно",            value: 48, icon: <CheckCircle2 size={18} />,    color: "#2DD4A8" },
        ]}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <ActionBtn variant="primary" icon={<Plus size={15} />}>
          + Добавить оборудование
        </ActionBtn>
        <ActionBtn variant="secondary" color="#4A90E8" icon={<CalendarClock size={15} />}>
          График калибровки
        </ActionBtn>
        <ActionBtn variant="secondary" icon={<Download size={15} />}>
          Экспорт
        </ActionBtn>
      </div>

      {/* Data table */}
      <SectionTitle>Реестр оборудования</SectionTitle>
      <DataTable<EquipmentRow> columns={columns} data={equipmentData} />

      {/* Passport + History for EQ-001 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Equipment passport */}
        <Card>
          <SectionTitle>Паспорт оборудования &mdash; EQ-001</SectionTitle>
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
          <SectionTitle>История калибровок &mdash; EQ-001</SectionTitle>
          <Timeline events={calibrationHistory} />
        </Card>
      </div>
    </div>
  );
};

export default EquipmentPage;

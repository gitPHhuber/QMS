// ═══════════════════════════════════════════════════════════════
// MODULE 9: Equipment (Оборудование)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  SURFACE,
  BORDER,
  TEXT,
  TEXT_DIM,
  RED,
  AMBER,
  BLUE,
  PURPLE,
} from "../constants";
import {
  Badge,
  StatusDot,
  Card,
  Table,
  SectionTitle,
  ActionBtn,
  KpiRow,
  Timeline,
} from "../shared";

export const EquipmentModule: React.FC = () => {
  const items = [
    { id: "EQ-001", name: "Весы аналит. XS205", type: "Измерительное", sn: "SN-X205-4421", location: "Лаб. ВК", status: "Калиброван", lastCal: "15.08.2025", nextCal: "15.02.2026", daysLeft: 4 as number | null },
    { id: "EQ-005", name: "Штангенциркуль МК-150", type: "Измерительное", sn: "SN-MK150-112", location: "Цех", status: "Калиброван", lastCal: "20.08.2025", nextCal: "20.02.2026", daysLeft: 9 },
    { id: "EQ-010", name: "Паяльная станция JBC", type: "Производственное", sn: "SN-JBC-7788", location: "Цех", status: "Квалифицирован", lastCal: "—", nextCal: "—", daysLeft: null },
    { id: "EQ-015", name: "Мультиметр Fluke 87V", type: "Измерительное", sn: "SN-FL87V-901", location: "Лаб. ВК", status: "Просрочена калибровка", lastCal: "01.02.2025", nextCal: "01.02.2026", daysLeft: -10 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F527}", label: "Единиц", value: "42", color: BLUE },
        { icon: "\u2705", label: "Калибровано", value: "35", color: ACCENT },
        { icon: "\u23F0", label: "Скоро калибр.", value: "4", color: AMBER },
        { icon: "\u{1F534}", label: "Просрочено", value: "3", color: RED },
      ]} />

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn primary>{"\uFF0B"} Добавить оборудование</ActionBtn>
        <ActionBtn>{"\u{1F4CB}"} Расписание калибровок</ActionBtn>
        <ActionBtn>{"\u{1F4C4}"} Паспорта</ActionBtn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Наименование", "Тип", "S/N", "Расположение", "Статус", "Послед. калибр.", "Следующая", "Дней"]}
          rows={items.map(e => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{e.id}</span>,
            <span style={{ fontWeight: 500 }}>{e.name}</span>,
            <Badge color={e.type === "Измерительное" ? BLUE : PURPLE}>{e.type}</Badge>,
            <span style={{ fontFamily: "monospace", fontSize: 11, color: TEXT_DIM }}>{e.sn}</span>,
            e.location,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={e.status === "Просрочена калибровка" ? RED : e.status === "Калиброван" ? ACCENT : BLUE} />
              {e.status}
            </span>,
            e.lastCal,
            e.nextCal,
            e.daysLeft !== null ? (
              <Badge color={e.daysLeft < 0 ? RED : e.daysLeft < 7 ? AMBER : ACCENT}>
                {e.daysLeft}д
              </Badge>
            ) : "—",
          ])}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Паспорт оборудования — EQ-001</SectionTitle>
          {[
            ["Наименование", "Весы аналитические XS205"],
            ["Производитель", "Mettler Toledo"],
            ["Серийный номер", "SN-X205-4421"],
            ["Дата ввода", "15.03.2024"],
            ["Расположение", "Лаборатория входного контроля"],
            ["Периодичность калибровки", "6 месяцев"],
            ["Допустимая погрешность", "\u00B10.1 мг"],
            ["Ответственный", "Омельченко А.Г."],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", borderBottom: `1px solid ${BORDER}22`,
              fontSize: 12,
            }}>
              <span style={{ color: TEXT_DIM }}>{k}</span>
              <span style={{ color: TEXT, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>История калибровок — EQ-001</SectionTitle>
          <Timeline events={[
            { date: "15.08.2025", title: "Калибровка — ГОДЕН", desc: "Погрешность: 0.05 мг (норма \u00B10.1)", color: ACCENT },
            { date: "15.02.2025", title: "Калибровка — ГОДЕН", desc: "Погрешность: 0.07 мг", color: ACCENT },
            { date: "15.08.2024", title: "Калибровка — ГОДЕН", desc: "Погрешность: 0.04 мг", color: ACCENT },
            { date: "15.03.2024", title: "IQ/OQ — ПРОЙДЕНО", desc: "Первичная квалификация", color: BLUE },
          ]} />
        </Card>
      </div>
    </div>
  );
};

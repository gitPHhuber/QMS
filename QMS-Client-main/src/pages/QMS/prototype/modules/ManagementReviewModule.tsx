// ═══════════════════════════════════════════════════════════════
// MODULE 10: Management Review (Анализ руководства)
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
} from "../shared";

export const ManagementReviewModule: React.FC = () => {
  const reviews = [
    { id: "MR-004", period: "H2 2025", date: "15.01.2026", status: "Утверждён", chair: "Холтобин А.В.", decisions: 8, actions: 12 },
    { id: "MR-003", period: "H1 2025", date: "10.07.2025", status: "Утверждён", chair: "Холтобин А.В.", decisions: 6, actions: 9 },
    { id: "MR-005", period: "H1 2026", date: "—", status: "Планируется", chair: "Холтобин А.В.", decisions: 0, actions: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F4CB}", label: "Проведено", value: "4", sub: "за 2 года", color: BLUE },
        { icon: "\u2705", label: "Решений", value: "26", color: ACCENT },
        { icon: "\u{1F504}", label: "Действий", value: "38", sub: "14 открытых", color: AMBER },
        { icon: "\u{1F4C5}", label: "Следующий", value: "Июль", sub: "2026", color: PURPLE },
      ]} />

      <ActionBtn primary>{"\uFF0B"} Создать анализ</ActionBtn>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Период", "Дата", "Статус", "Председатель", "Решений", "Действий"]}
          rows={reviews.map(r => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{r.id}</span>,
            <span style={{ fontWeight: 500 }}>{r.period}</span>,
            r.date,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={r.status === "Утверждён" ? ACCENT : BLUE} /> {r.status}
            </span>,
            r.chair,
            r.decisions || "—",
            r.actions || "—",
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>Входные данные (ISO 13485, п.5.6.2)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Результаты аудитов", value: "11 аудитов, 23 замечания", icon: "\u{1F4CB}", status: ACCENT },
            { label: "Обратная связь от потребителей", value: "2 рекламации, NPS 78", icon: "\u{1F4AC}", status: AMBER },
            { label: "Результативность процессов", value: "KPI достигнуты на 85%", icon: "\u{1F4CA}", status: ACCENT },
            { label: "Статус CAPA", value: "42 закрыто, 15 открыто", icon: "\u{1F504}", status: AMBER },
            { label: "Изменения нормативных требований", value: "ГОСТ Р ИСО 13485-2024", icon: "\u{1F4DC}", status: BLUE },
            { label: "Результаты управления рисками", value: "6 высоких рисков", icon: "\u26A0\uFE0F", status: RED },
            { label: "Рекомендации по улучшению", value: "12 предложений", icon: "\u{1F4A1}", status: PURPLE },
            { label: "Статус обучения персонала", value: "78% соответствие", icon: "\u{1F465}", status: AMBER },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", gap: 10, padding: 10,
              background: SURFACE, borderRadius: 8,
              border: `1px solid ${BORDER}`, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{item.label}</div>
                <div style={{ fontSize: 11, color: item.status, marginTop: 2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Решения и действия — MR-004</SectionTitle>
        {[
          { title: "Обновить процедуру закупок", status: "Выполнено", owner: "Костюков И.А.", due: "01.03.2026" },
          { title: "Провести повторную квалификацию SUP-005", status: "В работе", owner: "Омельченко А.Г.", due: "15.03.2026" },
          { title: "Разработать план обучения на 2026", status: "В работе", owner: "Яровой Е.А.", due: "01.04.2026" },
          { title: "Пересмотреть риск-реестр", status: "Не начато", owner: "Холтобин А.В.", due: "01.05.2026" },
        ].map(a => (
          <div key={a.title} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${BORDER}22`,
          }}>
            <div>
              <div style={{ fontSize: 13, color: TEXT }}>{a.title}</div>
              <div style={{ fontSize: 11, color: TEXT_DIM }}>{a.owner} \u2192 {a.due}</div>
            </div>
            <Badge color={a.status === "Выполнено" ? ACCENT : a.status === "В работе" ? AMBER : TEXT_DIM}>{a.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODULE 4: CAPA
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  ACCENT_DIM,
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
  ProgressBar,
  Card,
  Table,
  SectionTitle,
  ActionBtn,
  KpiRow,
} from "../shared";

export const CapaModule: React.FC = () => {
  const capas = [
    { id: "CAPA-048", type: "CA", title: "Пересмотр процедуры входного контроля", source: "NC-089", status: "Планирование", due: "28.02.2026", owner: "Костюков И.А.", pct: 15 },
    { id: "CAPA-047", type: "PA", title: "Внедрение чек-листа для монтажа", source: "Риск R-012", status: "Реализация", due: "20.02.2026", owner: "Омельченко А.Г.", pct: 65 },
    { id: "CAPA-045", type: "CA", title: "Замена поставщика PCB", source: "NC-082", status: "Верификация", due: "15.02.2026", owner: "Холтобин А.В.", pct: 90 },
    { id: "CAPA-042", type: "CA", title: "Обновление IQ/OQ для пресса", source: "Аудит #11", status: "Закрыто", due: "01.02.2026", owner: "Костюков И.А.", pct: 100 },
  ];

  const statColor: Record<string, string> = { "Планирование": BLUE, "Реализация": AMBER, "Верификация": PURPLE, "Закрыто": ACCENT };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F4CB}", label: "Активных", value: "15", color: BLUE },
        { icon: "\u23F0", label: "Просрочено", value: "5", color: RED },
        { icon: "\u2705", label: "Эффективных", value: "87%", sub: "за 12 мес.", color: ACCENT },
        { icon: "\u{1F4C6}", label: "Ср. срок закрытия", value: "18д", color: AMBER },
      ]} />

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn primary>{"\uFF0B"} Новое CAPA</ActionBtn>
        <ActionBtn>{"\u{1F4CA}"} Отчёт эффективности</ActionBtn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Тип", "Описание", "Источник", "Статус", "Срок", "Ответственный", "Прогресс"]}
          rows={capas.map(c => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{c.id}</span>,
            <Badge color={c.type === "CA" ? RED : AMBER}>{c.type === "CA" ? "Коррект." : "Предупр."}</Badge>,
            c.title,
            <span style={{ color: TEXT_DIM, fontSize: 12 }}>{c.source}</span>,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={statColor[c.status]} /> {c.status}
            </span>,
            <span style={{ color: c.status !== "Закрыто" && c.due < "15.02.2026" ? RED : TEXT }}>{c.due}</span>,
            c.owner,
            <div style={{ minWidth: 80 }}>
              <ProgressBar value={c.pct} color={c.pct === 100 ? ACCENT : c.pct > 50 ? BLUE : AMBER} />
              <div style={{ fontSize: 10, textAlign: "right", color: TEXT_DIM, marginTop: 2 }}>{c.pct}%</div>
            </div>,
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>8D Workflow</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, textAlign: "center" }}>
          {[
            { d: "D1", label: "Команда", done: true },
            { d: "D2", label: "Описание", done: true },
            { d: "D3", label: "Сдерживание", done: true },
            { d: "D4", label: "Root Cause", done: true },
            { d: "D5", label: "Корр. действия", done: false },
            { d: "D6", label: "Внедрение", done: false },
            { d: "D7", label: "Предупреждение", done: false },
            { d: "D8", label: "Закрытие", done: false },
          ].map(step => (
            <div key={step.d} style={{
              background: step.done ? ACCENT_DIM : SURFACE,
              border: `1px solid ${step.done ? ACCENT + "44" : BORDER}`,
              borderRadius: 8, padding: "8px 4px",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: step.done ? ACCENT : TEXT_DIM }}>{step.d}</div>
              <div style={{ fontSize: 10, color: step.done ? TEXT : TEXT_DIM, marginTop: 2 }}>{step.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

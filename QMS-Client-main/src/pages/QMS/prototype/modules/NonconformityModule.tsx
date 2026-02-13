// ═══════════════════════════════════════════════════════════════
// MODULE 3: Nonconformities (Несоответствия)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  ACCENT_DIM,
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

export const NonconformityModule: React.FC = () => {
  const ncs = [
    { id: "NC-089", title: "Дефект пайки разъёма J4", source: "Входной контроль", severity: "Критическое", status: "Открыто", product: "DEXA-100", date: "11.02.2026", assignee: "Омельченко А.Г." },
    { id: "NC-088", title: "Отклонение размеров корпуса", source: "Производство", severity: "Значительное", status: "Расследование", product: "DEXA-100", date: "09.02.2026", assignee: "Костюков И.А." },
    { id: "NC-087", title: "Несоответствие маркировки", source: "Аудит", severity: "Незначительное", status: "CAPA создано", product: "DEXA-200", date: "05.02.2026", assignee: "Холтобин А.В." },
    { id: "NC-085", title: "Поставка некомплект", source: "Склад", severity: "Значительное", status: "Закрыто", product: "—", date: "28.01.2026", assignee: "Костюков И.А." },
  ];

  const sevColor: Record<string, string> = { "Критическое": RED, "Значительное": AMBER, "Незначительное": BLUE };
  const statColor: Record<string, string> = { "Открыто": RED, "Расследование": AMBER, "CAPA создано": PURPLE, "Закрыто": ACCENT };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F534}", label: "Открыто", value: "8", color: RED },
        { icon: "\u{1F7E1}", label: "Расследование", value: "5", color: AMBER },
        { icon: "\u{1F7E3}", label: "CAPA создано", value: "12", color: PURPLE },
        { icon: "\u2705", label: "Закрыто (мес.)", value: "23", color: ACCENT },
      ]} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <ActionBtn primary>{"\uFF0B"} Зарегистрировать NC</ActionBtn>
        <div style={{ display: "flex", gap: 8 }}>
          <ActionBtn small>Фильтр по источнику</ActionBtn>
          <ActionBtn small>Фильтр по продукту</ActionBtn>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Описание", "Источник", "Критичность", "Статус", "Продукт", "Дата", "Ответственный"]}
          rows={ncs.map(n => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{n.id}</span>,
            n.title,
            <Badge color={BLUE}>{n.source}</Badge>,
            <Badge color={sevColor[n.severity]}>{n.severity}</Badge>,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={statColor[n.status]} /> {n.status}
            </span>,
            n.product,
            n.date,
            n.assignee,
          ])}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Workflow несоответствия</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { step: "1. Регистрация", desc: "Описание, фото, классификация", active: true },
              { step: "2. Расследование", desc: "Root cause analysis (5 Why, Ishikawa)", active: true },
              { step: "3. Диспозиция", desc: "Решение: ремонт / утилизация / отклонение", active: false },
              { step: "4. CAPA", desc: "Корректирующее / предупреждающее действие", active: false },
              { step: "5. Верификация", desc: "Проверка эффективности", active: false },
              { step: "6. Закрытие", desc: "Финальное подтверждение УК", active: false },
            ].map(s => (
              <div key={s.step} style={{
                display: "flex", gap: 12, padding: "8px 12px",
                background: s.active ? ACCENT_DIM : "transparent",
                borderRadius: 8, borderLeft: `3px solid ${s.active ? ACCENT : BORDER}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.active ? ACCENT : TEXT }}>{s.step}</div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Pareto: источники NC (30 дн.)</SectionTitle>
          {[
            { label: "Входной контроль", count: 12, pct: 40 },
            { label: "Производство", count: 8, pct: 27 },
            { label: "Аудиты", count: 5, pct: 17 },
            { label: "Рекламации", count: 3, pct: 10 },
            { label: "Склад", count: 2, pct: 6 },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: TEXT }}>{item.label}</span>
                <span style={{ color: TEXT_DIM }}>{item.count} ({item.pct}%)</span>
              </div>
              <ProgressBar value={item.pct * 2.5} color={item.pct > 30 ? RED : item.pct > 15 ? AMBER : BLUE} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

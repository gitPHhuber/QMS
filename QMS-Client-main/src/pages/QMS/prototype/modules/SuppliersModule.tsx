// ═══════════════════════════════════════════════════════════════
// MODULE 6: Suppliers (Поставщики)
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

export const SuppliersModule: React.FC = () => {
  const suppliers = [
    { id: "SUP-001", name: "\u041E\u041E\u041E \"\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u041A\u043E\u043C\"", type: "Критический", score: 92, status: "Одобрен", nextEval: "01.06.2026", products: "PCB, разъёмы" },
    { id: "SUP-005", name: "\u0410\u041E \"\u041C\u0435\u0434\u041F\u043B\u0430\u0441\u0442\"", type: "Критический", score: 78, status: "Условно одобрен", nextEval: "01.03.2026", products: "Корпуса, крепёж" },
    { id: "SUP-012", name: "\u041E\u041E\u041E \"\u0422\u0435\u0445\u043D\u043E\u041B\u0430\u0431\"", type: "Основной", score: 85, status: "Одобрен", nextEval: "01.09.2026", products: "Датчики" },
    { id: "SUP-018", name: "\u0418\u041F \u0421\u0438\u0434\u043E\u0440\u043E\u0432", type: "Вспомогательный", score: 65, status: "На пересмотре", nextEval: "15.02.2026", products: "Упаковка" },
  ];

  const scoreColor = (s: number) => s >= 80 ? ACCENT : s >= 60 ? AMBER : RED;
  const statusColor: Record<string, string> = { "Одобрен": ACCENT, "Условно одобрен": AMBER, "На пересмотре": BLUE, "Приостановлен": RED };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F3ED}", label: "Всего", value: "28", color: BLUE },
        { icon: "\u2705", label: "Одобрено", value: "19", color: ACCENT },
        { icon: "\u26A0\uFE0F", label: "Условно", value: "6", color: AMBER },
        { icon: "\u{1F4CA}", label: "Ср. балл", value: "81", color: ACCENT },
        { icon: "\u{1F4C5}", label: "Оценка скоро", value: "4", color: AMBER },
      ]} />

      <ActionBtn primary>{"\uFF0B"} Добавить поставщика</ActionBtn>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Наименование", "Тип", "Рейтинг", "Статус", "Продукция", "След. оценка"]}
          rows={suppliers.map(s => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{s.id}</span>,
            <span style={{ fontWeight: 500 }}>{s.name}</span>,
            <Badge color={s.type === "Критический" ? RED : s.type === "Основной" ? BLUE : TEXT_DIM}>{s.type}</Badge>,
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 80 }}>
              <ProgressBar value={s.score} color={scoreColor(s.score)} height={8} />
              <span style={{ fontWeight: 700, color: scoreColor(s.score), fontSize: 13, minWidth: 28 }}>{s.score}</span>
            </div>,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={statusColor[s.status]} /> {s.status}
            </span>,
            <span style={{ fontSize: 12 }}>{s.products}</span>,
            s.nextEval,
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>Критерии оценки поставщика</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Качество", weight: "30%", icon: "\u{1F3AF}" },
            { label: "Доставка", weight: "20%", icon: "\u{1F69A}" },
            { label: "Документация", weight: "20%", icon: "\u{1F4C4}" },
            { label: "Коммуникация", weight: "10%", icon: "\u{1F4AC}" },
            { label: "Цена", weight: "10%", icon: "\u{1F4B0}" },
            { label: "Соответствие", weight: "10%", icon: "\u2705" },
          ].map(c => (
            <div key={c.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: 10, background: SURFACE, borderRadius: 8, border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.label}</div>
                <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>{c.weight}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

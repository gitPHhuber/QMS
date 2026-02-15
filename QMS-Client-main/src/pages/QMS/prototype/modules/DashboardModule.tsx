// ═══════════════════════════════════════════════════════════════
// MODULE 1: Dashboard (Дашборд)
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
  ProgressBar,
  Card,
  SectionTitle,
  KpiRow,
  Timeline,
} from "../shared";

export const DashboardModule: React.FC = () => {
  const riskMatrix = [
    [1, 2, 3, 4, 5],
    [2, 4, 6, 8, 10],
    [3, 6, 9, 12, 15],
    [4, 8, 12, 16, 20],
    [5, 10, 15, 20, 25],
  ];
  const riskData: Record<string, number> = { "3": 2, "6": 1, "9": 3, "12": 1, "15": 1, "16": 1, "20": 1 };
  const getCellColor = (v: number) => {
    if (v <= 4) return "#22c55e";
    if (v <= 9) return "#f59e0b";
    if (v <= 16) return "#f97316";
    return "#ef4444";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F4C4}", label: "Документы", value: "247", sub: "12 на согласовании", color: BLUE },
        { icon: "\u26A0\uFE0F", label: "Несоответствия", value: "8", sub: "3 критических", color: RED },
        { icon: "\u{1F504}", label: "CAPA", value: "15", sub: "5 просрочено", color: AMBER },
        { icon: "\u2705", label: "Аудиты", value: "92%", sub: "готовность", color: ACCENT },
        { icon: "\u{1F4CA}", label: "Риски", value: "34", sub: "6 высоких", color: PURPLE },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Risk Matrix mini */}
        <Card>
          <SectionTitle>Матрица рисков (ISO 14971)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "auto repeat(5, 1fr)", gap: 2, fontSize: 11 }}>
            <div />
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ textAlign: "center", color: TEXT_DIM, padding: 4, fontSize: 10 }}>S{s}</div>
            ))}
            {[...riskMatrix].reverse().map((row, ri) => (
              <React.Fragment key={`rm-${ri}`}>
                <div style={{ color: TEXT_DIM, padding: 4, display: "flex", alignItems: "center", fontSize: 10 }}>P{5-ri}</div>
                {row.map((v, ci) => (
                  <div key={`${ri}-${ci}`} style={{
                    background: getCellColor(v) + "33",
                    border: `1px solid ${getCellColor(v)}44`,
                    borderRadius: 4,
                    padding: 4,
                    textAlign: "center",
                    color: getCellColor(v),
                    fontWeight: riskData[String(v)] ? 700 : 400,
                    fontSize: riskData[String(v)] ? 13 : 11,
                  }}>
                    {riskData[String(v)] ? `\u25CF${riskData[String(v)]}` : v}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <SectionTitle>Последние действия</SectionTitle>
          <Timeline events={[
            { date: "11.02.2026 10:15", title: "SOP-042 утверждён", desc: "Холтобин А.В.", color: ACCENT },
            { date: "11.02.2026 09:40", title: "NC-089 создано", desc: "Брак на входном контроле", color: RED },
            { date: "10.02.2026 17:30", title: "CAPA-045 закрыто", desc: "Эффективность подтверждена", color: ACCENT },
            { date: "10.02.2026 15:00", title: "Аудит #12 начат", desc: "Процесс закупок", color: BLUE },
            { date: "10.02.2026 11:20", title: "Калибровка #78", desc: "Весы аналит. — годен", color: ACCENT },
          ]} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Просроченные CAPA</SectionTitle>
          {[
            { id: "CAPA-039", title: "Несоответствие поставщика", days: 12 },
            { id: "CAPA-041", title: "Калибровка оборудования", days: 5 },
            { id: "CAPA-043", title: "Обучение персонала", days: 2 },
          ].map(c => (
            <div key={c.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${BORDER}22`,
            }}>
              <div>
                <span style={{ color: ACCENT, fontWeight: 600, fontSize: 12 }}>{c.id}</span>
                <div style={{ fontSize: 12, color: TEXT_DIM }}>{c.title}</div>
              </div>
              <Badge color={RED}>-{c.days}д</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Сроки калибровки</SectionTitle>
          {[
            { name: "Весы XS205", date: "15.02.2026", days: 4, color: AMBER },
            { name: "Штангенциркуль МК-150", date: "20.02.2026", days: 9, color: ACCENT },
            { name: "Мультиметр Fluke 87V", date: "01.03.2026", days: 18, color: ACCENT },
          ].map(e => (
            <div key={e.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${BORDER}22`,
            }}>
              <div>
                <div style={{ fontSize: 13, color: TEXT }}>{e.name}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM }}>{e.date}</div>
              </div>
              <Badge color={e.color}>{e.days}д</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Обучение — статус</SectionTitle>
          {[
            { dept: "Производство", pct: 95 },
            { dept: "Склад", pct: 78 },
            { dept: "QA", pct: 100 },
            { dept: "Закупки", pct: 62 },
          ].map(d => (
            <div key={d.dept} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: TEXT }}>{d.dept}</span>
                <span style={{ color: d.pct === 100 ? ACCENT : d.pct < 70 ? AMBER : TEXT_DIM }}>{d.pct}%</span>
              </div>
              <ProgressBar value={d.pct} color={d.pct === 100 ? ACCENT : d.pct < 70 ? AMBER : BLUE} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

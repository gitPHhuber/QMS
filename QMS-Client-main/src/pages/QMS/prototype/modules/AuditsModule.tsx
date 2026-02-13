// ═══════════════════════════════════════════════════════════════
// MODULE 7: Audits (Аудиты)
// ═══════════════════════════════════════════════════════════════

import React, { useState } from "react";
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
  TabBar,
  SectionTitle,
  ActionBtn,
  KpiRow,
} from "../shared";

export const AuditsModule: React.FC = () => {
  const [tab, setTab] = useState("План");
  const audits = [
    { id: "AUD-012", type: "Внутренний", process: "Закупки (7.4)", status: "В процессе", lead: "Костюков И.А.", date: "10-14.02.2026", findings: 3 },
    { id: "AUD-011", type: "Внутренний", process: "Производство (7.5)", status: "Завершён", lead: "Холтобин А.В.", date: "20-24.01.2026", findings: 5 },
    { id: "AUD-013", type: "Внутренний", process: "Управление документами (4.2)", status: "Запланирован", lead: "Костюков И.А.", date: "03-07.03.2026", findings: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F4CB}", label: "Запланировано", value: "4", color: BLUE },
        { icon: "\u{1F504}", label: "В процессе", value: "1", color: AMBER },
        { icon: "\u2705", label: "Завершено", value: "11", sub: "за 12 мес.", color: ACCENT },
        { icon: "\u{1F4CA}", label: "Замечаний", value: "23", color: RED },
      ]} />

      <TabBar tabs={["План", "Проведение", "Замечания", "Отчёты"]} active={tab} onChange={setTab} />

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn primary>{"\uFF0B"} Создать аудит</ActionBtn>
        <ActionBtn>{"\u{1F4C5}"} Годовой план</ActionBtn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Тип", "Процесс / Раздел ISO", "Статус", "Ведущий аудитор", "Даты", "Замечания"]}
          rows={audits.map(a => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{a.id}</span>,
            <Badge>{a.type}</Badge>,
            a.process,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={a.status === "Завершён" ? ACCENT : a.status === "В процессе" ? AMBER : BLUE} />
              {a.status}
            </span>,
            a.lead,
            a.date,
            a.findings > 0 ? <Badge color={a.findings > 3 ? RED : AMBER}>{a.findings}</Badge> : "—",
          ])}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Годовой план аудитов</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
            {["Я","Ф","М","А","М","И","И","А","С","О","Н","Д"].map((m, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, color: TEXT_DIM, padding: 2 }}>{m}</div>
            ))}
            {["4.2","5.6","6.2","7.1","7.4","7.5","8.2","8.5"].map((proc, pi) => (
              <React.Fragment key={`ap-${proc}`}>
                {Array.from({ length: 12 }, (_, mi) => {
                  const planned = (pi + mi) % 4 === 0;
                  const done = planned && mi < 2;
                  return (
                    <div key={`${pi}-${mi}`} style={{
                      height: 16, borderRadius: 3,
                      background: done ? ACCENT + "44" : planned ? BLUE + "33" : SURFACE,
                      border: `1px solid ${done ? ACCENT + "44" : planned ? BLUE + "33" : BORDER + "33"}`,
                    }} />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: TEXT_DIM }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT + "44" }} /> Проведён
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: TEXT_DIM }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: BLUE + "33" }} /> Запланирован
            </span>
          </div>
        </Card>

        <Card>
          <SectionTitle>Классификация замечаний</SectionTitle>
          {[
            { label: "Несоответствие (major)", count: 3, color: RED },
            { label: "Несоответствие (minor)", count: 8, color: AMBER },
            { label: "Наблюдение", count: 7, color: BLUE },
            { label: "Рекомендация", count: 5, color: ACCENT },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: TEXT }}>{f.label}</span>
                <span style={{ color: f.color, fontWeight: 600 }}>{f.count}</span>
              </div>
              <ProgressBar value={f.count * 4.3} color={f.color} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODULE 8: Training (Обучение)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  TEXT,
  TEXT_DIM,
  RED,
  AMBER,
  BLUE,
  PURPLE,
} from "../constants";
import {
  StatusDot,
  Card,
  Table,
  SectionTitle,
  ActionBtn,
  KpiRow,
} from "../shared";

export const TrainingModule: React.FC = () => {
  const records = [
    { employee: "Омельченко А.Г.", role: "Backend Dev", topic: "ISO 13485:2016 основы", status: "Пройдено", date: "05.02.2026", score: 92 as number | null, valid: "05.02.2027" },
    { employee: "Чирков И.А.", role: "Junior Dev", topic: "GMP для МИ", status: "В процессе", date: "—", score: null, valid: "—" },
    { employee: "Костюков И.А.", role: "Зам. тех. директора", topic: "Внутренний аудит ISO 19011", status: "Пройдено", date: "15.01.2026", score: 88, valid: "15.01.2028" },
    { employee: "Яровой Е.А.", role: "Ком. директор", topic: "Требования к МИ (ГОСТ)", status: "Просрочено", date: "—", score: null, valid: "Просрочено" },
  ];

  const statColor: Record<string, string> = { "Пройдено": ACCENT, "В процессе": AMBER, "Просрочено": RED };

  const competencyData = [
    [3,3,3,3,2],
    [3,2,3,2,2],
    [2,1,1,1,1],
    [1,1,0,0,2],
    [1,1,0,0,0],
  ];
  const competencyNames = ["Холтобин А.В.", "Костюков И.А.", "Омельченко А.Г.", "Яровой Е.А.", "Чирков И.А."];
  const competencyHeaders = ["ISO 13485", "GMP", "Аудит", "Risk Mgmt", "ГОСТ МИ"];
  const levelLabels = ["\u2014", "\u25CF", "\u25CF\u25CF", "\u25CF\u25CF\u25CF"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F465}", label: "Сотрудников", value: "5", color: BLUE },
        { icon: "\u{1F4DA}", label: "Курсов", value: "12", color: PURPLE },
        { icon: "\u2705", label: "Соответствие", value: "78%", color: ACCENT },
        { icon: "\u26A0\uFE0F", label: "Просрочено", value: "3", color: RED },
      ]} />

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn primary>{"\uFF0B"} Назначить обучение</ActionBtn>
        <ActionBtn>{"\u{1F4CA}"} Матрица компетенций</ActionBtn>
        <ActionBtn>{"\u{1F4C4}"} Отчёт</ActionBtn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["Сотрудник", "Должность", "Тема", "Статус", "Дата", "Балл", "Действует до"]}
          rows={records.map(r => [
            <span style={{ fontWeight: 500 }}>{r.employee}</span>,
            <span style={{ color: TEXT_DIM, fontSize: 12 }}>{r.role}</span>,
            r.topic,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={statColor[r.status]} /> {r.status}
            </span>,
            r.date,
            r.score ? <span style={{ color: r.score >= 80 ? ACCENT : AMBER, fontWeight: 600 }}>{r.score}%</span> : "—",
            <span style={{ color: r.valid === "Просрочено" ? RED : TEXT_DIM }}>{r.valid}</span>,
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>Матрица компетенций</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px repeat(5, 1fr)", gap: 2, fontSize: 11 }}>
            <div />
            {competencyHeaders.map(h => (
              <div key={h} style={{ textAlign: "center", color: TEXT_DIM, padding: 4, fontWeight: 600 }}>{h}</div>
            ))}
            {competencyNames.map((name, ni) => (
              <React.Fragment key={`cm-${name}`}>
                <div style={{ color: TEXT, padding: 4, fontSize: 12 }}>{name}</div>
                {competencyData[ni].map((level, li) => (
                  <div key={li} style={{
                    background: level === 3 ? ACCENT + "33" : level === 2 ? BLUE + "33" : level === 1 ? AMBER + "22" : RED + "22",
                    borderRadius: 4, textAlign: "center", padding: 4,
                    color: level === 3 ? ACCENT : level === 2 ? BLUE : level === 1 ? AMBER : RED,
                    fontWeight: 600,
                  }}>
                    {levelLabels[level]}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {[
            { l: "\u25CF\u25CF\u25CF", d: "Эксперт", c: ACCENT },
            { l: "\u25CF\u25CF", d: "Обучен", c: BLUE },
            { l: "\u25CF", d: "Базовый", c: AMBER },
            { l: "\u2014", d: "Не пройдено", c: RED },
          ].map(leg => (
            <span key={leg.l} style={{ fontSize: 10, color: TEXT_DIM, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: leg.c }}>{leg.l}</span> {leg.d}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

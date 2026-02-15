// ═══════════════════════════════════════════════════════════════
// MODULE 5: Risks (Риски)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  TEXT,
  TEXT_DIM,
  RED,
  AMBER,
  BLUE,
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

export const RisksModule: React.FC = () => {
  const risks = [
    { id: "R-001", title: "Отказ критического поставщика", cat: "Поставки", init: { p: 3, s: 5, lvl: 15 }, resid: { p: 2, s: 5, lvl: 10 } as { p: number; s: number; lvl: number } | null, status: "Мониторинг", mitigation: "Квалификация альт. поставщика" },
    { id: "R-005", title: "Потеря данных производства", cat: "ИТ", init: { p: 2, s: 4, lvl: 8 }, resid: { p: 1, s: 4, lvl: 4 }, status: "Контролируется", mitigation: "Ежедневные бэкапы + DR план" },
    { id: "R-012", title: "Ошибка монтажа платы DEXA", cat: "Производство", init: { p: 4, s: 4, lvl: 16 }, resid: { p: 2, s: 4, lvl: 8 }, status: "Мониторинг", mitigation: "Чек-лист + обучение" },
    { id: "R-018", title: "Задержка сертификации", cat: "Регуляторный", init: { p: 3, s: 3, lvl: 9 }, resid: null, status: "Новый", mitigation: "—" },
  ];

  const riskColor = (lvl: number) => lvl <= 4 ? ACCENT : lvl <= 9 ? AMBER : lvl <= 16 ? "#f97316" : RED;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiRow items={[
        { icon: "\u{1F4CA}", label: "Всего рисков", value: "34", color: BLUE },
        { icon: "\u{1F534}", label: "Высокие", value: "6", color: RED },
        { icon: "\u{1F7E1}", label: "Средние", value: "14", color: AMBER },
        { icon: "\u{1F7E2}", label: "Низкие", value: "14", color: ACCENT },
      ]} />

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn primary>{"\uFF0B"} Зарегистрировать риск</ActionBtn>
        <ActionBtn>{"\u{1F504}"} Пересмотр рисков</ActionBtn>
        <ActionBtn>{"\u{1F4CA}"} Матрица рисков</ActionBtn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Описание", "Категория", "Начальный", "Остаточный", "Статус", "Меры"]}
          rows={risks.map(r => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{r.id}</span>,
            r.title,
            <Badge color={BLUE}>{r.cat}</Badge>,
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                background: riskColor(r.init.lvl) + "33", color: riskColor(r.init.lvl),
                padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 13,
              }}>{r.init.lvl}</span>
              <span style={{ fontSize: 10, color: TEXT_DIM }}>{r.init.p}&times;{r.init.s}</span>
            </div>,
            r.resid ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: riskColor(r.resid.lvl) + "33", color: riskColor(r.resid.lvl),
                  padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 13,
                }}>{r.resid.lvl}</span>
                <span style={{ fontSize: 10, color: TEXT_DIM }}>{r.resid.p}&times;{r.resid.s}</span>
              </div>
            ) : <span style={{ color: TEXT_DIM }}>—</span>,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={r.status === "Контролируется" ? ACCENT : r.status === "Мониторинг" ? AMBER : BLUE} />
              {r.status}
            </span>,
            <span style={{ fontSize: 12 }}>{r.mitigation}</span>,
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>Матрица рисков 5x5 (ISO 14971)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "40px repeat(5, 1fr)", gap: 3 }}>
          <div />
          {["Незначит.", "Малая", "Средняя", "Серьёзная", "Катастроф."].map((s, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 9, color: TEXT_DIM, padding: 4 }}>{s}</div>
          ))}
          {[5,4,3,2,1].map(p => (
            <React.Fragment key={`rp-${p}`}>
              <div style={{ fontSize: 10, color: TEXT_DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>P{p}</div>
              {[1,2,3,4,5].map(s => {
                const v = p * s;
                const hasRisk = risks.some(r => r.init.p === p && r.init.s === s);
                return (
                  <div key={`${p}${s}`} style={{
                    background: riskColor(v) + (hasRisk ? "55" : "22"),
                    borderRadius: 6, padding: 6, textAlign: "center",
                    border: hasRisk ? `2px solid ${riskColor(v)}` : `1px solid ${riskColor(v)}33`,
                    minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: hasRisk ? 14 : 11, fontWeight: hasRisk ? 700 : 400, color: riskColor(v) }}>
                      {hasRisk ? "\u25CF" : v}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
};

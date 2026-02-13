// ═══════════════════════════════════════════════════════════════
// MODULE 2: Documents (Документы)
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
  Card,
  Table,
  TabBar,
  SectionTitle,
  ActionBtn,
} from "../shared";

export const DocumentsModule: React.FC = () => {
  const [tab, setTab] = useState("Все");
  const docs = [
    { id: "SOP-001", title: "Управление документацией", type: "SOP", version: "3.2", status: "Действует", owner: "Холтобин А.В.", effective: "01.01.2026", review: "01.01.2027" },
    { id: "SOP-012", title: "Управление несоответствиями", type: "SOP", version: "2.1", status: "Действует", owner: "Костюков И.А.", effective: "15.03.2025", review: "15.03.2026" },
    { id: "WI-045", title: "Входной контроль комплектующих", type: "РИ", version: "1.0", status: "На согласовании", owner: "Омельченко А.Г.", effective: "—", review: "—" },
    { id: "QM-001", title: "Руководство по качеству", type: "РК", version: "4.0", status: "Действует", owner: "Холтобин А.В.", effective: "01.06.2025", review: "01.06.2026" },
    { id: "F-089", title: "Протокол входного контроля", type: "Форма", version: "2.0", status: "Черновик", owner: "Костюков И.А.", effective: "—", review: "—" },
    { id: "SOP-034", title: "Управление рисками", type: "SOP", version: "1.3", status: "На пересмотре", owner: "Холтобин А.В.", effective: "01.09.2025", review: "01.02.2026" },
  ];

  const statusColor: Record<string, string> = { "Действует": ACCENT, "На согласовании": AMBER, "Черновик": TEXT_DIM, "На пересмотре": BLUE };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <ActionBtn primary>{"\uFF0B"} Новый документ</ActionBtn>
          <ActionBtn>{"\u{1F4E5}"} Импорт</ActionBtn>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: SURFACE, borderRadius: 8, padding: "6px 12px",
          border: `1px solid ${BORDER}`,
        }}>
          <span style={{ color: TEXT_DIM }}>{"\u{1F50D}"}</span>
          <span style={{ color: TEXT_DIM, fontSize: 13 }}>Поиск по документам...</span>
        </div>
      </div>

      <TabBar tabs={["Все", "SOP", "РИ", "Формы", "РК", "На согласовании", "Просрочен пересмотр"]} active={tab} onChange={setTab} />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Table
          columns={["ID", "Название", "Тип", "Версия", "Статус", "Владелец", "Дата ввода", "Пересмотр до"]}
          rows={docs.map(d => [
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: "monospace" }}>{d.id}</span>,
            d.title,
            <Badge>{d.type}</Badge>,
            <span style={{ fontFamily: "monospace" }}>v{d.version}</span>,
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={statusColor[d.status]} /> {d.status}
            </span>,
            d.owner,
            d.effective,
            <span style={{ color: d.review !== "—" && new Date(d.review.split(".").reverse().join("-")) < new Date("2026-03-01") ? AMBER : TEXT_DIM }}>
              {d.review}
            </span>,
          ])}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Процесс согласования</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {["Черновик", "Проверка", "Согласование", "Утверждение", "Действует"].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i < 2 ? ACCENT : SURFACE,
                  border: `2px solid ${i < 2 ? ACCENT : BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600,
                  color: i < 2 ? SURFACE : TEXT_DIM,
                }}>{i < 2 ? "\u2713" : i + 1}</div>
                <span style={{ fontSize: 11, color: i < 2 ? ACCENT : TEXT_DIM, whiteSpace: "nowrap" }}>{step}</span>
                {i < 4 && <div style={{ width: 20, height: 2, background: i < 1 ? ACCENT : BORDER }} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: TEXT_DIM }}>
            Документ WI-045 ожидает согласования от руководителя отдела качества
          </div>
        </Card>

        <Card>
          <SectionTitle>Статистика</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Всего документов", value: 247, color: BLUE },
              { label: "Действующих", value: 198, color: ACCENT },
              { label: "На согласовании", value: 12, color: AMBER },
              { label: "Просрочен пересмотр", value: 7, color: RED },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

/**
 * QmsPrototypePage.tsx — Интерактивный прототип всех 10 QMS-модулей
 * Standalone design prototype с демо-данными (DEXA / ASVOTECH)
 * Тёмная тема, акцент #2dd4a8, inline styles
 */

import React, { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// ASVO-QMS — Complete Modules Design Prototype
// All 10 Quality Management System modules
// ═══════════════════════════════════════════════════════════════

const ACCENT = "#2dd4a8";
const ACCENT_DIM = "rgba(45,212,168,0.15)";
const SURFACE = "#0f1923";
const SURFACE2 = "#162231";
const SURFACE3 = "#1c2d40";
const BORDER = "#1e3348";
const TEXT = "#e2e8f0";
const TEXT_DIM = "#64748b";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const PURPLE = "#a855f7";

// ─── Shared UI Components ─────────────────────────────────────

const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = ACCENT, children }) => (
  <span style={{
    background: color + "22",
    color,
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  }}>{children}</span>
);

const StatusDot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{
    width: 8, height: 8, borderRadius: "50%",
    background: color, display: "inline-block",
    boxShadow: `0 0 6px ${color}66`,
  }} />
);

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = ACCENT, height = 6 }) => (
  <div style={{ background: SURFACE, borderRadius: height, height, width: "100%", overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, Math.max(0, value))}%`,
      height: "100%",
      background: `linear-gradient(90deg, ${color}88, ${color})`,
      borderRadius: height,
      transition: "width 0.6s ease",
    }} />
  </div>
);

const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: SURFACE2,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 16,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    ...style,
  }}>{children}</div>
);

interface StatCardItem {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const StatCard: React.FC<StatCardItem> = ({ icon, label, value, sub, color = ACCENT }) => (
  <Card style={{ textAlign: "center", minWidth: 130 }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{sub}</div>}
  </Card>
);

const Table: React.FC<{ columns: string[]; rows: React.ReactNode[][] }> = ({ columns, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={{
              textAlign: "left", padding: "10px 12px",
              color: TEXT_DIM, fontWeight: 600, fontSize: 11,
              textTransform: "uppercase", letterSpacing: 0.5,
              borderBottom: `1px solid ${BORDER}`,
              background: SURFACE,
              position: "sticky", top: 0,
            }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = SURFACE3)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${BORDER}22`,
                color: TEXT,
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TabBar: React.FC<{ tabs: string[]; active: string; onChange: (t: string) => void }> = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: "8px 16px",
        background: active === t ? ACCENT_DIM : "transparent",
        color: active === t ? ACCENT : TEXT_DIM,
        border: "none",
        borderBottom: active === t ? `2px solid ${ACCENT}` : "2px solid transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.2s",
      }}>{t}</button>
    ))}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>{children}</h3>
    {action}
  </div>
);

const ActionBtn: React.FC<{
  children: React.ReactNode;
  primary?: boolean;
  small?: boolean;
  color?: string;
}> = ({ children, primary, small, color }) => (
  <button style={{
    padding: small ? "4px 12px" : "8px 20px",
    background: primary ? (color || ACCENT) : "transparent",
    color: primary ? SURFACE : (color || ACCENT),
    border: primary ? "none" : `1px solid ${color || ACCENT}44`,
    borderRadius: 8,
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: 6,
  }}>{children}</button>
);

const KpiRow: React.FC<{ items: StatCardItem[] }> = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)`, gap: 12 }}>
    {items.map((item, i) => <StatCard key={i} {...item} />)}
  </div>
);

interface TimelineEvent {
  date: string;
  title: string;
  desc?: string;
  color?: string;
}

const Timeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div style={{ position: "relative", paddingLeft: 24 }}>
    <div style={{ position: "absolute", left: 8, top: 4, bottom: 4, width: 2, background: BORDER }} />
    {events.map((ev, i) => (
      <div key={i} style={{ marginBottom: 16, position: "relative" }}>
        <div style={{
          position: "absolute", left: -20, top: 4,
          width: 12, height: 12, borderRadius: "50%",
          background: ev.color || ACCENT,
          border: `2px solid ${SURFACE2}`,
        }} />
        <div style={{ fontSize: 11, color: TEXT_DIM }}>{ev.date}</div>
        <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{ev.title}</div>
        {ev.desc && <div style={{ fontSize: 12, color: TEXT_DIM }}>{ev.desc}</div>}
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MODULE 1: Dashboard (Дашборд)
// ═══════════════════════════════════════════════════════════════

const DashboardModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 2: Documents (Документы)
// ═══════════════════════════════════════════════════════════════

const DocumentsModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 3: Nonconformities (Несоответствия)
// ═══════════════════════════════════════════════════════════════

const NonconformityModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 4: CAPA
// ═══════════════════════════════════════════════════════════════

const CapaModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 5: Risks (Риски)
// ═══════════════════════════════════════════════════════════════

const RisksModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 6: Suppliers (Поставщики)
// ═══════════════════════════════════════════════════════════════

const SuppliersModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 7: Audits (Аудиты)
// ═══════════════════════════════════════════════════════════════

const AuditsModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 8: Training (Обучение)
// ═══════════════════════════════════════════════════════════════

const TrainingModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 9: Equipment (Оборудование)
// ═══════════════════════════════════════════════════════════════

const EquipmentModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MODULE 10: Management Review (Анализ руководства)
// ═══════════════════════════════════════════════════════════════

const ManagementReviewModule: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════

const MODULES: { key: string; label: string; icon: string; Component: React.FC }[] = [
  { key: "dashboard", label: "Дашборд", icon: "\u{1F4CA}", Component: DashboardModule },
  { key: "documents", label: "Документы", icon: "\u{1F4C4}", Component: DocumentsModule },
  { key: "nc", label: "Несоответствия", icon: "\u26A0\uFE0F", Component: NonconformityModule },
  { key: "capa", label: "CAPA", icon: "\u{1F504}", Component: CapaModule },
  { key: "risks", label: "Риски", icon: "\u{1F3AF}", Component: RisksModule },
  { key: "suppliers", label: "Поставщики", icon: "\u{1F3ED}", Component: SuppliersModule },
  { key: "audits", label: "Аудиты", icon: "\u{1F4CB}", Component: AuditsModule },
  { key: "training", label: "Обучение", icon: "\u{1F4DA}", Component: TrainingModule },
  { key: "equipment", label: "Оборудование", icon: "\u{1F527}", Component: EquipmentModule },
  { key: "review", label: "Анализ руководства", icon: "\u{1F454}", Component: ManagementReviewModule },
];

export const QmsPrototypePage: React.FC = () => {
  const [active, setActive] = useState("dashboard");
  const mod = MODULES.find(m => m.key === active) || MODULES[0];

  return (
    <div style={{
      background: SURFACE,
      minHeight: "100vh",
      color: TEXT,
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#0a1219",
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 52,
        gap: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: SURFACE,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>ASVO-QMS</span>
          <Badge color={ACCENT}>Dev</Badge>
        </div>

        <div style={{ display: "flex", gap: 2, marginLeft: 24 }}>
          {["Задачи", "Качество", "Склад", "Админ"].map(tab => (
            <button key={tab} style={{
              padding: "6px 16px",
              background: tab === "Качество" ? ACCENT_DIM : "transparent",
              color: tab === "Качество" ? ACCENT : TEXT_DIM,
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_DIM }}>11.02.2026 12:45</span>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: SURFACE3, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: ACCENT,
          }}>ИК</div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{
          width: 220,
          borderRight: `1px solid ${BORDER}`,
          background: "#0c161f",
          padding: "12px 8px",
          minHeight: "calc(100vh - 52px)",
          flexShrink: 0,
        }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Качество
          </div>
          {MODULES.map(m => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                background: active === m.key ? ACCENT_DIM : "transparent",
                color: active === m.key ? ACCENT : TEXT_DIM,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active === m.key ? 600 : 400,
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: 2,
                borderLeft: active === m.key ? `3px solid ${ACCENT}` : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: 16, width: 22 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflow: "auto", maxHeight: "calc(100vh - 52px)" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{mod.icon}</span>
              {mod.label}
            </h2>
            <div style={{ fontSize: 12, color: TEXT_DIM }}>
              ISO 13485:2016 &bull; ASVO-QMS v2.0
            </div>
          </div>
          <mod.Component />
        </div>
      </div>
    </div>
  );
};

import { useState, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// ASVO-QMS — Kanban Board Redesign
// Dark theme, glass morphism, refined micro-interactions
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#080e14",
  surface: "#0d1520",
  card: "#111d2b",
  cardHover: "#152436",
  border: "#1a2d42",
  borderLight: "#1e3a54",
  accent: "#2dd4a8",
  accentDim: "rgba(45,212,168,0.08)",
  accentGlow: "rgba(45,212,168,0.25)",
  text: "#e8edf3",
  textMid: "#8899ab",
  textDim: "#4a5e72",
  red: "#f06060",
  redDim: "rgba(240,96,96,0.12)",
  amber: "#e8a830",
  amberDim: "rgba(232,168,48,0.12)",
  blue: "#4a90e8",
  blueDim: "rgba(74,144,232,0.12)",
  purple: "#a06ae8",
  purpleDim: "rgba(160,106,232,0.12)",
  green: "#2dd4a8",
  greenDim: "rgba(45,212,168,0.12)",
  grey: "#3a4e62",
  greyDim: "rgba(58,78,98,0.15)",
};

const COLUMNS = [
  { key: "new", label: "Новые", color: C.blue, icon: "○", count: 4 },
  { key: "progress", label: "В работе", color: C.amber, icon: "◐", count: 3 },
  { key: "review", label: "На проверке", color: C.purple, icon: "◉", count: 2 },
  { key: "done", label: "Готово", color: C.green, icon: "✓", count: 2 },
  { key: "closed", label: "Закрыто", color: C.grey, icon: "▪", count: 1 },
];

const FILTERS = [
  { key: "all", label: "Все", color: C.accent },
  { key: "nc", label: "NC", color: C.red },
  { key: "capa", label: "CAPA", color: C.amber },
  { key: "risk", label: "Риск", color: C.purple },
  { key: "audit", label: "Аудит", color: C.blue },
  { key: "training", label: "Обучение", color: "#36b5e0" },
  { key: "product", label: "Изделие", color: "#e06890" },
  { key: "component", label: "Компонент", color: "#8a9aaa" },
];

const PRIORITY = {
  critical: { label: "Критический", color: C.red, icon: "▲▲" },
  high: { label: "Высокий", color: "#e87040", icon: "▲" },
  medium: { label: "Средний", color: C.amber, icon: "●" },
  low: { label: "Низкий", color: C.blue, icon: "▼" },
};

const PEOPLE = {
  ik: { name: "Костюков И.", initials: "ИК", color: "#2dd4a8" },
  ah: { name: "Холтобин А.", initials: "АХ", color: "#4a90e8" },
  ao: { name: "Омельченко А.", initials: "АО", color: "#e8a830" },
  ey: { name: "Яровой Е.", initials: "ЕЯ", color: "#a06ae8" },
  ic: { name: "Чирков И.", initials: "ИЧ", color: "#e06890" },
};

const TASKS = {
  new: [
    {
      id: "NC-091",
      type: "nc",
      title: "Дефект покрытия корпуса DEXA-200, партия #2026-018",
      priority: "critical",
      assignee: "ao",
      due: "13.02",
      tags: ["Входной контроль", "Партия #018"],
      comments: 2,
      attachments: 3,
      created: "2ч назад",
    },
    {
      id: "CAPA-049",
      type: "capa",
      title: "Разработать чек-лист верификации пайки для участка SMD",
      priority: "high",
      assignee: "ik",
      due: "20.02",
      tags: ["Производство"],
      comments: 5,
      attachments: 1,
      created: "5ч назад",
    },
    {
      id: "R-019",
      type: "risk",
      title: "Оценить риск задержки поставки датчиков от SUP-012",
      priority: "medium",
      assignee: "ah",
      due: "28.02",
      tags: ["Поставки"],
      comments: 0,
      attachments: 0,
      created: "вчера",
    },
    {
      id: "TRN-008",
      type: "training",
      title: "Назначить обучение ISO 13485 для Чиркова И.А.",
      priority: "low",
      assignee: "ey",
      due: "01.03",
      tags: ["Обучение"],
      comments: 1,
      attachments: 0,
      created: "вчера",
    },
  ],
  progress: [
    {
      id: "NC-089",
      type: "nc",
      title: "Расследование дефекта пайки разъёма J4 — root cause analysis",
      priority: "critical",
      assignee: "ao",
      due: "14.02",
      tags: ["RCA", "5 Why"],
      comments: 8,
      attachments: 4,
      created: "2д назад",
      progress: 65,
    },
    {
      id: "AUD-012",
      type: "audit",
      title: "Проведение внутреннего аудита процесса закупок (п.7.4)",
      priority: "high",
      assignee: "ik",
      due: "14.02",
      tags: ["ISO 7.4", "Закупки"],
      comments: 3,
      attachments: 2,
      created: "4д назад",
      progress: 40,
    },
    {
      id: "CAPA-047",
      type: "capa",
      title: "Внедрение чек-листа монтажа — пилотный запуск на 3 изделия",
      priority: "medium",
      assignee: "ao",
      due: "20.02",
      tags: ["Пилот"],
      comments: 4,
      attachments: 1,
      created: "1нед назад",
      progress: 70,
    },
  ],
  review: [
    {
      id: "CAPA-045",
      type: "capa",
      title: "Замена поставщика PCB: верификация эффективности 3 партий",
      priority: "high",
      assignee: "ah",
      due: "15.02",
      tags: ["Верификация", "SUP-001"],
      comments: 6,
      attachments: 5,
      created: "2нед назад",
      progress: 90,
    },
    {
      id: "NC-088",
      type: "nc",
      title: "Отклонение размеров корпуса — протокол диспозиции",
      priority: "medium",
      assignee: "ik",
      due: "16.02",
      tags: ["Диспозиция"],
      comments: 3,
      attachments: 2,
      created: "5д назад",
      progress: 85,
    },
  ],
  done: [
    {
      id: "CAPA-042",
      type: "capa",
      title: "Обновление IQ/OQ документации для пресса термического",
      priority: "medium",
      assignee: "ik",
      due: "01.02",
      tags: ["Оборудование"],
      comments: 4,
      attachments: 3,
      created: "3нед назад",
    },
    {
      id: "TRN-006",
      type: "training",
      title: "Обучение Омельченко А.Г. — ISO 13485:2016 основы",
      priority: "low",
      assignee: "ao",
      due: "05.02",
      tags: ["Сертификат"],
      comments: 1,
      attachments: 1,
      created: "2нед назад",
    },
  ],
  closed: [
    {
      id: "NC-085",
      type: "nc",
      title: "Поставка некомплект — претензия поставщику отправлена",
      priority: "medium",
      assignee: "ik",
      due: "28.01",
      tags: ["Закрыто"],
      comments: 7,
      attachments: 2,
      created: "3нед назад",
    },
  ],
};

const Avatar = ({ person, size = 28 }) => {
  const p = PEOPLE[person];
  return (
    <div
      title={p.name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${p.color}33, ${p.color}11)`,
        border: `1.5px solid ${p.color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: p.color,
        flexShrink: 0,
        letterSpacing: -0.5,
      }}
    >
      {p.initials}
    </div>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    nc: { label: "NC", bg: C.redDim, color: C.red, border: `${C.red}30` },
    capa: { label: "CAPA", bg: C.amberDim, color: C.amber, border: `${C.amber}30` },
    risk: { label: "Риск", bg: C.purpleDim, color: C.purple, border: `${C.purple}30` },
    audit: { label: "Аудит", bg: C.blueDim, color: C.blue, border: `${C.blue}30` },
    training: { label: "Обуч.", bg: "rgba(54,181,224,0.12)", color: "#36b5e0", border: "rgba(54,181,224,0.3)" },
    product: { label: "Изд.", bg: "rgba(224,104,144,0.12)", color: "#e06890", border: "rgba(224,104,144,0.3)" },
  };
  const t = map[type] || map.nc;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
      {t.label}
    </span>
  );
};

const PriorityIcon = ({ priority }) => {
  const p = PRIORITY[priority];
  return (
    <span title={p.label} style={{ fontSize: 10, color: p.color, fontWeight: 700 }}>
      {p.icon}
    </span>
  );
};

const TaskCard = ({ task, columnColor }) => {
  const [hovered, setHovered] = useState(false);
  const isOverdue = task.due && parseInt(task.due) < 12;
  const pri = PRIORITY[task.priority];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.cardHover : C.card,
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderRadius: 10,
        padding: 14,
        cursor: "grab",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${columnColor}18`
          : "0 2px 8px rgba(0,0,0,0.15)",
        position: "relative",
        borderLeft: `3px solid ${pri.color}66`,
      }}
    >
      {/* Top row: ID + Type + Priority */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: C.accent,
              letterSpacing: 0.3,
            }}
          >
            {task.id}
          </span>
          <TypeBadge type={task.type} />
        </div>
        <PriorityIcon priority={task.priority} />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: C.text,
          lineHeight: 1.45,
          marginBottom: 10,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </div>

      {/* Progress bar if exists */}
      {task.progress !== undefined && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              height: 4,
              background: C.bg,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${task.progress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${columnColor}88, ${columnColor})`,
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: C.textDim, textAlign: "right", marginTop: 2 }}>{task.progress}%</div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {task.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: C.accentDim,
                color: C.textMid,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: assignee, due date, meta */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Avatar person={task.assignee} size={24} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {task.comments > 0 && (
            <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12v8H5l-3 3V3z" stroke={C.textDim} strokeWidth="1.5" fill="none" />
              </svg>
              {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M5 8l3 3 3-3" stroke={C.textDim} strokeWidth="1.5" fill="none" />
              </svg>
              {task.attachments}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: task.priority === "critical" ? C.red : C.textDim,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke={task.priority === "critical" ? C.red : C.textDim} strokeWidth="1.5" />
              <path d="M8 4v4l3 2" stroke={task.priority === "critical" ? C.red : C.textDim} strokeWidth="1.5" />
            </svg>
            {task.due}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("kanban");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredTasks = useCallback(
    (columnKey) => {
      const tasks = TASKS[columnKey] || [];
      if (activeFilter === "all") return tasks;
      return tasks.filter((t) => t.type === activeFilter);
    },
    [activeFilter]
  );

  const totalTasks = Object.values(TASKS).flat().length;
  const filteredTotal =
    activeFilter === "all"
      ? totalTasks
      : Object.values(TASKS)
          .flat()
          .filter((t) => t.type === activeFilter).length;

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      {/* ─── Page Header ─── */}
      <div
        style={{
          padding: "20px 28px 0",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
                border: `1px solid ${C.accent}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={C.accent} strokeWidth="1.5" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" stroke={C.accent} strokeWidth="1.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" stroke={C.accent} strokeWidth="1.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" stroke={C.accent} strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>
                Планирование проектов и задач
              </h1>
              <span style={{ fontSize: 12, color: C.textDim }}>
                Всего: {filteredTotal} {activeFilter !== "all" && `из ${totalTasks}`}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                background: searchFocused ? C.surface : "transparent",
                border: `1px solid ${searchFocused ? C.borderLight : C.border}`,
                borderRadius: 8,
                transition: "all 0.2s",
                width: searchFocused ? 240 : 180,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke={C.textDim} strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke={C.textDim} strokeWidth="1.5" />
              </svg>
              <input
                placeholder="Поиск задач..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: C.text,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Executor filter */}
            <select
              style={{
                padding: "7px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.textMid,
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                paddingRight: 28,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234a5e72' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                fontFamily: "inherit",
              }}
            >
              <option>Все исполнители</option>
              <option>Костюков И.</option>
              <option>Холтобин А.</option>
              <option>Омельченко А.</option>
              <option>Яровой Е.</option>
              <option>Чирков И.</option>
            </select>

            {/* View toggle */}
            <div
              style={{
                display: "flex",
                background: C.surface,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                overflow: "hidden",
              }}
            >
              {[
                { key: "kanban", label: "Канбан-доска" },
                { key: "projects", label: "Проекты" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  style={{
                    padding: "7px 16px",
                    background: viewMode === v.key ? C.accent : "transparent",
                    color: viewMode === v.key ? C.bg : C.textMid,
                    border: "none",
                    fontSize: 13,
                    fontWeight: viewMode === v.key ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    letterSpacing: viewMode === v.key ? -0.2 : 0,
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Add task */}
            <button
              style={{
                padding: "8px 18px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accent}cc)`,
                color: C.bg,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: `0 2px 12px ${C.accent}33`,
                transition: "all 0.2s",
                fontFamily: "inherit",
                letterSpacing: -0.2,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Задача
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4 }}>
            <path d="M1 3h14M4 8h8M6 13h4" stroke={C.textDim} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "4px 14px",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                border: activeFilter === f.key ? `1.5px solid ${f.color}` : `1px solid ${C.border}`,
                background: activeFilter === f.key ? `${f.color}18` : "transparent",
                color: activeFilter === f.key ? f.color : C.textDim,
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Kanban Columns ─── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "20px 20px",
          overflowX: "auto",
          minHeight: "calc(100vh - 130px)",
          alignItems: "flex-start",
        }}
      >
        {COLUMNS.map((col) => {
          const tasks = filteredTasks(col.key);
          return (
            <div
              key={col.key}
              style={{
                minWidth: 290,
                maxWidth: 320,
                flex: "1 1 290px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  marginBottom: 8,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${col.color}0a, transparent)`,
                  borderTop: `2px solid ${col.color}55`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                      boxShadow: `0 0 8px ${col.color}44`,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: col.color,
                      letterSpacing: 0.2,
                      textTransform: "uppercase",
                    }}
                  >
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: col.color,
                    background: `${col.color}18`,
                    padding: "2px 8px",
                    borderRadius: 10,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {tasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {tasks.length === 0 ? (
                  <div
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: C.textDim,
                      fontSize: 13,
                      border: `1px dashed ${C.border}`,
                      borderRadius: 10,
                      background: `${C.surface}66`,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }}>{col.icon}</div>
                    Нет задач
                  </div>
                ) : (
                  tasks.map((task) => <TaskCard key={task.id} task={task} columnColor={col.color} />)
                )}
              </div>

              {/* Add task button at bottom of first column */}
              {col.key === "new" && (
                <button
                  style={{
                    marginTop: 8,
                    padding: "10px",
                    border: `1.5px dashed ${C.border}`,
                    borderRadius: 10,
                    background: "transparent",
                    color: C.textDim,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.accent + "44";
                    e.currentTarget.style.color = C.accent;
                    e.currentTarget.style.background = C.accentDim;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.textDim;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 15 }}>+</span> Новая задача
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

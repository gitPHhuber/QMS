import React, { useState } from "react";
import {
  Settings,
  Cog,
  HeartPulse,
  ClipboardList,
  Truck,
  Factory,
  CheckCircle2,
  Package,
  Users,
  Server,
  FileText,
  Gauge,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Process data (static, no API)                                      */
/* ------------------------------------------------------------------ */

interface ProcessInfo {
  id: string;
  name: string;
  owner: string;
  inputs: string[];
  outputs: string[];
  kpis: string[];
  documents: string[];
  icon: React.ElementType;
  color: string;
}

const MANAGEMENT_PROCESSES: ProcessInfo[] = [
  {
    id: "mgmt-1",
    name: "Планирование СМК",
    owner: "Холтобин А.В.",
    inputs: ["Требования ISO 13485", "Цели качества"],
    outputs: ["Политика качества", "Планы СМК"],
    kpis: ["Достижение целей качества, %"],
    documents: ["РК-001 Руководство по качеству"],
    icon: Settings,
    color: "#4A90E8",
  },
  {
    id: "mgmt-2",
    name: "Анализ руководства",
    owner: "Холтобин А.В.",
    inputs: ["Результаты аудитов", "Обратная связь", "Данные о NC/CAPA"],
    outputs: ["Решения руководства", "Планы улучшений"],
    kpis: ["Выполнение решений, %"],
    documents: ["ПРО-008 Анализ со стороны руководства"],
    icon: ClipboardList,
    color: "#4A90E8",
  },
  {
    id: "mgmt-3",
    name: "Корректирующие действия",
    owner: "Костюков И.А.",
    inputs: ["Несоответствия", "Рекламации", "Результаты аудитов"],
    outputs: ["Планы CAPA", "Отчёты эффективности"],
    kpis: ["Срок закрытия CAPA, дн.", "Эффективность, %"],
    documents: ["ПРО-009 CAPA"],
    icon: HeartPulse,
    color: "#4A90E8",
  },
];

const CORE_PROCESSES: ProcessInfo[] = [
  {
    id: "core-1",
    name: "Закупки",
    owner: "Яровой Е.С.",
    inputs: ["Заявки на материалы", "Квалиф. поставщиков"],
    outputs: ["Входящие материалы", "Акты входного контроля"],
    kpis: ["Уровень брака поставщиков, %"],
    documents: ["ПРО-003 Закупки"],
    icon: Truck,
    color: "#2DD4A8",
  },
  {
    id: "core-2",
    name: "Производство",
    owner: "Омельченко А.Г.",
    inputs: ["Материалы", "Тех. документация", "Маршрутные карты"],
    outputs: ["Готовые изделия", "DHR"],
    kpis: ["Выход годных, %", "Цикл сборки, ч"],
    documents: ["ПРО-004 Производство и сборка"],
    icon: Factory,
    color: "#2DD4A8",
  },
  {
    id: "core-3",
    name: "Контроль качества",
    owner: "Костюков И.А.",
    inputs: ["Полуфабрикаты", "Готовые изделия", "Критерии приёмки"],
    outputs: ["Протоколы испытаний", "NC при несоответствиях"],
    kpis: ["Уровень дефектности, %"],
    documents: ["ПРО-005 Контроль и испытания"],
    icon: CheckCircle2,
    color: "#2DD4A8",
  },
  {
    id: "core-4",
    name: "Поставка",
    owner: "Яровой Е.С.",
    inputs: ["Готовая продукция", "Заказы"],
    outputs: ["Поставленная продукция", "Акты приёма-передачи"],
    kpis: ["Своевременность поставок, %"],
    documents: ["ПРО-006 Поставка и сервис"],
    icon: Package,
    color: "#2DD4A8",
  },
];

const SUPPORT_PROCESSES: ProcessInfo[] = [
  {
    id: "sup-1",
    name: "Управление персоналом",
    owner: "Костюков И.А.",
    inputs: ["Требования к компетенциям", "Планы обучения"],
    outputs: ["Обученный персонал", "Матрицы компетенций"],
    kpis: ["Покрытие обучения, %"],
    documents: ["ПРО-010 Обучение и компетенции"],
    icon: Users,
    color: "#A06AE8",
  },
  {
    id: "sup-2",
    name: "Инфраструктура",
    owner: "Чирков И.А.",
    inputs: ["Заявки на оборудование", "Графики ТО"],
    outputs: ["Исправное оборудование", "Калибровочные сертификаты"],
    kpis: ["Доступность оборудования, %"],
    documents: ["ПРО-011 Оборудование и калибровка"],
    icon: Server,
    color: "#A06AE8",
  },
  {
    id: "sup-3",
    name: "Документооборот",
    owner: "Костюков И.А.",
    inputs: ["Проекты документов", "Требования к управлению"],
    outputs: ["Утверждённые документы", "Актуальные копии"],
    kpis: ["Просроченные документы, шт."],
    documents: ["ПРО-001 Управление документацией"],
    icon: FileText,
    color: "#A06AE8",
  },
  {
    id: "sup-4",
    name: "Метрология",
    owner: "Чирков И.А.",
    inputs: ["Средства измерений", "Графики поверки"],
    outputs: ["Поверенные СИ", "Свидетельства"],
    kpis: ["Просроченные поверки, шт."],
    documents: ["ПРО-012 Метрологическое обеспечение"],
    icon: Gauge,
    color: "#A06AE8",
  },
];

/* ================================================================== */
/*  Process Block                                                      */
/* ================================================================== */

const ProcessBlock: React.FC<{
  title: string;
  processes: ProcessInfo[];
  borderColor: string;
  selected: ProcessInfo | null;
  onSelect: (p: ProcessInfo) => void;
}> = ({ title, processes, borderColor, selected, onSelect }) => (
  <div
    className="bg-asvo-surface border border-asvo-border rounded-xl p-4 flex-1 min-w-[220px]"
    style={{ borderTopColor: borderColor, borderTopWidth: 3 }}
  >
    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: borderColor }}>
      {title}
    </h4>
    <div className="space-y-1.5">
      {processes.map((p) => {
        const Icon = p.icon;
        const isActive = selected?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[12px] transition-all ${
              isActive
                ? "bg-asvo-surface-2 text-asvo-text font-semibold ring-1 ring-asvo-accent/40"
                : "text-asvo-text-mid hover:bg-asvo-surface-2 hover:text-asvo-text"
            }`}
          >
            <Icon size={14} style={{ color: p.color }} className="shrink-0" />
            <span className="truncate">{p.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);

/* ================================================================== */
/*  Process Detail Panel                                               */
/* ================================================================== */

const ProcessDetail: React.FC<{ process: ProcessInfo }> = ({ process }) => {
  const Icon = process.icon;
  return (
    <div className="bg-asvo-surface border border-asvo-border rounded-xl p-5 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ background: `${process.color}1F` }}>
          <Icon size={20} style={{ color: process.color }} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-asvo-text">{process.name}</h4>
          <p className="text-[11px] text-asvo-text-dim">Владелец: {process.owner}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <h5 className="text-[10px] font-bold text-asvo-text-dim uppercase tracking-wider mb-2">Входы</h5>
          <ul className="space-y-1">
            {process.inputs.map((item, i) => (
              <li key={i} className="text-[12px] text-asvo-text-mid flex items-start gap-1.5">
                <span className="text-asvo-accent mt-0.5">→</span>{item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[10px] font-bold text-asvo-text-dim uppercase tracking-wider mb-2">Выходы</h5>
          <ul className="space-y-1">
            {process.outputs.map((item, i) => (
              <li key={i} className="text-[12px] text-asvo-text-mid flex items-start gap-1.5">
                <span className="text-asvo-blue mt-0.5">←</span>{item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[10px] font-bold text-asvo-text-dim uppercase tracking-wider mb-2">KPI</h5>
          <ul className="space-y-1">
            {process.kpis.map((item, i) => (
              <li key={i} className="text-[12px] text-asvo-text-mid flex items-start gap-1.5">
                <span className="text-asvo-amber mt-0.5">◆</span>{item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[10px] font-bold text-asvo-text-dim uppercase tracking-wider mb-2">Документы</h5>
          <ul className="space-y-1">
            {process.documents.map((item, i) => (
              <li key={i} className="text-[12px] text-asvo-text-mid flex items-start gap-1.5">
                <span className="text-asvo-purple mt-0.5">📄</span>{item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  ProcessMap — Main Component                                        */
/* ================================================================== */

const ProcessMap: React.FC = () => {
  const [selected, setSelected] = useState<ProcessInfo | null>(null);

  return (
    <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-asvo-text">Карта процессов СМК</h3>
          <p className="text-[11px] text-asvo-text-dim">ISO 13485 §4.1 — Процессный подход</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-asvo-accent/10 text-asvo-accent border border-asvo-accent/20">
          {MANAGEMENT_PROCESSES.length + CORE_PROCESSES.length + SUPPORT_PROCESSES.length} процессов
        </span>
      </div>

      {/* Flow arrows label */}
      <div className="flex items-center gap-2 mb-3 text-[10px] text-asvo-text-dim">
        <span className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#4A90E8]" /> Управляющие
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#2DD4A8]" /> Основные
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#A06AE8]" /> Поддерживающие
        </span>
      </div>

      {/* Three columns */}
      <div className="flex gap-3 flex-col lg:flex-row">
        <ProcessBlock
          title="Управляющие процессы"
          processes={MANAGEMENT_PROCESSES}
          borderColor="#4A90E8"
          selected={selected}
          onSelect={setSelected}
        />
        <ProcessBlock
          title="Основные процессы"
          processes={CORE_PROCESSES}
          borderColor="#2DD4A8"
          selected={selected}
          onSelect={setSelected}
        />
        <ProcessBlock
          title="Поддерживающие процессы"
          processes={SUPPORT_PROCESSES}
          borderColor="#A06AE8"
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {/* Detail panel */}
      {selected && <ProcessDetail process={selected} />}
    </div>
  );
};

export default ProcessMap;

import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Download,
  Users,
  UserCheck,
  CalendarClock,
  AlertCircle,
  Grid3X3,
  Calendar,
  Award,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface TrainingRow {
  [key: string]: unknown;
  employee: string;
  position: string;
  department: string;
  training: string;
  status: "passed" | "in_progress" | "assigned" | "overdue";
  date: string;
  certificate: string;
}

const TRAINING_DATA: TrainingRow[] = [
  { employee: "Костюков И.",   position: "Инженер по качеству", department: "ОТК",          training: "ISO 13485:2016 Основы",   status: "passed",      date: "15.01.2026", certificate: "Да" },
  { employee: "Холтобин А.",   position: "Начальник ОТК",       department: "ОТК",          training: "Внутренний аудитор ISO",  status: "passed",      date: "20.01.2026", certificate: "Да" },
  { employee: "Омельченко А.", position: "Монтажник",            department: "Производство", training: "IPC-A-610 Класс 3",      status: "in_progress", date: "10.02.2026", certificate: "\u2014" },
  { employee: "Яровой Е.",     position: "Инженер-технолог",     department: "Производство", training: "ESD-защита",              status: "assigned",    date: "15.02.2026", certificate: "\u2014" },
  { employee: "Чирков И.",     position: "Метролог",             department: "Метрология",   training: "Калибровка ISO 17025",   status: "overdue",     date: "01.02.2026", certificate: "\u2014" },
  { employee: "Петров Д.",     position: "Кладовщик",            department: "Склад",        training: "GMP для склада",          status: "assigned",    date: "20.02.2026", certificate: "\u2014" },
];

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<TrainingRow["status"], { label: string; color: string; bg: string }> = {
  passed:      { label: "Пройдено",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  in_progress: { label: "В процессе",  color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  assigned:    { label: "Назначено",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  overdue:     { label: "Просрочено",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ---- Competency matrix ---- */

const SKILLS = ["ISO 13485", "IPC-A-610", "Пайка SMD", "ESD", "GMP"];

interface CompetencyRow {
  name: string;
  levels: number[]; // 0-3
}

const COMPETENCY: CompetencyRow[] = [
  { name: "Костюков И.",   levels: [3, 2, 1, 3, 2] },
  { name: "Холтобин А.",   levels: [3, 3, 2, 2, 3] },
  { name: "Омельченко А.", levels: [2, 3, 3, 2, 1] },
  { name: "Яровой Е.",     levels: [2, 1, 2, 3, 2] },
  { name: "Чирков И.",     levels: [1, 2, 3, 1, 1] },
];

const LEVEL_CFG: Record<number, { dots: string; cls: string }> = {
  3: { dots: "\u25CF\u25CF\u25CF", cls: "bg-[rgba(45,212,168,0.20)] text-[#2DD4A8]" },
  2: { dots: "\u25CF\u25CF",       cls: "bg-[rgba(74,144,232,0.20)] text-[#4A90E8]" },
  1: { dots: "\u25CF",             cls: "bg-[rgba(232,168,48,0.20)] text-[#E8A830]" },
  0: { dots: "\u2014",             cls: "bg-[rgba(240,96,96,0.20)] text-[#F06060]" },
};

/* ---- View toggle ---- */

type View = "table" | "matrix";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const TrainingPage: React.FC = () => {
  const [view, setView] = useState<View>("table");

  /* ---- columns for DataTable ---- */

  const columns = [
    {
      key: "employee",
      label: "Сотрудник",
      render: (r: TrainingRow) => (
        <span className="font-medium text-asvo-text">{r.employee}</span>
      ),
    },
    {
      key: "position",
      label: "Должность",
      render: (r: TrainingRow) => <span className="text-asvo-text-mid">{r.position}</span>,
    },
    {
      key: "department",
      label: "Отдел",
      render: (r: TrainingRow) => <span className="text-asvo-text-mid">{r.department}</span>,
    },
    {
      key: "training",
      label: "Обучение",
      render: (r: TrainingRow) => <span className="text-asvo-text">{r.training}</span>,
    },
    {
      key: "status",
      label: "Статус",
      align: "center" as const,
      render: (r: TrainingRow) => {
        const s = STATUS_CFG[r.status];
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "date",
      label: "Дата",
      render: (r: TrainingRow) => (
        <span className="flex items-center gap-1 text-asvo-text-mid">
          <Calendar size={12} className="text-asvo-text-dim" />
          {r.date}
        </span>
      ),
    },
    {
      key: "certificate",
      label: "Сертификат",
      align: "center" as const,
      render: (r: TrainingRow) =>
        r.certificate === "Да" ? (
          <span className="flex items-center justify-center gap-1 text-asvo-accent">
            <Award size={13} />
            Да
          </span>
        ) : (
          <span className="text-asvo-text-dim">{r.certificate}</span>
        ),
    },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-asvo-accent-dim rounded-xl">
            <GraduationCap size={22} className="text-asvo-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Обучение персонала</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;6.2 &mdash; Компетентность, обучение, осведомлённость</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />}>+ Назначить обучение</ActionBtn>
          <ActionBtn
            variant="secondary"
            color="#A06AE8"
            icon={<Grid3X3 size={15} />}
            onClick={() => setView(view === "matrix" ? "table" : "matrix")}
          >
            Матрица компетенций
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего сотрудников", value: 42, icon: <Users size={18} />,         color: "#4A90E8" },
          { label: "Обучено",           value: 38, icon: <UserCheck size={18} />,      color: "#2DD4A8" },
          { label: "План обучения",     value: 15, icon: <CalendarClock size={18} />,  color: "#E8A830" },
          { label: "Просрочено",        value: 2,  icon: <AlertCircle size={18} />,    color: "#F06060" },
        ]}
      />

      {/* ---- View: Table ---- */}
      {view === "table" && <DataTable columns={columns} data={TRAINING_DATA} />}

      {/* ---- View: Competency Matrix ---- */}
      {view === "matrix" && (
        <Card>
          <SectionTitle>Матрица компетенций</SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">
                    Сотрудник
                  </th>
                  {SKILLS.map((sk) => (
                    <th key={sk} className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">
                      {sk}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPETENCY.map((row) => (
                  <tr key={row.name} className="border-t border-asvo-border/40">
                    <td className="px-3 py-2.5 text-[13px] font-medium text-asvo-text whitespace-nowrap">
                      {row.name}
                    </td>
                    {row.levels.map((lvl, ci) => {
                      const cfg = LEVEL_CFG[lvl];
                      return (
                        <td key={ci} className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-lg text-[12px] font-bold px-2.5 py-1 min-w-[44px] ${cfg.cls}`}
                          >
                            {cfg.dots}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 text-[11px] text-asvo-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(45,212,168,0.20)]" /> 3 &mdash; Эксперт
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(74,144,232,0.20)]" /> 2 &mdash; Специалист
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(232,168,48,0.20)]" /> 1 &mdash; Базовый
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(240,96,96,0.20)]" /> 0 &mdash; Отсутствует
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrainingPage;

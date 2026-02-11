/**
 * CapaDetailPage.tsx — Детальная карточка CAPA с 8D
 * ISO 13485 §8.5.2/§8.5.3
 */

import React, { useState } from "react";
import { Check, FileText } from "lucide-react";
import QmsModal from "src/components/qms/Modal";
import Card from "src/components/qms/Card";
import Badge from "src/components/qms/Badge";
import KeyValue from "src/components/qms/KeyValue";
import ProgressBar from "src/components/qms/ProgressBar";
import ActionBtn from "src/components/qms/ActionBtn";

/* ─── Mock data ─────────────────────────────────────────── */

const capaData = {
  id: "CAPA-048",
  type: "Корректирующее",
  source: "NC-089",
  description: "Внедрение чек-листа верификации настроек при замене критического оборудования SMD-монтажа",
  responsible: "Костюков И.А.",
  team: "Костюков И.А., Омельченко А.Г., Чирков И.А.",
  product: "DEXA-200",
  priority: "Высокий",
  created: "10.02.2026",
  due: "28.02.2026",
  progress: 15,
};

interface D8Step {
  d: string;
  label: string;
  done: boolean;
  active: boolean;
}

const d8Steps: D8Step[] = [
  { d: "D1", label: "Команда", done: true, active: false },
  { d: "D2", label: "Описание", done: true, active: false },
  { d: "D3", label: "Сдерживание", done: true, active: false },
  { d: "D4", label: "Root Cause", done: true, active: false },
  { d: "D5", label: "Действия", done: false, active: true },
  { d: "D6", label: "Внедрение", done: false, active: false },
  { d: "D7", label: "Предотвращение", done: false, active: false },
  { d: "D8", label: "Закрытие", done: false, active: false },
];

interface CorrectiveAction {
  text: string;
  owner: string;
  status: "done" | "in_progress" | "pending" | "overdue";
  statusLabel: string;
}

const correctiveActions: CorrectiveAction[] = [
  { text: "Разработать чек-лист верификации оборудования", owner: "Костюков И.А.", status: "done", statusLabel: "Выполнено" },
  { text: "Обновить SOP-012 (профиль пайки)", owner: "Омельченко А.Г.", status: "in_progress", statusLabel: "В работе" },
  { text: "Провести обучение операторов SMD-линии", owner: "Чирков И.А.", status: "pending", statusLabel: "Ожидание" },
  { text: "Валидация нового чек-листа на 3 партиях", owner: "Костюков И.А.", status: "pending", statusLabel: "Ожидание" },
];

const statusConfig: Record<string, { badge: "sop" | "capa" | "audit" | "closed" | "nc"; borderColor: string }> = {
  done: { badge: "sop", borderColor: "#2DD4A8" },
  in_progress: { badge: "capa", borderColor: "#E8A830" },
  pending: { badge: "audit", borderColor: "#1A2D42" },
  overdue: { badge: "nc", borderColor: "#F06060" },
};

/* ─── Component ───────────────────────────────────────── */

interface CapaDetailPageProps {
  onClose: () => void;
  onESign?: (description: string, action: () => void) => void;
}

const CapaDetailPage: React.FC<CapaDetailPageProps> = ({ onClose, onESign }) => {
  const handleCompleteD5 = () => {
    if (onESign) {
      onESign(`Завершить этап D5 для ${capaData.id}`, () => {
        // proceed
      });
    }
  };

  return (
    <QmsModal title={`CAPA ${capaData.id}`} onClose={onClose} width={780}>
      {/* Badges row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="nc">Корректирующее</Badge>
          <Badge variant="audit">Планирование</Badge>
        </div>
        <span className="text-xs text-asvo-text-dim">
          Источник: <span className="text-asvo-accent font-mono font-semibold">{capaData.source}</span>
        </span>
      </div>

      {/* 8D Progress Grid */}
      <Card className="mb-4">
        <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-3">
          8D Progress
        </h4>
        <div className="grid grid-cols-8 gap-2">
          {d8Steps.map((step) => (
            <div
              key={step.d}
              className={`rounded-lg p-2.5 text-center border ${
                step.done
                  ? "bg-asvo-accent-dim border-asvo-accent/25"
                  : step.active
                  ? "bg-asvo-amber-dim border-asvo-amber/25"
                  : "bg-asvo-surface border-asvo-border"
              }`}
            >
              <div
                className={`text-base font-bold ${
                  step.done
                    ? "text-asvo-accent"
                    : step.active
                    ? "text-asvo-amber"
                    : "text-asvo-text-dim"
                }`}
              >
                {step.d}
              </div>
              <div
                className={`text-[9px] mt-0.5 ${
                  step.done
                    ? "text-asvo-accent"
                    : step.active
                    ? "text-asvo-amber"
                    : "text-asvo-text-dim"
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid 2 col */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left: details */}
        <Card>
          <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-2">
            Детали
          </h4>
          <KeyValue label="ID" value={capaData.id} color="#2DD4A8" />
          <KeyValue label="Тип" value={capaData.type} />
          <KeyValue label="Описание" value={capaData.description} />
          <KeyValue label="Ответственный (лид)" value={capaData.responsible} />
          <KeyValue label="Команда" value={capaData.team} />
          <KeyValue label="Продукт" value={capaData.product} />
          <KeyValue label="Приоритет" value={capaData.priority} color="#E8A830" />
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-asvo-text-dim">Прогресс</span>
              <span className="text-xs font-semibold text-asvo-amber">{capaData.progress}%</span>
            </div>
            <ProgressBar value={capaData.progress} color="amber" />
          </div>
        </Card>

        {/* Right: corrective actions */}
        <Card>
          <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-2">
            Корр. действия D5
          </h4>
          <div className="space-y-2">
            {correctiveActions.map((action, idx) => {
              const cfg = statusConfig[action.status];
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                    action.status === "in_progress"
                      ? "bg-asvo-amber-dim border-asvo-amber/20"
                      : "bg-asvo-surface border-asvo-border"
                  }`}
                >
                  <div
                    className="w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: cfg.borderColor }}
                  >
                    {action.status === "done" && (
                      <Check size={10} className="text-asvo-accent" />
                    )}
                    {action.status === "in_progress" && (
                      <span className="text-[8px] text-asvo-amber">◐</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-asvo-text">{action.text}</div>
                    <div className="text-[11px] text-asvo-text-dim mt-0.5">{action.owner}</div>
                  </div>
                  <Badge variant={cfg.badge}>{action.statusLabel}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-asvo-border">
        <ActionBtn variant="secondary" icon={<FileText size={14} />}>
          Экспорт PDF
        </ActionBtn>
        <ActionBtn variant="secondary" color="#E8A830">
          Редактировать
        </ActionBtn>
        <ActionBtn variant="primary" icon={<Check size={14} />} onClick={handleCompleteD5}>
          Завершить D5
        </ActionBtn>
      </div>
    </QmsModal>
  );
};

export default CapaDetailPage;

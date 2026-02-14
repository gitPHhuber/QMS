/**
 * DhrDetailModal.tsx — Detail view for a Device History Record
 * ISO 13485 §7.5.9 — Traceability
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { dhrApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import ProgressBar from "../../components/qms/ProgressBar";

/* ── Style constants ── */

const labelCls = "text-[12px] text-asvo-text-dim font-medium";
const valueCls = "text-[13px] text-asvo-text";

/* ── Status config ── */

type DhrStatus =
  | "IN_PRODUCTION"
  | "QC_PENDING"
  | "QC_PASSED"
  | "QC_FAILED"
  | "RELEASED"
  | "ON_HOLD"
  | "QUARANTINE"
  | "RETURNED"
  | "RECALLED";

const STATUS_CFG: Record<DhrStatus, { label: string; color: string; bg: string }> = {
  IN_PRODUCTION: { label: "Производство",   color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  QC_PENDING:    { label: "Ожидает ОТК",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  QC_PASSED:     { label: "ОТК пройден",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  QC_FAILED:     { label: "ОТК не пройден", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  RELEASED:      { label: "Выпущено",       color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  ON_HOLD:       { label: "Задержано",       color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  QUARANTINE:    { label: "Карантин",        color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  RETURNED:      { label: "Возврат",         color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
  RECALLED:      { label: "Отзыв",           color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ── Material type config ── */

const MATERIAL_TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  RAW:        { label: "Сырьё",       color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  COMPONENT:  { label: "Компонент",   color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
  PACKAGING:  { label: "Упаковка",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  CONSUMABLE: { label: "Расходник",   color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
};

/* ── Process step result config ── */

const STEP_RESULT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PASS:      { label: "Пройден",     color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  FAIL:      { label: "Не пройден",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  PENDING:   { label: "Ожидание",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  SKIPPED:   { label: "Пропущен",    color: "#64748B", bg: "rgba(100,116,139,0.12)" },
};

/* ── Tabs ── */

const TABS = [
  { key: "overview",   label: "Обзор" },
  { key: "materials",  label: "Материалы" },
  { key: "steps",      label: "Тех. операции" },
];

/* ── Props ── */

interface DhrDetailModalProps {
  dhrId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const DhrDetailModal: React.FC<DhrDetailModalProps> = ({
  dhrId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    if (!dhrId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await dhrApi.getOne(dhrId);
      setData(result);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [dhrId]);

  useEffect(() => {
    if (isOpen && dhrId) {
      setTab("overview");
      fetchData();
    }
  }, [isOpen, dhrId, fetchData]);

  /* ── Helpers ── */
  const currentStatus: DhrStatus = data?.status ?? "IN_PRODUCTION";
  const sc = STATUS_CFG[currentStatus] ?? STATUS_CFG.IN_PRODUCTION;

  const materials: any[] = data?.materials ?? [];
  const steps: any[] = data?.processSteps ?? data?.steps ?? [];

  const completedSteps = steps.filter(
    (s: any) => s.result === "PASS" || s.result === "FAIL"
  ).length;
  const stepsProgress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const fieldRow = (label: string, value: any) => (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b border-asvo-border/30">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value || "\u2014"}</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data?.dhrNumber ?? data?.number ?? "DHR"} size="4xl">
      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-asvo-accent mb-3" />
          <p className="text-[13px] text-asvo-text-dim">Загрузка...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle size={32} className="mb-3" style={{ color: "#F06060" }} />
          <p className="text-[13px]" style={{ color: "#F06060" }}>{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <div className="space-y-4">
          {/* Icon header */}
          <div className="flex items-center gap-2 pb-2 border-b border-asvo-border">
            <div className="p-2 rounded-lg" style={{ background: "rgba(74,144,232,0.12)" }}>
              <ClipboardList size={18} style={{ color: "#4A90E8" }} />
            </div>
            <span className="text-sm text-asvo-text-mid">
              ISO 13485 &sect;7.5.9 &mdash; Прослеживаемость
            </span>
            <div className="ml-auto">
              <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                  tab === t.key
                    ? "text-asvo-accent border-asvo-accent"
                    : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ---- Tab: Overview ---- */}
          {tab === "overview" && (
            <div className="space-y-1">
              {fieldRow("DHR #", data.dhrNumber ?? data.number ?? `DHR-${data.id}`)}
              {fieldRow("Изделие", data.productName ?? data.product)}
              {fieldRow("Серийный №", data.serialNumber)}
              {fieldRow("Партия", data.lotNumber)}
              {fieldRow("Размер партии", data.batchSize)}
              {fieldRow("Дата начала", data.productionStartDate ? new Date(data.productionStartDate).toLocaleDateString("ru-RU") : null)}
              {fieldRow("Дата окончания", data.productionEndDate ? new Date(data.productionEndDate).toLocaleDateString("ru-RU") : null)}
              {fieldRow("Версия DMR", data.dmrVersion)}
              {fieldRow("Статус", <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>)}

              {/* QC section */}
              <p className="text-[12px] text-asvo-text-dim font-semibold uppercase tracking-wider mt-4 mb-1">
                Контроль качества (ОТК)
              </p>
              {fieldRow("Инспектор ОТК", data.qcInspector)}
              {fieldRow("Дата ОТК", data.qcDate ? new Date(data.qcDate).toLocaleDateString("ru-RU") : null)}
              {fieldRow("Примечания ОТК", data.qcNotes)}

              {/* Release section */}
              <p className="text-[12px] text-asvo-text-dim font-semibold uppercase tracking-wider mt-4 mb-1">
                Выпуск
              </p>
              {fieldRow("Выпустил", data.releasedBy)}
              {fieldRow("Дата выпуска", data.releaseDate ? new Date(data.releaseDate).toLocaleDateString("ru-RU") : null)}
            </div>
          )}

          {/* ---- Tab: Materials ---- */}
          {tab === "materials" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-asvo-text-mid font-medium">
                  Материалы и комплектующие ({materials.length})
                </span>
                <ActionBtn variant="secondary" icon={<Plus size={14} />} onClick={() => { /* TODO: Add material modal */ }}>
                  Добавить материал
                </ActionBtn>
              </div>

              {materials.length === 0 ? (
                <p className="text-sm text-asvo-text-dim text-center py-8">
                  Нет записей о материалах
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Тип</th>
                        <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Описание</th>
                        <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Part #</th>
                        <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Lot #</th>
                        <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Поставщик</th>
                        <th className="text-right text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-3 py-2.5">Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m: any, idx: number) => {
                        const mt = MATERIAL_TYPE_CFG[m.type] ?? { label: m.type ?? "—", color: "#64748B", bg: "rgba(100,116,139,0.12)" };
                        return (
                          <tr key={m.id ?? idx} className="border-t border-asvo-border/40">
                            <td className="px-3 py-2.5">
                              <Badge color={mt.color} bg={mt.bg}>{mt.label}</Badge>
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-asvo-text">{m.description ?? "\u2014"}</td>
                            <td className="px-3 py-2.5 text-[13px] font-mono text-asvo-text-mid">{m.partNumber ?? "\u2014"}</td>
                            <td className="px-3 py-2.5 text-[13px] font-mono text-asvo-text-mid">{m.lotNumber ?? "\u2014"}</td>
                            <td className="px-3 py-2.5 text-[13px] text-asvo-text-mid">{m.supplier ?? "\u2014"}</td>
                            <td className="px-3 py-2.5 text-[13px] text-asvo-text text-right">{m.quantity ?? "\u2014"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ---- Tab: Process Steps ---- */}
          {tab === "steps" && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-asvo-text-mid font-medium">
                    Прогресс: {completedSteps} / {steps.length} операций
                  </span>
                  <span className="text-[13px] text-asvo-text font-semibold">{stepsProgress}%</span>
                </div>
                <ProgressBar value={stepsProgress} color="accent" />
              </div>

              {steps.length === 0 ? (
                <p className="text-sm text-asvo-text-dim text-center py-8">
                  Нет технологических операций
                </p>
              ) : (
                <div className="space-y-2">
                  {steps
                    .sort((a: any, b: any) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0))
                    .map((step: any, idx: number) => {
                      const rc = STEP_RESULT_CFG[step.result] ?? STEP_RESULT_CFG.PENDING;
                      return (
                        <div
                          key={step.id ?? idx}
                          className="flex items-center gap-4 p-3 rounded-lg border border-asvo-border/40 bg-asvo-surface-2/50"
                        >
                          {/* Step number */}
                          <div
                            className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-[12px] font-bold"
                            style={{ backgroundColor: rc.bg, color: rc.color }}
                          >
                            {step.stepNumber ?? idx + 1}
                          </div>

                          {/* Step info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-asvo-text truncate">
                              {step.name ?? step.stepName ?? `Операция ${step.stepNumber ?? idx + 1}`}
                            </p>
                            <p className="text-[11px] text-asvo-text-dim">
                              {step.operator ?? "—"} &middot; {step.equipment ?? "—"}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="text-right shrink-0">
                            <p className="text-[11px] text-asvo-text-dim">
                              {step.startTime ? new Date(step.startTime).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
                              {" \u2192 "}
                              {step.endTime ? new Date(step.endTime).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
                            </p>
                          </div>

                          {/* Result badge */}
                          <Badge color={rc.color} bg={rc.bg}>{rc.label}</Badge>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DhrDetailModal;

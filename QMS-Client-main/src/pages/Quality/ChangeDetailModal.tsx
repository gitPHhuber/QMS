/**
 * ChangeDetailModal.tsx — Detail view & management of an Engineering Change Request
 * ISO 13485 §7.3.9 — Design and Development Changes
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Save,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { changeRequestsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Types ── */

type ChangeStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IMPACT_REVIEW"
  | "APPROVED"
  | "IN_PROGRESS"
  | "VERIFICATION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

const STATUS_LABELS: Record<ChangeStatus, string> = {
  DRAFT: "Черновик",
  SUBMITTED: "На согласовании",
  IMPACT_REVIEW: "Оценка влияния",
  APPROVED: "Одобрена",
  IN_PROGRESS: "Внедрение",
  VERIFICATION: "Верификация",
  COMPLETED: "Завершена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
};

const statusColors: Record<ChangeStatus, { color: string; bg: string }> = {
  DRAFT:         { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
  SUBMITTED:     { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  IMPACT_REVIEW: { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  APPROVED:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  IN_PROGRESS:   { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
  VERIFICATION:  { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  COMPLETED:     { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  REJECTED:      { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  CANCELLED:     { color: "#64748B", bg: "rgba(100,116,139,0.14)" },
};

const TYPE_LABELS: Record<string, string> = {
  DESIGN: "Конструкция",
  PROCESS: "Процесс",
  DOCUMENT: "Документ",
  SOFTWARE: "ПО",
  SUPPLIER: "Поставщик",
  MATERIAL: "Материал",
  OTHER: "Другое",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Критический",
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий",
};

const priorityColors: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  HIGH:     { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  MEDIUM:   { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  LOW:      { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
};

/* Workflow: forward transitions */
const WORKFLOW_FORWARD: Partial<Record<ChangeStatus, ChangeStatus>> = {
  DRAFT: "SUBMITTED",
  SUBMITTED: "IMPACT_REVIEW",
  IMPACT_REVIEW: "APPROVED",
  APPROVED: "IN_PROGRESS",
  IN_PROGRESS: "VERIFICATION",
  VERIFICATION: "COMPLETED",
};

const WORKFLOW_FORWARD_LABELS: Partial<Record<ChangeStatus, string>> = {
  DRAFT: "Отправить на согласование",
  SUBMITTED: "Начать оценку влияния",
  IMPACT_REVIEW: "Одобрить",
  APPROVED: "Начать внедрение",
  IN_PROGRESS: "На верификацию",
  VERIFICATION: "Завершить",
};

/* Pipeline steps for visualization */
const PIPELINE_STATUSES: ChangeStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IMPACT_REVIEW",
  "APPROVED",
  "IN_PROGRESS",
  "VERIFICATION",
  "COMPLETED",
];

/* ── Tabs ── */

const TABS = [
  { key: "general", label: "Основное" },
  { key: "impact", label: "Оценка воздействия" },
  { key: "verification", label: "Верификация" },
];

/* ── Props ── */

interface ChangeDetailModalProps {
  changeId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const ChangeDetailModal: React.FC<ChangeDetailModalProps> = ({
  changeId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [tab, setTab] = useState("general");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Impact assessment fields */
  const [impactAssessment, setImpactAssessment] = useState("");
  const [riskAssessment, setRiskAssessment] = useState("");

  /* Verification fields */
  const [verificationMethod, setVerificationMethod] = useState("");
  const [verificationResult, setVerificationResult] = useState("");

  /* Saving state */
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    if (!changeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await changeRequestsApi.getOne(changeId);
      setData(result);
      setImpactAssessment(result.impactAssessment ?? "");
      setRiskAssessment(result.riskAssessment ?? "");
      setVerificationMethod(result.verificationMethod ?? "");
      setVerificationResult(result.verificationResult ?? "");
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [changeId]);

  useEffect(() => {
    if (isOpen && changeId) {
      setTab("general");
      setSaveMsg(null);
      fetchData();
    }
  }, [isOpen, changeId, fetchData]);

  /* ── Save impact assessment ── */
  const handleSaveImpact = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await changeRequestsApi.update(changeId, {
        impactAssessment: impactAssessment.trim() || undefined,
        riskAssessment: riskAssessment.trim() || undefined,
      });
      setSaveMsg("Сохранено");
      onAction();
    } catch (e: any) {
      setSaveMsg(e.response?.data?.message || e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── Save verification ── */
  const handleSaveVerification = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await changeRequestsApi.update(changeId, {
        verificationMethod: verificationMethod.trim() || undefined,
        verificationResult: verificationResult.trim() || undefined,
      });
      setSaveMsg("Сохранено");
      onAction();
    } catch (e: any) {
      setSaveMsg(e.response?.data?.message || e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── Status transition ── */
  const handleTransition = async (nextStatus: ChangeStatus) => {
    setTransitioning(true);
    setSaveMsg(null);
    try {
      const result = await changeRequestsApi.update(changeId, { status: nextStatus });
      setData(result);
      setSaveMsg(`Статус изменён: ${STATUS_LABELS[nextStatus]}`);
      onAction();
    } catch (e: any) {
      setSaveMsg(e.response?.data?.message || e.message || "Ошибка смены статуса");
    } finally {
      setTransitioning(false);
    }
  };

  const handleReject = () => handleTransition("REJECTED");
  const handleCancel = () => handleTransition("CANCELLED");

  /* ── Helpers ── */
  const currentStatus: ChangeStatus = data?.status ?? "DRAFT";
  const nextStatus = WORKFLOW_FORWARD[currentStatus];
  const nextLabel = WORKFLOW_FORWARD_LABELS[currentStatus];
  const currentStepIdx = PIPELINE_STATUSES.indexOf(currentStatus);
  const isTerminal = currentStatus === "COMPLETED" || currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  const fieldRow = (label: string, value: any) => (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b border-asvo-border/30">
      <span className="text-[12px] text-asvo-text-dim font-medium">{label}</span>
      <span className="text-[13px] text-asvo-text">{value || "\u2014"}</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data?.title ?? "Запрос на изменение"} size="4xl">
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
          {/* Status pipeline */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {PIPELINE_STATUSES.map((s, i) => {
              const isCompleted = currentStepIdx > i;
              const isCurrent = currentStepIdx === i;
              const sc = statusColors[s];
              return (
                <React.Fragment key={s}>
                  {i > 0 && (
                    <div
                      className="h-[2px] w-4 shrink-0"
                      style={{ backgroundColor: isCompleted ? "#2DD4A8" : "#334155" }}
                    />
                  )}
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium shrink-0"
                    style={{
                      backgroundColor: isCurrent ? sc.bg : isCompleted ? "rgba(45,212,168,0.08)" : "transparent",
                      color: isCurrent ? sc.color : isCompleted ? "#2DD4A8" : "#64748B",
                      border: isCurrent ? `1px solid ${sc.color}40` : "1px solid transparent",
                    }}
                  >
                    {isCompleted && <CheckCircle2 size={12} />}
                    {STATUS_LABELS[s]}
                  </div>
                </React.Fragment>
              );
            })}
            {/* Show REJECTED / CANCELLED if applicable */}
            {(currentStatus === "REJECTED" || currentStatus === "CANCELLED") && (
              <>
                <div className="h-[2px] w-4 shrink-0" style={{ backgroundColor: "#334155" }} />
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium shrink-0"
                  style={{
                    backgroundColor: statusColors[currentStatus].bg,
                    color: statusColors[currentStatus].color,
                    border: `1px solid ${statusColors[currentStatus].color}40`,
                  }}
                >
                  {STATUS_LABELS[currentStatus]}
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSaveMsg(null); }}
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

          {/* ---- Tab: General ---- */}
          {tab === "general" && (
            <div className="space-y-1">
              {fieldRow("ECR #", data.ecr ?? data.number ?? `ECR-${data.id}`)}
              {fieldRow("Статус", (() => {
                const sc = statusColors[currentStatus];
                return <Badge color={sc.color} bg={sc.bg}>{STATUS_LABELS[currentStatus]}</Badge>;
              })())}
              {fieldRow("Тип", TYPE_LABELS[data.type] ?? data.type)}
              {fieldRow("Приоритет", (() => {
                const pc = priorityColors[data.priority];
                return pc
                  ? <Badge color={pc.color} bg={pc.bg}>{PRIORITY_LABELS[data.priority] ?? data.priority}</Badge>
                  : (PRIORITY_LABELS[data.priority] ?? data.priority);
              })())}
              {fieldRow("Категория", data.category === "MAJOR" ? "MAJOR — влияет на безопасность" : data.category === "MINOR" ? "MINOR — не влияет" : data.category)}
              {fieldRow("Название", data.title)}
              {fieldRow("Описание", data.description)}
              {fieldRow("Обоснование", data.justification)}
              {fieldRow("Регуляторное воздействие", data.regulatoryImpact)}
              {fieldRow("Плановая дата", data.plannedDate ? new Date(data.plannedDate).toLocaleDateString("ru-RU") : null)}
              {fieldRow("Инициатор", data.initiatedBy ? `${data.initiatedBy.surname ?? ""} ${data.initiatedBy.name ?? ""}`.trim() : data.initiator)}
              {fieldRow("Одобрил", data.approvedBy ? `${data.approvedBy.surname ?? ""} ${data.approvedBy.name ?? ""}`.trim() : data.approver)}
              {fieldRow("Создано", data.createdAt ? new Date(data.createdAt).toLocaleString("ru-RU") : null)}
              {fieldRow("Обновлено", data.updatedAt ? new Date(data.updatedAt).toLocaleString("ru-RU") : null)}
            </div>
          )}

          {/* ---- Tab: Impact Assessment ---- */}
          {tab === "impact" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Оценка воздействия</label>
                <textarea
                  value={impactAssessment}
                  onChange={(e) => setImpactAssessment(e.target.value)}
                  placeholder="Описание воздействия изменения на продукцию, процессы и систему качества..."
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Оценка рисков</label>
                <textarea
                  value={riskAssessment}
                  onChange={(e) => setRiskAssessment(e.target.value)}
                  placeholder="Анализ рисков, связанных с данным изменением..."
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Affected areas (read-only display) */}
              <div className="space-y-1">
                <p className="text-[12px] text-asvo-text-dim font-semibold uppercase tracking-wider mt-2">Затронутые области</p>
                {fieldRow("Продукты", data.affectedProducts)}
                {fieldRow("Документы", data.affectedDocuments)}
                {fieldRow("Процессы", data.affectedProcesses)}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
                <ActionBtn
                  variant="primary"
                  icon={<Save size={14} />}
                  onClick={handleSaveImpact}
                  disabled={saving}
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </ActionBtn>
              </div>
            </div>
          )}

          {/* ---- Tab: Verification ---- */}
          {tab === "verification" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Метод верификации</label>
                <input
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  placeholder="Метод проверки корректности внедрения изменения..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Результат верификации</label>
                <textarea
                  value={verificationResult}
                  onChange={(e) => setVerificationResult(e.target.value)}
                  placeholder="Результаты проверки, выявленные несоответствия, выводы..."
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
                <ActionBtn
                  variant="primary"
                  icon={<Save size={14} />}
                  onClick={handleSaveVerification}
                  disabled={saving}
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </ActionBtn>
              </div>
            </div>
          )}

          {/* Save / transition messages */}
          {saveMsg && (
            <div
              className="rounded-lg px-3 py-2 text-[12px]"
              style={{
                backgroundColor: saveMsg.startsWith("Ошибка") ? "rgba(240,96,96,0.1)" : "rgba(45,212,168,0.1)",
                borderColor: saveMsg.startsWith("Ошибка") ? "rgba(240,96,96,0.3)" : "rgba(45,212,168,0.3)",
                borderWidth: 1,
                borderStyle: "solid",
                color: saveMsg.startsWith("Ошибка") ? "#F06060" : "#2DD4A8",
              }}
            >
              {saveMsg}
            </div>
          )}

          {/* Workflow actions */}
          {!isTerminal && (
            <div className="flex items-center justify-between pt-3 border-t border-asvo-border">
              <div className="flex items-center gap-2">
                {currentStatus !== "DRAFT" && (
                  <ActionBtn
                    variant="secondary"
                    color="#F06060"
                    onClick={handleReject}
                    disabled={transitioning}
                  >
                    Отклонить
                  </ActionBtn>
                )}
                <ActionBtn
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={transitioning}
                >
                  Отменить
                </ActionBtn>
              </div>
              {nextStatus && nextLabel && (
                <ActionBtn
                  variant="primary"
                  icon={<ArrowRight size={14} />}
                  onClick={() => handleTransition(nextStatus)}
                  disabled={transitioning}
                >
                  {transitioning ? "Обработка..." : nextLabel}
                </ActionBtn>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ChangeDetailModal;

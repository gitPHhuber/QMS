/**
 * RiskDetailModal.tsx — Детальный просмотр и управление риском
 * ISO 14971 / ISO 13485 §7.1 — Оценки, меры снижения, связанные NC
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, AlertTriangle, Plus, CheckCircle2,
  ShieldCheck, ClipboardCheck, Link2,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { risksApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* ── Constants ── */

const STATUS_LABELS: Record<string, string> = {
  ASSESSMENT: "Оценка", MONITORING: "Мониторинг", TREATMENT: "Обработка",
  MITIGATED: "Снижен", ACCEPTED: "Принят", CLOSED: "Закрыто",
};

const STATUS_DOT: Record<string, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey"> = {
  ASSESSMENT: "purple", MONITORING: "amber", TREATMENT: "blue",
  MITIGATED: "accent", ACCEPTED: "grey", CLOSED: "accent",
};

const CLASS_COLORS: Record<string, { color: string; bg: string }> = {
  LOW:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  MEDIUM:   { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  HIGH:     { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
};

const ASSESSMENT_TYPES = [
  { value: "INITIAL",         label: "Первичная" },
  { value: "PERIODIC",        label: "Периодическая" },
  { value: "POST_MITIGATION", label: "После снижения" },
  { value: "POST_INCIDENT",   label: "После инцидента" },
];

const MITIGATION_TYPES = [
  { value: "DESIGN",             label: "Конструктивное решение" },
  { value: "PROCESS_CONTROL",    label: "Контроль процесса" },
  { value: "PROTECTIVE_MEASURE", label: "Защитная мера" },
  { value: "INFORMATION",        label: "Информирование" },
  { value: "TRAINING",           label: "Обучение" },
];

const MITIGATION_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Запланировано", IN_PROGRESS: "В работе", COMPLETED: "Завершено",
  VERIFIED: "Верифицировано", CANCELLED: "Отменено",
};

const PROBABILITY_OPTIONS = [
  { value: 1, label: "1 — Очень низкая" },
  { value: 2, label: "2 — Низкая" },
  { value: 3, label: "3 — Средняя" },
  { value: 4, label: "4 — Высокая" },
  { value: 5, label: "5 — Очень высокая" },
];

const SEVERITY_OPTIONS = [
  { value: 1, label: "1 — Незначительная" },
  { value: 2, label: "2 — Низкая" },
  { value: 3, label: "3 — Средняя" },
  { value: 4, label: "4 — Высокая" },
  { value: 5, label: "5 — Катастрофическая" },
];

function getRiskClass(level: number): string {
  if (level <= 4)  return "LOW";
  if (level <= 9)  return "MEDIUM";
  if (level <= 15) return "HIGH";
  return "CRITICAL";
}

/* ── Props ── */

interface RiskDetailModalProps {
  riskId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  riskId, isOpen, onClose, onAction,
}) => {
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"main" | "assessments" | "mitigations" | "ncs">("main");

  // Linked NCs
  const [linkedNCs, setLinkedNCs] = useState<any[]>([]);
  const [ncsLoading, setNcsLoading] = useState(false);

  // Assessment form
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [assessType, setAssessType] = useState("PERIODIC");
  const [assessProbability, setAssessProbability] = useState(3);
  const [assessSeverity, setAssessSeverity] = useState(3);
  const [assessRationale, setAssessRationale] = useState("");

  // Mitigation form
  const [showAddMitigation, setShowAddMitigation] = useState(false);
  const [mitigationType, setMitigationType] = useState("PROCESS_CONTROL");
  const [mitigationDesc, setMitigationDesc] = useState("");

  // Accept risk form
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [acceptDecision, setAcceptDecision] = useState("");
  const [acceptJustification, setAcceptJustification] = useState("");

  // Verify mitigation form
  const [verifyMitigationId, setVerifyMitigationId] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState("");

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await risksApi.getOne(riskId);
      setRisk(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  const fetchLinkedNCs = useCallback(async () => {
    setNcsLoading(true);
    try {
      const res = await risksApi.getLinkedNCs(riskId);
      setLinkedNCs(Array.isArray(res) ? res : res?.rows || []);
    } catch {
      setLinkedNCs([]);
    } finally {
      setNcsLoading(false);
    }
  }, [riskId]);

  useEffect(() => { if (isOpen) fetchDetail(); }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && tab === "ncs") fetchLinkedNCs();
  }, [isOpen, tab, fetchLinkedNCs]);

  /* ── Actions ── */
  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
      await fetchDetail();
      onAction();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAssessment = () => {
    if (!assessRationale.trim()) return;
    doAction(() => risksApi.addAssessment(riskId, {
      type: assessType,
      probability: assessProbability,
      severity: assessSeverity,
      rationale: assessRationale.trim(),
    }));
    setAssessRationale(""); setAssessProbability(3); setAssessSeverity(3);
    setShowAddAssessment(false);
  };

  const handleAddMitigation = () => {
    if (!mitigationDesc.trim()) return;
    doAction(() => risksApi.addMitigation(riskId, {
      mitigationType,
      description: mitigationDesc.trim(),
    }));
    setMitigationDesc(""); setMitigationType("PROCESS_CONTROL");
    setShowAddMitigation(false);
  };

  const handleCompleteMitigation = (mitigationId: number) => {
    doAction(() => risksApi.completeMitigation(mitigationId));
  };

  const handleVerifyMitigation = () => {
    if (verifyMitigationId === null) return;
    doAction(() => risksApi.verifyMitigation(verifyMitigationId!, {
      result: verifyResult.trim() || undefined,
    }));
    setVerifyMitigationId(null); setVerifyResult("");
  };

  const handleAcceptRisk = () => {
    if (!acceptDecision.trim()) return;
    doAction(() => risksApi.acceptRisk(riskId, {
      decision: acceptDecision.trim(),
      justification: acceptJustification.trim() || undefined,
    }));
    setAcceptDecision(""); setAcceptJustification("");
    setShowAcceptForm(false);
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtPerson = (p: any) => p ? `${p.surname} ${p.name}` : "\u2014";

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  const tabs = [
    { key: "main",        label: "Основное" },
    { key: "assessments", label: "Оценки" },
    { key: "mitigations", label: "Меры снижения" },
    { key: "ncs",         label: "Связанные NC" },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <AlertTriangle className="mx-auto text-red-400 mb-2" size={32} />
          <p className="text-red-400 text-[13px]">{error}</p>
          <ActionBtn variant="secondary" onClick={fetchDetail} className="mt-3">Повторить</ActionBtn>
        </div>
      )}

      {!loading && !error && risk && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{risk.number || `RISK-${risk.id}`}</span>
                {risk.riskClass && (
                  <Badge color={CLASS_COLORS[risk.riskClass]?.color || "#8899AB"} bg={CLASS_COLORS[risk.riskClass]?.bg || "rgba(58,78,98,0.25)"}>
                    {risk.riskClass}
                  </Badge>
                )}
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[risk.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">{STATUS_LABELS[risk.status] || risk.status}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{risk.title}</h2>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Категория", value: risk.category },
              { label: "Владелец", value: fmtPerson(risk.owner) },
              { label: "Начальный P\u00d7S", value: `${risk.initialProbability || "\u2014"}\u00d7${risk.initialSeverity || "\u2014"}=${risk.initialLevel || "\u2014"}` },
              { label: "Остаточный P\u00d7S", value: risk.residualProbability ? `${risk.residualProbability}\u00d7${risk.residualSeverity}=${risk.residualLevel}` : "\u2014" },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className="text-[13px] font-medium mt-0.5 text-asvo-text">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Workflow Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!["ACCEPTED", "CLOSED"].includes(risk.status) && (
              <ActionBtn
                variant="primary"
                icon={<ShieldCheck size={14} />}
                onClick={() => setShowAcceptForm((v) => !v)}
                disabled={actionLoading}
              >
                Принять риск
              </ActionBtn>
            )}
            {actionError && <span className="text-red-400 text-[12px]">{actionError}</span>}
          </div>

          {/* Accept risk form */}
          {showAcceptForm && (
            <div className="border border-asvo-border rounded-lg p-4 space-y-3">
              <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                <ShieldCheck size={14} className="text-asvo-accent" /> Принятие риска
              </h4>
              <div>
                <label className={labelCls}>Решение <span className="text-red-400">*</span></label>
                <input value={acceptDecision} onChange={(e) => setAcceptDecision(e.target.value)} placeholder="Решение по принятию риска" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Обоснование</label>
                <textarea value={acceptJustification} onChange={(e) => setAcceptJustification(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Обоснование принятия риска..." />
              </div>
              <div className="flex gap-2">
                <ActionBtn variant="primary" onClick={handleAcceptRisk} disabled={actionLoading}>Подтвердить</ActionBtn>
                <ActionBtn variant="secondary" onClick={() => setShowAcceptForm(false)}>Отмена</ActionBtn>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                  tab === t.key ? "text-asvo-accent border-asvo-accent" : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">

            {/* ── Tab: Основное ── */}
            {tab === "main" && (
              <>
                {risk.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{risk.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-asvo-text-dim">Категория:</span> <span className="text-asvo-text ml-1">{risk.category}</span></div>
                  <div><span className="text-asvo-text-dim">Статус:</span> <span className="text-asvo-text ml-1">{STATUS_LABELS[risk.status] || risk.status}</span></div>
                  <div><span className="text-asvo-text-dim">Владелец:</span> <span className="text-asvo-text ml-1">{fmtPerson(risk.owner)}</span></div>
                  <div><span className="text-asvo-text-dim">Создано:</span> <span className="text-asvo-text ml-1">{fmtDate(risk.createdAt)}</span></div>
                  {risk.reviewDate && <div><span className="text-asvo-text-dim">Дата пересмотра:</span> <span className="text-asvo-text ml-1">{fmtDate(risk.reviewDate)}</span></div>}
                  {risk.isoClause && <div><span className="text-asvo-text-dim">Пункт ISO:</span> <span className="text-asvo-text ml-1">{risk.isoClause}</span></div>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-asvo-surface rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Начальная оценка</div>
                    <div className="text-[13px] font-mono font-bold text-asvo-text">
                      P={risk.initialProbability} &times; S={risk.initialSeverity} = {risk.initialProbability * risk.initialSeverity}
                    </div>
                    {risk.riskClass && (
                      <Badge color={CLASS_COLORS[risk.riskClass]?.color} bg={CLASS_COLORS[risk.riskClass]?.bg}>
                        {risk.riskClass}
                      </Badge>
                    )}
                  </div>
                  <div className="bg-asvo-surface rounded-lg px-3 py-2">
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Остаточная оценка</div>
                    {risk.residualProbability ? (
                      <>
                        <div className="text-[13px] font-mono font-bold text-asvo-text">
                          P={risk.residualProbability} &times; S={risk.residualSeverity} = {risk.residualProbability * risk.residualSeverity}
                        </div>
                        <Badge color={CLASS_COLORS[risk.residualClass]?.color} bg={CLASS_COLORS[risk.residualClass]?.bg}>
                          {risk.residualClass}
                        </Badge>
                      </>
                    ) : (
                      <div className="text-[13px] text-asvo-text-dim">{"\u2014"}</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: Оценки ── */}
            {tab === "assessments" && (
              <>
                {/* Assessment list */}
                <div className="space-y-2">
                  {(risk.assessments || []).length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">Оценки не добавлены</p>
                  ) : (
                    (risk.assessments || []).map((a: any) => {
                      const lvl = a.probability * a.severity;
                      const cls = getRiskClass(lvl);
                      const clsColors = CLASS_COLORS[cls];
                      return (
                        <div key={a.id} className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2 flex-wrap">
                          <span className="text-[11px] text-asvo-text-dim">{fmtDate(a.createdAt || a.assessedAt)}</span>
                          <Badge variant="audit">
                            {ASSESSMENT_TYPES.find((t) => t.value === a.type)?.label || a.type}
                          </Badge>
                          <span className="text-[12px] font-mono text-asvo-text">
                            P={a.probability} &times; S={a.severity} = {lvl}
                          </span>
                          <Badge color={clsColors?.color} bg={clsColors?.bg}>{cls}</Badge>
                          <span className="text-[12px] text-asvo-text-mid flex-1 truncate">{a.rationale}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add assessment form */}
                {!showAddAssessment ? (
                  <button onClick={() => setShowAddAssessment(true)} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1">
                    <Plus size={12} /> Добавить оценку
                  </button>
                ) : (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <div>
                      <label className={labelCls}>Тип оценки</label>
                      <select value={assessType} onChange={(e) => setAssessType(e.target.value)} className={inputCls}>
                        {ASSESSMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Вероятность (P)</label>
                        <select value={assessProbability} onChange={(e) => setAssessProbability(Number(e.target.value))} className={inputCls}>
                          {PROBABILITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Тяжесть (S)</label>
                        <select value={assessSeverity} onChange={(e) => setAssessSeverity(Number(e.target.value))} className={inputCls}>
                          {SEVERITY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Preview */}
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-asvo-text-dim">Уровень:</span>
                      <span className="font-mono font-bold text-asvo-text">{assessProbability * assessSeverity}</span>
                      <Badge
                        color={CLASS_COLORS[getRiskClass(assessProbability * assessSeverity)]?.color}
                        bg={CLASS_COLORS[getRiskClass(assessProbability * assessSeverity)]?.bg}
                      >
                        {getRiskClass(assessProbability * assessSeverity)}
                      </Badge>
                    </div>
                    <div>
                      <label className={labelCls}>Обоснование <span className="text-red-400">*</span></label>
                      <textarea value={assessRationale} onChange={(e) => setAssessRationale(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Обоснование оценки рисков..." />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn variant="primary" onClick={handleAddAssessment} disabled={actionLoading}>Добавить</ActionBtn>
                      <ActionBtn variant="secondary" onClick={() => setShowAddAssessment(false)}>Отмена</ActionBtn>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Меры снижения ── */}
            {tab === "mitigations" && (
              <>
                {/* Mitigation list */}
                <div className="space-y-2">
                  {(risk.mitigations || []).length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">Меры снижения не добавлены</p>
                  ) : (
                    (risk.mitigations || []).map((m: any) => (
                      <div key={m.id} className="bg-asvo-surface rounded-lg px-3 py-2 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="risk">
                            {MITIGATION_TYPES.find((t) => t.value === m.mitigationType)?.label || m.mitigationType}
                          </Badge>
                          <span className="text-[13px] text-asvo-text flex-1">{m.description}</span>
                          <Badge variant={m.status === "VERIFIED" ? "sop" : m.status === "COMPLETED" ? "training" : m.status === "IN_PROGRESS" ? "capa" : "closed"}>
                            {MITIGATION_STATUS_LABELS[m.status] || m.status}
                          </Badge>
                          {m.capaId && (
                            <span className="flex items-center gap-1 text-[11px] text-asvo-accent">
                              <Link2 size={10} /> CAPA #{m.capaId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {m.status !== "COMPLETED" && m.status !== "VERIFIED" && m.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCompleteMitigation(m.id)}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50"
                            >
                              Завершить
                            </button>
                          )}
                          {m.status === "COMPLETED" && (
                            <button
                              onClick={() => setVerifyMitigationId(m.id)}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-[#4A90E8]/15 text-[#4A90E8] text-[10px] font-medium hover:bg-[#4A90E8]/25 transition-colors disabled:opacity-50"
                            >
                              Верифицировать
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Verify mitigation form */}
                {verifyMitigationId !== null && (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-asvo-accent" /> Верификация меры #{verifyMitigationId}
                    </h4>
                    <div>
                      <label className={labelCls}>Результат верификации</label>
                      <textarea value={verifyResult} onChange={(e) => setVerifyResult(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Результат верификации эффективности меры..." />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn variant="primary" icon={<CheckCircle2 size={14} />} onClick={handleVerifyMitigation} disabled={actionLoading}>Верифицировать</ActionBtn>
                      <ActionBtn variant="secondary" onClick={() => setVerifyMitigationId(null)}>Отмена</ActionBtn>
                    </div>
                  </div>
                )}

                {/* Add mitigation form */}
                {!showAddMitigation ? (
                  <button onClick={() => setShowAddMitigation(true)} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1">
                    <Plus size={12} /> Добавить меру снижения
                  </button>
                ) : (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <div>
                      <label className={labelCls}>Тип меры</label>
                      <select value={mitigationType} onChange={(e) => setMitigationType(e.target.value)} className={inputCls}>
                        {MITIGATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Описание <span className="text-red-400">*</span></label>
                      <textarea value={mitigationDesc} onChange={(e) => setMitigationDesc(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Описание меры снижения риска..." />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn variant="primary" onClick={handleAddMitigation} disabled={actionLoading}>Добавить</ActionBtn>
                      <ActionBtn variant="secondary" onClick={() => setShowAddMitigation(false)}>Отмена</ActionBtn>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Связанные NC ── */}
            {tab === "ncs" && (
              <>
                {ncsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
                  </div>
                ) : linkedNCs.length === 0 ? (
                  <p className="text-[13px] text-asvo-text-dim">Связанные несоответствия не найдены</p>
                ) : (
                  <div className="space-y-2">
                    {linkedNCs.map((nc: any) => (
                      <div key={nc.id} className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2">
                        <span className="font-mono text-[12px] font-bold text-asvo-accent">{nc.number}</span>
                        <span className="text-[12px] text-asvo-text flex-1">{nc.title}</span>
                        <Badge variant={nc.status === "CLOSED" ? "sop" : "nc"}>
                          {nc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RiskDetailModal;

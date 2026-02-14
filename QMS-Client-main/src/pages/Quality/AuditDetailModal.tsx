/**
 * AuditDetailModal.tsx — Детальный просмотр и управление аудитом (schedule)
 * ISO 13485 §8.2.4 — Внутренний аудит: чек-лист, findings, workflow
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Plus,
  Send,
  Save,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { internalAuditsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Constants ── */

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Запланирован",
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершён",
};

const STATUS_DOT: Record<string, "amber" | "blue" | "accent" | "grey"> = {
  PLANNED: "amber",
  IN_PROGRESS: "blue",
  COMPLETED: "accent",
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  PLANNED: { next: "IN_PROGRESS", label: "Начать аудит" },
  IN_PROGRESS: { next: "COMPLETED", label: "Завершить аудит" },
};

const FINDING_TYPES = [
  { value: "MAJOR_NC", label: "Критическое NC" },
  { value: "MINOR_NC", label: "Незначительное NC" },
  { value: "OBSERVATION", label: "Наблюдение" },
  { value: "OPPORTUNITY", label: "Возможность улучшения" },
  { value: "POSITIVE", label: "Позитивное замечание" },
];

const FINDING_TYPE_BADGE: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  MAJOR_NC: {
    color: "#F06060",
    bg: "rgba(240,96,96,0.12)",
    label: "Критическое NC",
  },
  MINOR_NC: {
    color: "#E8A830",
    bg: "rgba(232,168,48,0.12)",
    label: "Незначительное NC",
  },
  OBSERVATION: {
    color: "#4A90E8",
    bg: "rgba(74,144,232,0.12)",
    label: "Наблюдение",
  },
  OPPORTUNITY: {
    color: "#A06AE8",
    bg: "rgba(160,106,232,0.12)",
    label: "Возможность",
  },
  POSITIVE: {
    color: "#2DD4A8",
    bg: "rgba(45,212,168,0.12)",
    label: "Позитивное",
  },
};

const RESPONSE_STATUSES = [
  { value: "CONFORMING", label: "Соответствует" },
  { value: "NON_CONFORMING", label: "Не соответствует" },
  { value: "OBSERVATION", label: "Наблюдение" },
  { value: "NOT_APPLICABLE", label: "Неприменимо" },
];

const RESPONSE_BADGE: Record<string, { color: string; bg: string }> = {
  CONFORMING: { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  NON_CONFORMING: { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  OBSERVATION: { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  NOT_APPLICABLE: { color: "#8899AB", bg: "rgba(136,153,171,0.12)" },
};

/* ── Props ── */

interface AuditDetailModalProps {
  auditId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  auditId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "main" | "checklist" | "findings" | "actions"
  >("main");

  /* Checklist state */
  const [checklistResponses, setChecklistResponses] = useState<any[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  /* Finding form */
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [newFindingType, setNewFindingType] = useState("MINOR_NC");
  const [newFindingClause, setNewFindingClause] = useState("");
  const [newFindingDesc, setNewFindingDesc] = useState("");
  const [newFindingEvidence, setNewFindingEvidence] = useState("");

  /* ── Fetch detail ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await internalAuditsApi.getScheduleOne(auditId);
      setAudit(d);

      /* If responses are embedded, use them */
      if (d.checklistResponses && d.checklistResponses.length > 0) {
        setChecklistResponses(d.checklistResponses);
        setChecklistLoaded(true);
      } else {
        setChecklistLoaded(false);
        setChecklistResponses([]);
      }
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Ошибка загрузки аудита"
      );
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    if (isOpen) {
      setTab("main");
      fetchDetail();
    }
  }, [isOpen, fetchDetail]);

  /* ── Generic action wrapper ── */
  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
      await fetchDetail();
      onAction();
    } catch (e: any) {
      setActionError(
        e.response?.data?.message || e.message || "Ошибка"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Status transition ── */
  const handleStatusTransition = () => {
    if (!audit) return;
    const flow = STATUS_FLOW[audit.status];
    if (!flow) return;
    doAction(() =>
      internalAuditsApi.updateSchedule(audit.id, { status: flow.next })
    );
  };

  /* ── Init checklist ── */
  const handleInitChecklist = () => {
    doAction(async () => {
      const res = await internalAuditsApi.initChecklist(audit.id, {
        clauses: ["4", "5", "6", "7", "8"],
      });
      if (res.responses) {
        setChecklistResponses(res.responses);
        setChecklistLoaded(true);
      }
    });
  };

  /* ── Update response locally ── */
  const updateLocalResponse = (
    idx: number,
    field: string,
    value: string
  ) => {
    setChecklistResponses((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  /* ── Save checklist responses ── */
  const handleSaveChecklist = () => {
    doAction(() =>
      internalAuditsApi.bulkUpdateResponses(audit.id, {
        responses: checklistResponses.map((r: any) => ({
          id: r.id,
          status: r.status,
          evidence: r.evidence || "",
          notes: r.notes || "",
        })),
      })
    );
  };

  /* ── Add finding ── */
  const handleAddFinding = () => {
    if (!newFindingDesc.trim()) return;
    doAction(() =>
      internalAuditsApi.addFinding(audit.id, {
        type: newFindingType,
        isoClause: newFindingClause.trim() || undefined,
        description: newFindingDesc.trim(),
        evidence: newFindingEvidence.trim() || undefined,
      })
    );
    setNewFindingType("MINOR_NC");
    setNewFindingClause("");
    setNewFindingDesc("");
    setNewFindingEvidence("");
    setShowAddFinding(false);
  };

  /* ── Create CAPA from finding ── */
  const handleCreateCapa = (findingId: number) => {
    doAction(() => internalAuditsApi.createCapaFromFinding(findingId));
  };

  /* ── Distribute report ── */
  const handleDistributeReport = () => {
    doAction(() => internalAuditsApi.distributeReport(audit.id));
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const fmtPerson = (p: any) =>
    p ? `${p.surname || ""} ${p.name || ""}`.trim() : "\u2014";

  const tabs = [
    { key: "main" as const, label: "\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0435" },
    { key: "checklist" as const, label: "\u0427\u0435\u043A-\u043B\u0438\u0441\u0442" },
    { key: "findings" as const, label: "Findings" },
    { key: "actions" as const, label: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-10">
          <AlertTriangle className="mx-auto text-red-400 mb-2" size={32} />
          <p className="text-red-400 text-[13px]">{error}</p>
          <ActionBtn
            variant="secondary"
            onClick={fetchDetail}
            className="mt-3"
          >
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && audit && (
        <div className="space-y-5">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">
                  {audit.number || `#${audit.id}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusDot
                    color={STATUS_DOT[audit.status] || "grey"}
                  />
                  <span className="text-asvo-text text-[13px]">
                    {STATUS_LABELS[audit.status] || audit.status}
                  </span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text">
                {audit.title}
              </h2>
            </div>
          </div>

          {/* ── Metadata cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ведущий аудитор", value: fmtPerson(audit.leadAuditor) },
              { label: "Аудитируемый", value: fmtPerson(audit.auditee) },
              { label: "Плановая дата", value: fmtDate(audit.plannedDate) },
              { label: "Фактическая дата", value: fmtDate(audit.actualDate) },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2"
              >
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">
                  {m.label}
                </div>
                <div className="text-[13px] font-medium mt-0.5 text-asvo-text">
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Workflow actions ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW[audit.status] && (
              <ActionBtn
                variant="primary"
                icon={<ArrowRight size={14} />}
                onClick={handleStatusTransition}
                disabled={actionLoading}
              >
                {STATUS_FLOW[audit.status].label}
              </ActionBtn>
            )}
            {actionError && (
              <span className="text-red-400 text-[12px]">{actionError}</span>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map((t) => (
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

          {/* ── Tab content ── */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
            {/* ======== TAB: Main ======== */}
            {tab === "main" && (
              <>
                {audit.scope && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">
                      Область аудита
                    </div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">
                      {audit.scope}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  {audit.isoClause && (
                    <div>
                      <span className="text-asvo-text-dim">Пункт ISO:</span>{" "}
                      <span className="text-asvo-text ml-1">
                        {audit.isoClause}
                      </span>
                    </div>
                  )}
                  {audit.criteria && (
                    <div>
                      <span className="text-asvo-text-dim">Критерии:</span>{" "}
                      <span className="text-asvo-text ml-1">
                        {audit.criteria}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-asvo-text-dim">Плановая дата:</span>{" "}
                    <span className="text-asvo-text ml-1">
                      {fmtDate(audit.plannedDate)}
                    </span>
                  </div>
                  {audit.actualDate && (
                    <div>
                      <span className="text-asvo-text-dim">
                        Фактическая дата:
                      </span>{" "}
                      <span className="text-asvo-text ml-1">
                        {fmtDate(audit.actualDate)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-asvo-text-dim">Ведущий аудитор:</span>{" "}
                    <span className="text-asvo-text ml-1">
                      {fmtPerson(audit.leadAuditor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Аудитируемый:</span>{" "}
                    <span className="text-asvo-text ml-1">
                      {fmtPerson(audit.auditee)}
                    </span>
                  </div>
                </div>

                {audit.conclusion && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">
                      Заключение
                    </div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">
                      {audit.conclusion}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ======== TAB: Checklist ======== */}
            {tab === "checklist" && (
              <>
                {!checklistLoaded ? (
                  <div className="flex flex-col items-center justify-center py-10 text-asvo-text-dim">
                    <ClipboardList
                      size={40}
                      className="mb-3 opacity-30"
                    />
                    <p className="text-[13px] mb-4">
                      Чек-лист ещё не инициализирован
                    </p>
                    <ActionBtn
                      variant="primary"
                      icon={<Plus size={14} />}
                      onClick={handleInitChecklist}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Инициализация..."
                        : "Инициализировать чек-лист"}
                    </ActionBtn>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {checklistResponses.map((r: any, idx: number) => (
                        <div
                          key={r.id || idx}
                          className="bg-asvo-surface rounded-lg px-3 py-3 space-y-2"
                        >
                          {/* Question */}
                          <p className="text-[13px] text-asvo-text font-medium">
                            {r.question ||
                              r.checklistItem?.question ||
                              `Вопрос #${idx + 1}`}
                          </p>

                          {/* Status select */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={labelCls}>Статус</label>
                              <select
                                value={r.status || "CONFORMING"}
                                onChange={(e) =>
                                  updateLocalResponse(
                                    idx,
                                    "status",
                                    e.target.value
                                  )
                                }
                                className={inputCls}
                              >
                                {RESPONSE_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>
                                Свидетельства
                              </label>
                              <input
                                value={r.evidence || ""}
                                onChange={(e) =>
                                  updateLocalResponse(
                                    idx,
                                    "evidence",
                                    e.target.value
                                  )
                                }
                                placeholder="Объективные свидетельства"
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Примечания</label>
                              <input
                                value={r.notes || ""}
                                onChange={(e) =>
                                  updateLocalResponse(
                                    idx,
                                    "notes",
                                    e.target.value
                                  )
                                }
                                placeholder="Примечания"
                                className={inputCls}
                              />
                            </div>
                          </div>

                          {/* Status badge */}
                          {r.status && RESPONSE_BADGE[r.status] && (
                            <Badge
                              color={RESPONSE_BADGE[r.status].color}
                              bg={RESPONSE_BADGE[r.status].bg}
                            >
                              {RESPONSE_STATUSES.find(
                                (s) => s.value === r.status
                              )?.label || r.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Save button */}
                    <div className="pt-2">
                      <ActionBtn
                        variant="primary"
                        icon={<Save size={14} />}
                        onClick={handleSaveChecklist}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? "Сохранение..."
                          : "Сохранить ответы"}
                      </ActionBtn>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ======== TAB: Findings ======== */}
            {tab === "findings" && (
              <>
                {/* Existing findings */}
                <div className="space-y-2">
                  {(audit.findings || []).length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">
                      Замечания не зарегистрированы
                    </p>
                  ) : (
                    (audit.findings || []).map((f: any) => {
                      const badge =
                        FINDING_TYPE_BADGE[f.type] ||
                        FINDING_TYPE_BADGE.OBSERVATION;
                      return (
                        <div
                          key={f.id}
                          className="bg-asvo-surface rounded-lg px-3 py-2 space-y-1"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[12px] text-asvo-text-dim">
                              {f.findingNumber || `F-${f.id}`}
                            </span>
                            <Badge color={badge.color} bg={badge.bg}>
                              {badge.label}
                            </Badge>
                            {f.isoClause && (
                              <span className="text-[11px] text-asvo-text-dim">
                                ISO {f.isoClause}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-asvo-text">
                            {f.description}
                          </p>
                          {f.evidence && (
                            <p className="text-[12px] text-asvo-text-dim italic">
                              {f.evidence}
                            </p>
                          )}
                          <div className="pt-1">
                            <button
                              onClick={() => handleCreateCapa(f.id)}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-[#E8A830]/15 text-[#E8A830] text-[10px] font-medium hover:bg-[#E8A830]/25 transition-colors disabled:opacity-50"
                            >
                              Создать CAPA
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add finding form */}
                {showAddFinding ? (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Тип</label>
                        <select
                          value={newFindingType}
                          onChange={(e) =>
                            setNewFindingType(e.target.value)
                          }
                          className={inputCls}
                        >
                          {FINDING_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Пункт ISO</label>
                        <input
                          value={newFindingClause}
                          onChange={(e) =>
                            setNewFindingClause(e.target.value)
                          }
                          placeholder="7.4.1"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Описание <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={newFindingDesc}
                        onChange={(e) =>
                          setNewFindingDesc(e.target.value)
                        }
                        placeholder="Описание замечания..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        Объективные свидетельства
                      </label>
                      <textarea
                        value={newFindingEvidence}
                        onChange={(e) =>
                          setNewFindingEvidence(e.target.value)
                        }
                        placeholder="Свидетельства, подтверждающие замечание..."
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn
                        variant="primary"
                        onClick={handleAddFinding}
                        disabled={actionLoading}
                      >
                        Добавить
                      </ActionBtn>
                      <ActionBtn
                        variant="secondary"
                        onClick={() => setShowAddFinding(false)}
                      >
                        Отмена
                      </ActionBtn>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddFinding(true)}
                    className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Добавить замечание
                  </button>
                )}
              </>
            )}

            {/* ======== TAB: Actions ======== */}
            {tab === "actions" && (
              <div className="space-y-4">
                <ActionBtn
                  variant="primary"
                  icon={<Send size={14} />}
                  onClick={handleDistributeReport}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Отправка..."
                    : "Распространить отчёт"}
                </ActionBtn>

                <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
                  <p className="text-[11px] text-asvo-text-dim leading-relaxed">
                    <CheckCircle2
                      size={12}
                      className="inline mr-1 text-asvo-accent"
                    />
                    Отчёт аудита будет распространён всем заинтересованным
                    сторонам в соответствии с ISO 13485 §8.2.4.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AuditDetailModal;

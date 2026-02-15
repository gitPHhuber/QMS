/**
 * ComplaintDetailModal.tsx — Detail view and management of a complaint
 * ISO 13485 §8.2.2 — Complaint handling workflow, investigation, vigilance
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, ArrowRight, Clock, Shield, Send, CheckCircle2,
  Link2, MessageSquareWarning,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { complaintsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* ── Constants ── */

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Получена",
  UNDER_REVIEW: "На рассмотрении",
  INVESTIGATING: "Расследование",
  RESOLVED: "Решена",
  CLOSED: "Закрыта",
  REJECTED: "Отклонена",
};

const STATUS_DOT: Record<string, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey"> = {
  RECEIVED: "blue",
  UNDER_REVIEW: "amber",
  INVESTIGATING: "purple",
  RESOLVED: "accent",
  CLOSED: "accent",
  REJECTED: "red",
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  RECEIVED:      { next: "UNDER_REVIEW",  label: "Принять на рассмотрение" },
  UNDER_REVIEW:  { next: "INVESTIGATING", label: "Начать расследование" },
  INVESTIGATING: { next: "RESOLVED",      label: "Отметить как решённую" },
  RESOLVED:      { next: "CLOSED",        label: "Закрыть рекламацию" },
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Критическая",
  MAJOR: "Значительная",
  MINOR: "Незначительная",
  INFORMATIONAL: "Информационная",
};

const SOURCE_LABELS: Record<string, string> = {
  CUSTOMER: "Заказчик",
  DISTRIBUTOR: "Дистрибьютор",
  INTERNAL: "Внутренний",
  REGULATOR: "Регулятор",
  FIELD_REPORT: "Полевой отчёт",
};

const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: "Безопасность",
  PERFORMANCE: "Производительность",
  LABELING: "Маркировка",
  PACKAGING: "Упаковка",
  DOCUMENTATION: "Документация",
  DELIVERY: "Доставка",
  SERVICE: "Сервис",
  OTHER: "Другое",
};

const TYPE_LABELS: Record<string, string> = {
  COMPLAINT: "Рекламация",
  RECLAMATION: "Рекламация (возврат)",
  FEEDBACK: "Обратная связь",
};

const SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  CRITICAL:      { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  MAJOR:         { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  MINOR:         { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  INFORMATIONAL: { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
};

/* ── Props ── */

interface ComplaintDetailModalProps {
  complaintId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaintId, isOpen, onClose, onAction,
}) => {
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"main" | "investigation" | "vigilance" | "links">("main");

  /* Investigation form */
  const [investigationSummary, setInvestigationSummary] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");

  /* Vigilance form */
  const [vigilanceReportNumber, setVigilanceReportNumber] = useState("");
  const [vigilanceNotes, setVigilanceNotes] = useState("");
  const [regulatoryAuthorityRef, setRegulatoryAuthorityRef] = useState("");

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await complaintsApi.getOne(complaintId);
      setComplaint(d);
      /* Populate investigation fields */
      setInvestigationSummary(d.investigationSummary || "");
      setRootCause(d.rootCause || "");
      setCorrectiveAction(d.correctiveAction || "");
      setPreventiveAction(d.preventiveAction || "");
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => { if (isOpen) fetchDetail(); }, [isOpen, fetchDetail]);

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

  const handleStatusTransition = () => {
    if (!complaint) return;
    const flow = STATUS_FLOW[complaint.status];
    if (!flow) return;
    doAction(() => complaintsApi.update(complaint.id, { status: flow.next }));
  };

  const handleSaveInvestigation = () => {
    doAction(() => complaintsApi.update(complaint.id, {
      investigationSummary: investigationSummary.trim() || undefined,
      rootCause: rootCause.trim() || undefined,
      correctiveAction: correctiveAction.trim() || undefined,
      preventiveAction: preventiveAction.trim() || undefined,
    }));
  };

  const handleSubmitVigilance = () => {
    if (!vigilanceReportNumber.trim()) { setActionError("Укажите номер отчёта"); return; }
    doAction(() => complaintsApi.submitVigilance(complaint.id, {
      reportNumber: vigilanceReportNumber.trim(),
      notes: vigilanceNotes.trim() || undefined,
    }));
    setVigilanceReportNumber("");
    setVigilanceNotes("");
  };

  const handleAcknowledgeVigilance = () => {
    if (!regulatoryAuthorityRef.trim()) { setActionError("Укажите ссылку регулятора"); return; }
    doAction(() => complaintsApi.acknowledgeVigilance(complaint.id, {
      regulatoryAuthorityRef: regulatoryAuthorityRef.trim(),
    }));
    setRegulatoryAuthorityRef("");
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtPerson = (p: any) => p ? `${p.surname} ${p.name}` : "\u2014";

  const isVigilanceOverdue = complaint?.vigilanceDeadline &&
    new Date(complaint.vigilanceDeadline) < new Date() &&
    complaint.vigilanceStatus !== "SUBMITTED" &&
    complaint.vigilanceStatus !== "ACKNOWLEDGED";

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  const tabs = [
    { key: "main",          label: "Основное" },
    { key: "investigation", label: "Расследование" },
    { key: "vigilance",     label: "Vigilance" },
    { key: "links",         label: "Связи" },
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

      {!loading && !error && complaint && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{complaint.number || complaint.id}</span>
                <Badge color={SEVERITY_COLORS[complaint.severity]?.color || "#8899AB"} bg={SEVERITY_COLORS[complaint.severity]?.bg || "rgba(58,78,98,0.15)"}>
                  {SEVERITY_LABELS[complaint.severity] || complaint.severity}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[complaint.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">{STATUS_LABELS[complaint.status] || complaint.status}</span>
                </span>
                {complaint.isReportable && (
                  <Badge color="#F06060" bg="rgba(240,96,96,0.12)">Vigilance</Badge>
                )}
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{complaint.title}</h2>
            </div>
          </div>

          {/* Metadata cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Тип", value: TYPE_LABELS[complaint.complaintType] || complaint.complaintType },
              { label: "Источник", value: SOURCE_LABELS[complaint.source] || complaint.source },
              { label: "Категория", value: CATEGORY_LABELS[complaint.category] || complaint.category },
              { label: "Ответственный", value: fmtPerson(complaint.responsible || complaint.assignedTo) },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className="text-[13px] font-medium mt-0.5 text-asvo-text">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Workflow */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW[complaint.status] && (
              <ActionBtn variant="primary" icon={<ArrowRight size={14} />} onClick={handleStatusTransition} disabled={actionLoading}>
                {STATUS_FLOW[complaint.status].label}
              </ActionBtn>
            )}
            {actionError && <span className="text-red-400 text-[12px]">{actionError}</span>}
          </div>

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

          {/* Tab content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">

            {/* ---- TAB: Main ---- */}
            {tab === "main" && (
              <>
                {/* Description */}
                {complaint.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{complaint.description}</p>
                  </div>
                )}

                {/* Reporter info */}
                <div>
                  <div className="text-[10px] text-asvo-text-dim uppercase mb-2">Информация о заявителе</div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div><span className="text-asvo-text-dim">Имя:</span> <span className="text-asvo-text ml-1">{complaint.reporterName || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Контакт:</span> <span className="text-asvo-text ml-1">{complaint.reporterContact || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Организация:</span> <span className="text-asvo-text ml-1">{complaint.reporterOrganization || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Страна:</span> <span className="text-asvo-text ml-1">{complaint.countryOfOccurrence || "\u2014"}</span></div>
                  </div>
                </div>

                {/* Product info */}
                <div>
                  <div className="text-[10px] text-asvo-text-dim uppercase mb-2">Информация о продукте</div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div><span className="text-asvo-text-dim">Продукт:</span> <span className="text-asvo-text ml-1">{complaint.productName || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Модель:</span> <span className="text-asvo-text ml-1">{complaint.productModel || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Серийный номер:</span> <span className="text-asvo-text ml-1">{complaint.serialNumber || "\u2014"}</span></div>
                    <div><span className="text-asvo-text-dim">Номер партии:</span> <span className="text-asvo-text ml-1">{complaint.lotNumber || "\u2014"}</span></div>
                  </div>
                </div>

                {/* Dates & flags */}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-asvo-text-dim">Дата получения:</span> <span className="text-asvo-text ml-1">{fmtDate(complaint.receivedDate)}</span></div>
                  <div><span className="text-asvo-text-dim">Дата события:</span> <span className="text-asvo-text ml-1">{fmtDate(complaint.eventDate)}</span></div>
                  <div><span className="text-asvo-text-dim">Создано:</span> <span className="text-asvo-text ml-1">{fmtDate(complaint.createdAt)}</span></div>
                  <div><span className="text-asvo-text-dim">Обновлено:</span> <span className="text-asvo-text ml-1">{fmtDate(complaint.updatedAt)}</span></div>
                  <div>
                    <span className="text-asvo-text-dim">Пациент вовлечён:</span>
                    <span className={`ml-1 ${complaint.patientInvolved ? "text-red-400 font-medium" : "text-asvo-text"}`}>
                      {complaint.patientInvolved ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Угроза здоровью:</span>
                    <span className={`ml-1 ${complaint.healthHazard ? "text-red-400 font-medium" : "text-asvo-text"}`}>
                      {complaint.healthHazard ? "Да" : "Нет"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ---- TAB: Investigation ---- */}
            {tab === "investigation" && (
              <>
                <div>
                  <label className={labelCls}>Резюме расследования</label>
                  <textarea value={investigationSummary} onChange={(e) => setInvestigationSummary(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Основные выводы расследования..." />
                </div>
                <div>
                  <label className={labelCls}>Корневая причина</label>
                  <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Результаты анализа корневой причины..." />
                </div>
                <div>
                  <label className={labelCls}>Корректирующее действие</label>
                  <textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Предпринятые корректирующие меры..." />
                </div>
                <div>
                  <label className={labelCls}>Предупреждающее действие</label>
                  <textarea value={preventiveAction} onChange={(e) => setPreventiveAction(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Предупреждающие меры для предотвращения повторения..." />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <ActionBtn variant="primary" icon={<CheckCircle2 size={14} />} onClick={handleSaveInvestigation} disabled={actionLoading}>
                    {actionLoading ? "Сохранение..." : "Сохранить"}
                  </ActionBtn>
                </div>
              </>
            )}

            {/* ---- TAB: Vigilance ---- */}
            {tab === "vigilance" && (
              <>
                {/* Vigilance status info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
                  <div>
                    <span className="text-asvo-text-dim">Подлежит уведомлению:</span>
                    <span className={`ml-1 font-medium ${complaint.isReportable ? "text-red-400" : "text-asvo-text"}`}>
                      {complaint.isReportable ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Статус Vigilance:</span>
                    <span className="text-asvo-text ml-1">{complaint.vigilanceStatus || "\u2014"}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Срок уведомления:</span>
                    <span className={`ml-1 ${isVigilanceOverdue ? "text-red-400 font-medium" : "text-asvo-text"}`}>
                      {fmtDate(complaint.vigilanceDeadline)}
                    </span>
                  </div>
                  {complaint.vigilanceReportNumber && (
                    <div>
                      <span className="text-asvo-text-dim">Номер отчёта:</span>
                      <span className="text-asvo-text ml-1 font-mono">{complaint.vigilanceReportNumber}</span>
                    </div>
                  )}
                  {complaint.regulatoryAuthorityRef && (
                    <div>
                      <span className="text-asvo-text-dim">Ссылка регулятора:</span>
                      <span className="text-asvo-text ml-1 font-mono">{complaint.regulatoryAuthorityRef}</span>
                    </div>
                  )}
                </div>

                {/* Overdue warning */}
                {isVigilanceOverdue && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <Clock size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-red-400 leading-relaxed">
                      Срок уведомления регулятора истёк ({fmtDate(complaint.vigilanceDeadline)}).
                      Необходимо немедленно отправить уведомление.
                    </p>
                  </div>
                )}

                {/* Submit vigilance form */}
                {complaint.isReportable && complaint.vigilanceStatus !== "SUBMITTED" && complaint.vigilanceStatus !== "ACKNOWLEDGED" && (
                  <div className="border border-asvo-border rounded-lg p-4 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <Shield size={14} className="text-red-400" /> Отправить уведомление
                    </h4>
                    <div>
                      <label className={labelCls}>Номер отчёта <span className="text-red-400">*</span></label>
                      <input value={vigilanceReportNumber} onChange={(e) => setVigilanceReportNumber(e.target.value)} placeholder="VIG-YYYY-NNNN" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Примечания</label>
                      <textarea value={vigilanceNotes} onChange={(e) => setVigilanceNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Дополнительная информация для регулятора..." />
                    </div>
                    <ActionBtn variant="primary" icon={<Send size={14} />} onClick={handleSubmitVigilance} disabled={actionLoading}>
                      {actionLoading ? "Отправка..." : "Отправить уведомление"}
                    </ActionBtn>
                  </div>
                )}

                {/* Acknowledge vigilance form */}
                {complaint.vigilanceStatus === "SUBMITTED" && (
                  <div className="border border-asvo-border rounded-lg p-4 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-asvo-accent" /> Подтвердить получение
                    </h4>
                    <div>
                      <label className={labelCls}>Ссылка регулятора <span className="text-red-400">*</span></label>
                      <input value={regulatoryAuthorityRef} onChange={(e) => setRegulatoryAuthorityRef(e.target.value)} placeholder="Номер/ссылка от регуляторного органа" className={inputCls} />
                    </div>
                    <ActionBtn variant="primary" icon={<CheckCircle2 size={14} />} onClick={handleAcknowledgeVigilance} disabled={actionLoading}>
                      {actionLoading ? "Сохранение..." : "Подтвердить получение"}
                    </ActionBtn>
                  </div>
                )}

                {/* Already acknowledged */}
                {complaint.vigilanceStatus === "ACKNOWLEDGED" && (
                  <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-asvo-accent mt-0.5 shrink-0" />
                    <p className="text-[12px] text-asvo-accent leading-relaxed">
                      Уведомление регулятора отправлено и подтверждено. Процесс Vigilance завершён.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ---- TAB: Links ---- */}
            {tab === "links" && (
              <>
                <div className="space-y-3">
                  {/* Linked NC */}
                  <div className="flex items-center gap-3 bg-asvo-surface rounded-lg px-4 py-3">
                    <Link2 size={16} className="text-asvo-text-dim shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Связанное несоответствие (NC)</div>
                      <div className="text-[13px] font-medium text-asvo-text mt-0.5">
                        {complaint.linkedNcId ? (
                          <span className="font-mono text-[#F06060]">NC-{complaint.linkedNcId}</span>
                        ) : (
                          <span className="text-asvo-text-dim">{"\u2014"} Не привязано</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linked CAPA */}
                  <div className="flex items-center gap-3 bg-asvo-surface rounded-lg px-4 py-3">
                    <Link2 size={16} className="text-asvo-text-dim shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">Связанное CAPA</div>
                      <div className="text-[13px] font-medium text-asvo-text mt-0.5">
                        {complaint.linkedCapaId ? (
                          <span className="font-mono text-[#E8A830]">CAPA-{complaint.linkedCapaId}</span>
                        ) : (
                          <span className="text-asvo-text-dim">{"\u2014"} Не привязано</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!complaint.linkedNcId && !complaint.linkedCapaId && (
                  <div className="text-center py-4">
                    <MessageSquareWarning size={28} className="mx-auto text-asvo-text-dim opacity-30 mb-2" />
                    <p className="text-[12px] text-asvo-text-dim">Нет связанных записей</p>
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

export default ComplaintDetailModal;

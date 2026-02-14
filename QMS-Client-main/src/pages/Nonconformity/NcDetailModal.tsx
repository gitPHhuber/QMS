/**
 * NcDetailModal.tsx — Детальный просмотр и управление несоответствием
 * ISO 13485 §8.3 — Workflow: OPEN → INVESTIGATING → DISPOSITION → IMPLEMENTING → VERIFICATION → CLOSED
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Search, Wrench,
  ShieldCheck, XCircle, Link2, Plus, ArrowRight,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { ncApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* ── Constants ── */

const STATUS_FLOW: Record<string, { next: string; label: string; icon: React.ReactNode; color: string }> = {
  OPEN:          { next: "INVESTIGATING", label: "Начать расследование", icon: <Search size={14} />,      color: "#4A90E8" },
  INVESTIGATING: { next: "DISPOSITION",   label: "Установить диспозицию", icon: <Wrench size={14} />,      color: "#A06AE8" },
  DISPOSITION:   { next: "IMPLEMENTING",  label: "Начать коррекцию",      icon: <ArrowRight size={14} />,  color: "#E87040" },
  IMPLEMENTING:  { next: "VERIFICATION",  label: "На верификацию",        icon: <ShieldCheck size={14} />, color: "#E8A830" },
  VERIFICATION:  { next: "CLOSED",        label: "Закрыть NC",            icon: <CheckCircle size={14} />, color: "#2DD4A8" },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыто", INVESTIGATING: "Расследование", DISPOSITION: "Диспозиция",
  IMPLEMENTING: "Коррекция", VERIFICATION: "Верификация", CLOSED: "Закрыто", REOPENED: "Переоткрыто",
};

const STATUS_DOT: Record<string, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey"> = {
  OPEN: "red", INVESTIGATING: "blue", DISPOSITION: "purple",
  IMPLEMENTING: "orange", VERIFICATION: "amber", CLOSED: "accent", REOPENED: "red",
};

const CLASSIFICATION_BADGE: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  MAJOR:    { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  MINOR:    { color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
};

const CLASSIFICATION_LABELS: Record<string, string> = { CRITICAL: "Критическое", MAJOR: "Серьёзное", MINOR: "Незначительное" };

const DISPOSITION_OPTIONS = [
  { value: "USE_AS_IS", label: "Использовать как есть" },
  { value: "REWORK", label: "Доработка" },
  { value: "REPAIR", label: "Ремонт" },
  { value: "SCRAP", label: "Утилизация" },
  { value: "RETURN_TO_SUPPLIER", label: "Возврат поставщику" },
  { value: "CONCESSION", label: "Уступка" },
  { value: "OTHER", label: "Другое" },
];

const ROOT_CAUSE_METHODS = [
  { value: "5WHY", label: "5 Почему" },
  { value: "FISHBONE", label: "Диаграмма Исикавы" },
  { value: "FMEA", label: "FMEA" },
  { value: "FTA", label: "Дерево отказов" },
  { value: "OTHER", label: "Другой метод" },
];

/* ── Props ── */

interface NcDetailModalProps {
  ncId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  onCreateCapa?: (ncId: number) => void;
}

/* ── Component ── */

const NcDetailModal: React.FC<NcDetailModalProps> = ({
  ncId, isOpen, onClose, onAction, onCreateCapa,
}) => {
  const [nc, setNc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"main" | "investigation" | "disposition">("main");
  const [users, setUsers] = useState<any[]>([]);

  // Editable fields
  const [rootCause, setRootCause] = useState("");
  const [rootCauseMethod, setRootCauseMethod] = useState("");
  const [disposition, setDisposition] = useState("");
  const [dispositionJustification, setDispositionJustification] = useState("");
  const [closingComment, setClosingComment] = useState("");

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await ncApi.getOne(ncId);
      setNc(d);
      setRootCause(d.rootCause || "");
      setRootCauseMethod(d.rootCauseMethod || "");
      setDisposition(d.disposition || "");
      setDispositionJustification(d.dispositionJustification || "");
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [ncId]);

  useEffect(() => { if (isOpen) fetchDetail(); }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
    }
  }, [isOpen, users.length]);

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
    if (!nc) return;
    const flow = STATUS_FLOW[nc.status];
    if (!flow) return;

    if (flow.next === "CLOSED") {
      doAction(() => ncApi.close(nc.id, { closingComment: closingComment.trim() || undefined }));
    } else {
      const updateData: Record<string, any> = { status: flow.next };
      if (nc.status === "INVESTIGATING") {
        updateData.rootCause = rootCause.trim() || undefined;
        updateData.rootCauseMethod = rootCauseMethod || undefined;
      }
      if (nc.status === "DISPOSITION") {
        updateData.disposition = disposition || undefined;
        updateData.dispositionJustification = dispositionJustification.trim() || undefined;
      }
      doAction(() => ncApi.update(nc.id, updateData));
    }
  };

  const handleSaveField = (field: string, value: any) => {
    doAction(() => ncApi.update(nc.id, { [field]: value }));
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const fmtDateTime = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const fmtPerson = (p: any) => p ? `${p.surname} ${p.name}` : "—";

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text focus:border-asvo-accent/50 focus:outline-none transition-colors";

  const tabs = [
    { key: "main", label: "Основное" },
    { key: "investigation", label: "Расследование" },
    { key: "disposition", label: "Диспозиция" },
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

      {!loading && !error && nc && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{nc.number}</span>
                <Badge color={CLASSIFICATION_BADGE[nc.classification]?.color || "#8899AB"} bg={CLASSIFICATION_BADGE[nc.classification]?.bg || "rgba(58,78,98,0.25)"}>
                  {CLASSIFICATION_LABELS[nc.classification] || nc.classification}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[nc.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">{STATUS_LABELS[nc.status] || nc.status}</span>
                </span>
                {nc.capaRequired && <Badge variant="capa">CAPA</Badge>}
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{nc.title}</h2>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Источник", value: nc.source },
              { label: "Обнаружено", value: fmtDate(nc.detectedAt || nc.createdAt) },
              { label: "Ответственный", value: fmtPerson(nc.assignedTo) },
              { label: "Срок", value: fmtDate(nc.dueDate), isOverdue: nc.dueDate && new Date(nc.dueDate) < new Date() && nc.status !== "CLOSED" },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className={`text-[13px] font-medium mt-0.5 ${(m as any).isOverdue ? "text-red-400" : "text-asvo-text"}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Workflow Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW[nc.status] && (
              <ActionBtn
                variant="primary"
                icon={STATUS_FLOW[nc.status].icon}
                onClick={handleStatusTransition}
                disabled={actionLoading}
              >
                {STATUS_FLOW[nc.status].label}
              </ActionBtn>
            )}
            {nc.capaRequired && nc.status !== "CLOSED" && onCreateCapa && (
              <ActionBtn variant="secondary" icon={<Plus size={14} />} onClick={() => onCreateCapa(nc.id)} disabled={actionLoading}>
                Создать CAPA
              </ActionBtn>
            )}
            {nc.riskRegisterId && (
              <span className="flex items-center gap-1 text-[12px] text-asvo-accent">
                <Link2 size={12} /> Привязан к риску #{nc.riskRegisterId}
              </span>
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
                  tab === t.key
                    ? "text-asvo-accent border-asvo-accent"
                    : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
            {tab === "main" && (
              <>
                {nc.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{nc.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
                  {nc.productType && <div><span className="text-asvo-text-dim">Продукция:</span> <span className="text-asvo-text ml-1">{nc.productType}</span></div>}
                  {nc.productSerialNumber && <div><span className="text-asvo-text-dim">S/N:</span> <span className="text-asvo-text ml-1">{nc.productSerialNumber}</span></div>}
                  {nc.lotNumber && <div><span className="text-asvo-text-dim">Партия:</span> <span className="text-asvo-text ml-1">{nc.lotNumber}</span></div>}
                  {nc.processName && <div><span className="text-asvo-text-dim">Процесс:</span> <span className="text-asvo-text ml-1">{nc.processName}</span></div>}
                  {nc.supplierName && <div><span className="text-asvo-text-dim">Поставщик:</span> <span className="text-asvo-text ml-1">{nc.supplierName}</span></div>}
                  {nc.totalQty != null && <div><span className="text-asvo-text-dim">Кол-во:</span> <span className="text-asvo-text ml-1">{nc.defectQty || 0}/{nc.totalQty}</span></div>}
                </div>
                {nc.immediateAction && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Немедленное действие</div>
                    <p className="text-[13px] text-asvo-text">{nc.immediateAction}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-asvo-text-dim">Зарегистрировал:</span> <span className="text-asvo-text ml-1">{fmtPerson(nc.reportedBy)}</span></div>
                  <div><span className="text-asvo-text-dim">Дата регистрации:</span> <span className="text-asvo-text ml-1">{fmtDateTime(nc.createdAt)}</span></div>
                  {nc.closedAt && <div><span className="text-asvo-text-dim">Закрыто:</span> <span className="text-asvo-text ml-1">{fmtDateTime(nc.closedAt)}</span></div>}
                  {nc.closedBy && <div><span className="text-asvo-text-dim">Закрыл:</span> <span className="text-asvo-text ml-1">{fmtPerson(nc.closedBy)}</span></div>}
                </div>
              </>
            )}

            {tab === "investigation" && (
              <>
                <div>
                  <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Метод анализа корневой причины</label>
                  <select value={rootCauseMethod} onChange={(e) => setRootCauseMethod(e.target.value)} className={inputCls} disabled={nc.status === "CLOSED"}>
                    <option value="">— Не выбран —</option>
                    {ROOT_CAUSE_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Корневая причина</label>
                  <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Опишите корневую причину несоответствия..." disabled={nc.status === "CLOSED"} />
                </div>
                {nc.status === "INVESTIGATING" && (
                  <ActionBtn variant="secondary" onClick={() => {
                    doAction(() => ncApi.update(nc.id, { rootCause: rootCause.trim(), rootCauseMethod }));
                  }} disabled={actionLoading}>
                    Сохранить результаты расследования
                  </ActionBtn>
                )}
              </>
            )}

            {tab === "disposition" && (
              <>
                <div>
                  <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Решение по диспозиции</label>
                  <select value={disposition} onChange={(e) => setDisposition(e.target.value)} className={inputCls} disabled={nc.status === "CLOSED"}>
                    <option value="">— Не установлена —</option>
                    {DISPOSITION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Обоснование</label>
                  <textarea value={dispositionJustification} onChange={(e) => setDispositionJustification(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Обоснование принятого решения..." disabled={nc.status === "CLOSED"} />
                </div>
                {nc.status === "DISPOSITION" && (
                  <ActionBtn variant="secondary" onClick={() => {
                    doAction(() => ncApi.update(nc.id, { disposition, dispositionJustification: dispositionJustification.trim() }));
                  }} disabled={actionLoading}>
                    Сохранить диспозицию
                  </ActionBtn>
                )}

                {/* Closing comment for VERIFICATION → CLOSED */}
                {nc.status === "VERIFICATION" && (
                  <div className="border-t border-asvo-border pt-4">
                    <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Комментарий при закрытии</label>
                    <textarea value={closingComment} onChange={(e) => setClosingComment(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Результаты верификации, заключение..." />
                  </div>
                )}
              </>
            )}
          </div>

          {/* CAPA list */}
          {nc.capas?.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-asvo-text mb-2">Связанные CAPA</h4>
              <div className="space-y-2">
                {nc.capas.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                    <span className="font-mono text-[12px] font-bold text-asvo-accent">{c.number}</span>
                    <span className="text-[12px] text-asvo-text flex-1">{c.title}</span>
                    <Badge variant={c.status === "EFFECTIVE" || c.status === "CLOSED" ? "sop" : "capa"}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default NcDetailModal;

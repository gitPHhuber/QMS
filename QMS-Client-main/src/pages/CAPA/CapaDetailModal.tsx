/**
 * CapaDetailModal.tsx — Детальный просмотр и управление CAPA
 * ISO 13485 §8.5.2/§8.5.3 — Workflow + План действий + Верификация эффективности
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertTriangle, Clock, Plus, ArrowRight,
  ClipboardCheck, ShieldCheck, X,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { capaApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* ── Constants ── */

const STATUS_LABELS: Record<string, string> = {
  INITIATED: "Инициировано", INVESTIGATING: "Расследование", PLANNING: "Планирование",
  PLAN_APPROVED: "План утверждён", IMPLEMENTING: "Выполнение", VERIFYING: "Проверка",
  EFFECTIVE: "Эффективно", INEFFECTIVE: "Неэффективно", CLOSED: "Закрыто",
};

const STATUS_DOT: Record<string, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey"> = {
  INITIATED: "grey", INVESTIGATING: "blue", PLANNING: "purple",
  PLAN_APPROVED: "amber", IMPLEMENTING: "orange", VERIFYING: "amber",
  EFFECTIVE: "accent", INEFFECTIVE: "red", CLOSED: "accent",
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  INITIATED:     { next: "INVESTIGATING", label: "Начать расследование" },
  INVESTIGATING: { next: "PLANNING",      label: "Перейти к планированию" },
  PLANNING:      { next: "PLAN_APPROVED", label: "Утвердить план" },
  PLAN_APPROVED: { next: "IMPLEMENTING",  label: "Начать внедрение" },
  IMPLEMENTING:  { next: "VERIFYING",     label: "На верификацию" },
};

const ACTION_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Запланировано", IN_PROGRESS: "В работе", COMPLETED: "Завершено", CANCELLED: "Отменено",
};

const ROOT_CAUSE_METHODS = [
  { value: "5WHY", label: "5 Почему" },
  { value: "FISHBONE", label: "Диаграмма Исикавы" },
  { value: "FMEA", label: "FMEA" },
  { value: "FTA", label: "Дерево отказов" },
  { value: "OTHER", label: "Другой" },
];

/* ── Props ── */

interface CapaDetailModalProps {
  capaId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const CapaDetailModal: React.FC<CapaDetailModalProps> = ({
  capaId, isOpen, onClose, onAction,
}) => {
  const [capa, setCapa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"main" | "rootcause" | "actions" | "verify">("main");
  const [users, setUsers] = useState<any[]>([]);

  // New action form
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionDesc, setNewActionDesc] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState<number>(0);
  const [newActionDueDate, setNewActionDueDate] = useState("");

  // Verification form
  const [verifyEffective, setVerifyEffective] = useState(true);
  const [verifyEvidence, setVerifyEvidence] = useState("");
  const [verifyComment, setVerifyComment] = useState("");

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await capaApi.getOne(capaId);
      setCapa(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [capaId]);

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
    if (!capa) return;
    const flow = STATUS_FLOW[capa.status];
    if (!flow) return;
    doAction(() => capaApi.updateStatus(capa.id, { status: flow.next }));
  };

  const handleAddAction = () => {
    if (!newActionDesc.trim()) return;
    doAction(() => capaApi.addAction(capa.id, {
      description: newActionDesc.trim(),
      assignedToId: newActionAssignee || undefined,
      dueDate: newActionDueDate || undefined,
    }));
    setNewActionDesc(""); setNewActionAssignee(0); setNewActionDueDate("");
    setShowAddAction(false);
  };

  const handleCompleteAction = (actionId: number) => {
    doAction(() => capaApi.updateAction(actionId, { status: "COMPLETED" }));
  };

  const handleVerify = () => {
    doAction(() => capaApi.verify(capa.id, {
      isEffective: verifyEffective,
      evidence: verifyEvidence.trim() || undefined,
      comment: verifyComment.trim() || undefined,
    }));
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtPerson = (p: any) => p ? `${p.surname} ${p.name}` : "—";

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text focus:border-asvo-accent/50 focus:outline-none transition-colors";

  const tabs = [
    { key: "main", label: "Основное" },
    { key: "rootcause", label: "Корневая причина" },
    { key: "actions", label: "План действий" },
    { key: "verify", label: "Верификация" },
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

      {!loading && !error && capa && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{capa.number}</span>
                <Badge color={capa.type === "CORRECTIVE" ? "#E8A830" : "#4A90E8"} bg={capa.type === "CORRECTIVE" ? "rgba(232,168,48,0.12)" : "rgba(74,144,232,0.12)"}>
                  {capa.type === "CORRECTIVE" ? "Корректирующее" : "Предупреждающее"}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[capa.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">{STATUS_LABELS[capa.status] || capa.status}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{capa.title}</h2>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Приоритет", value: capa.priority },
              { label: "Ответственный", value: fmtPerson(capa.assignedTo) },
              { label: "Срок", value: fmtDate(capa.dueDate), isOverdue: capa.dueDate && new Date(capa.dueDate) < new Date() && !["CLOSED", "EFFECTIVE"].includes(capa.status) },
              { label: "NC", value: capa.nonconformity?.number || "—" },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className={`text-[13px] font-medium mt-0.5 ${(m as any).isOverdue ? "text-red-400" : "text-asvo-text"}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Workflow Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW[capa.status] && (
              <ActionBtn variant="primary" icon={<ArrowRight size={14} />} onClick={handleStatusTransition} disabled={actionLoading}>
                {STATUS_FLOW[capa.status].label}
              </ActionBtn>
            )}
            {capa.status === "VERIFYING" && (
              <ActionBtn variant="primary" icon={<ShieldCheck size={14} />} onClick={() => setTab("verify")} disabled={actionLoading}>
                Верифицировать эффективность
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

          {/* Tab Content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
            {tab === "main" && (
              <>
                {capa.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{capa.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-asvo-text-dim">Инициатор:</span> <span className="text-asvo-text ml-1">{fmtPerson(capa.initiatedBy)}</span></div>
                  <div><span className="text-asvo-text-dim">Создано:</span> <span className="text-asvo-text ml-1">{fmtDate(capa.createdAt)}</span></div>
                  {capa.planApprovedAt && <div><span className="text-asvo-text-dim">План утверждён:</span> <span className="text-asvo-text ml-1">{fmtDate(capa.planApprovedAt)}</span></div>}
                  {capa.implementedAt && <div><span className="text-asvo-text-dim">Внедрено:</span> <span className="text-asvo-text ml-1">{fmtDate(capa.implementedAt)}</span></div>}
                  {capa.closedAt && <div><span className="text-asvo-text-dim">Закрыто:</span> <span className="text-asvo-text ml-1">{fmtDate(capa.closedAt)}</span></div>}
                  {capa.effectivenessCheckDate && <div><span className="text-asvo-text-dim">Проверка эффективности:</span> <span className="text-asvo-text ml-1">{fmtDate(capa.effectivenessCheckDate)}</span></div>}
                </div>
              </>
            )}

            {tab === "rootcause" && (
              <>
                <div>
                  <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Метод анализа</div>
                  <p className="text-[13px] text-asvo-text">{capa.rootCauseMethod || "—"}</p>
                </div>
                <div>
                  <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Корневая причина</div>
                  <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{capa.rootCauseAnalysis || "—"}</p>
                </div>
              </>
            )}

            {tab === "actions" && (
              <>
                {/* Action list */}
                <div className="space-y-2">
                  {(capa.actions || []).length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">Действия не добавлены</p>
                  ) : (
                    (capa.actions || []).map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2">
                        <span className="text-[12px] text-asvo-text-dim w-5">{a.order}</span>
                        <span className="text-[13px] text-asvo-text flex-1">{a.description}</span>
                        <span className="text-[11px] text-asvo-text-dim">{fmtPerson(a.assignedTo)}</span>
                        <span className="text-[11px] text-asvo-text-dim">{fmtDate(a.dueDate)}</span>
                        <Badge variant={a.status === "COMPLETED" ? "sop" : a.status === "IN_PROGRESS" ? "capa" : "closed"}>
                          {ACTION_STATUS_LABELS[a.status] || a.status}
                        </Badge>
                        {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCompleteAction(a.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50"
                          >
                            Завершить
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add action */}
                {!["CLOSED", "EFFECTIVE", "INEFFECTIVE"].includes(capa.status) && (
                  <>
                    {showAddAction ? (
                      <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                        <input value={newActionDesc} onChange={(e) => setNewActionDesc(e.target.value)} placeholder="Описание действия" className={inputCls} />
                        <div className="grid grid-cols-2 gap-3">
                          <select value={newActionAssignee} onChange={(e) => setNewActionAssignee(Number(e.target.value))} className={inputCls}>
                            <option value={0}>— Исполнитель —</option>
                            {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                          </select>
                          <input type="date" value={newActionDueDate} onChange={(e) => setNewActionDueDate(e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex gap-2">
                          <ActionBtn variant="primary" onClick={handleAddAction} disabled={actionLoading}>Добавить</ActionBtn>
                          <ActionBtn variant="secondary" onClick={() => setShowAddAction(false)}>Отмена</ActionBtn>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddAction(true)} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1">
                        <Plus size={12} /> Добавить действие
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {tab === "verify" && (
              <>
                {/* Existing verifications */}
                {(capa.verifications || []).map((v: any) => (
                  <div key={v.id} className="bg-asvo-surface rounded-lg px-3 py-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.isEffective ? "sop" : "nc"}>
                        {v.isEffective ? "Эффективно" : "Неэффективно"}
                      </Badge>
                      <span className="text-[11px] text-asvo-text-dim">{fmtDate(v.verifiedAt)}</span>
                      <span className="text-[11px] text-asvo-text-dim">{fmtPerson(v.verifiedBy)}</span>
                    </div>
                    {v.evidence && <p className="text-[12px] text-asvo-text">{v.evidence}</p>}
                    {v.comment && <p className="text-[12px] text-asvo-text-dim italic">{v.comment}</p>}
                  </div>
                ))}

                {/* Verify form */}
                {capa.status === "VERIFYING" && (
                  <div className="border border-asvo-border rounded-lg p-4 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-asvo-accent" /> Верификация эффективности
                    </h4>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={verifyEffective} onChange={() => setVerifyEffective(true)} className="text-asvo-accent" />
                        <span className="text-[13px] text-asvo-text">Эффективно</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={!verifyEffective} onChange={() => setVerifyEffective(false)} className="text-red-400" />
                        <span className="text-[13px] text-asvo-text">Неэффективно</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Доказательства</label>
                      <textarea value={verifyEvidence} onChange={(e) => setVerifyEvidence(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Объективные свидетельства эффективности/неэффективности..." />
                    </div>
                    <div>
                      <label className="block text-[13px] text-asvo-text-mid font-medium mb-1.5">Комментарий</label>
                      <textarea value={verifyComment} onChange={(e) => setVerifyComment(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Дополнительные примечания..." />
                    </div>
                    <ActionBtn variant="primary" icon={<ShieldCheck size={14} />} onClick={handleVerify} disabled={actionLoading}>
                      {actionLoading ? "Сохранение..." : "Подтвердить верификацию"}
                    </ActionBtn>
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

export default CapaDetailModal;

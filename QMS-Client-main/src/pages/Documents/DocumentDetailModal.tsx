/**
 * DocumentDetailModal.tsx — Детальный просмотр документа
 * Версии, цепочка согласований, действия (согласовать, ввести в действие, новая версия)
 * Загрузка/скачивание файлов, отправка на согласование, рассылка
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, CheckCircle, Clock, AlertTriangle, Download,
  Send, Play, Plus, UserCheck, X, Check, RotateCcw,
  Upload, Users, Eye, Copy, ExternalLink,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { documentsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";
import { TYPE_LABELS, TYPE_COLORS, STATUS_LABELS } from "./DocumentsPage";

/* ── Props ── */

interface DocumentDetailModalProps {
  docId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void; // refresh parent
}

/* ── Status dot mapping ── */
const STATUS_DOT: Record<string, "accent" | "blue" | "amber" | "grey" | "red"> = {
  DRAFT: "grey",
  REVIEW: "blue",
  APPROVED: "accent",
  EFFECTIVE: "accent",
  REVISION: "amber",
  OBSOLETE: "red",
  CANCELLED: "red",
  SUPERSEDED: "grey",
  REJECTED: "red",
};

const VERSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  REVIEW: "Согласование",
  APPROVED: "Утверждён",
  EFFECTIVE: "Действующий",
  SUPERSEDED: "Заменён",
  REJECTED: "Отклонён",
};

const APPROVAL_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Ожидает",    color: "#E8A830", icon: <Clock size={14} /> },
  APPROVED: { label: "Одобрено",   color: "#2DD4A8", icon: <Check size={14} /> },
  REJECTED: { label: "Отклонено",  color: "#F06060", icon: <X size={14} /> },
  RETURNED: { label: "Возвращено", color: "#E87040", icon: <RotateCcw size={14} /> },
};

const APPROVAL_ROLES = [
  { value: "REVIEWER", label: "Рецензент" },
  { value: "APPROVER", label: "Утверждающий" },
  { value: "QUALITY_OFFICER", label: "Ответственный по качеству" },
];

/* ── Component ── */

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  docId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVersionTab, setActiveVersionTab] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Submit for review state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [approvalChain, setApprovalChain] = useState<Array<{ userId: number; role: string; dueDate: string }>>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Distribute state
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeUserIds, setDistributeUserIds] = useState<number[]>([]);

  // File upload for existing DRAFT versions
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch detail ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await documentsApi.getOne(docId);
      setDoc(d);
      if (d.versions?.length > 0) {
        setActiveVersionTab(d.versions[0].id);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (isOpen) fetchDetail();
  }, [isOpen, fetchDetail]);

  /* ── Load users for approval/distribute ── */
  const loadUsers = useCallback(async () => {
    if (allUsers.length > 0) return;
    try {
      const users = await getUsers();
      setAllUsers(Array.isArray(users) ? users : users?.rows || []);
    } catch {
      // silently fail
    }
  }, [allUsers.length]);

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

  const handleMakeEffective = (versionId: number) => {
    doAction(() => documentsApi.makeEffective(versionId));
  };

  const handleCreateVersion = () => {
    doAction(() => documentsApi.createVersion(docId, { changeDescription: "Новая версия" }));
  };

  const handleDecision = (approvalId: number, decision: string) => {
    const comment = decision === "REJECTED" || decision === "RETURNED"
      ? prompt("Укажите причину:") || ""
      : "";
    doAction(() => documentsApi.decide(approvalId, { decision, comment }));
  };

  const handleAcknowledge = (distributionId: number) => {
    doAction(() => documentsApi.acknowledge(distributionId));
  };

  /* ── File upload for DRAFT versions ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVersion) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    doAction(() => documentsApi.uploadFile(activeVersion.id, file));
  };

  /* ── Download ── */
  const getFileUrl = (version: any): string | null => {
    if (!version?.fileUrl) return null;
    const apiBase = import.meta.env.VITE_API_URL || "";
    return version.fileUrl.startsWith("http")
      ? version.fileUrl
      : `${apiBase}/static${version.fileUrl}`;
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
  };

  /* ── Submit for review ── */
  const openSubmitModal = () => {
    loadUsers();
    setApprovalChain([{ userId: 0, role: "REVIEWER", dueDate: "" }]);
    setShowSubmitModal(true);
  };

  const addApprovalStep = () => {
    setApprovalChain((prev) => [...prev, { userId: 0, role: "APPROVER", dueDate: "" }]);
  };

  const removeApprovalStep = (idx: number) => {
    setApprovalChain((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateApprovalStep = (idx: number, field: string, value: string | number) => {
    setApprovalChain((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, [field]: value } : step))
    );
  };

  const handleSubmitForReview = () => {
    const validChain = approvalChain.filter((s) => s.userId > 0);
    if (validChain.length === 0) {
      setActionError("Добавьте хотя бы одного согласующего");
      return;
    }
    setShowSubmitModal(false);
    doAction(() =>
      documentsApi.submitForReview(
        activeVersion.id,
        validChain.map((s) => ({
          userId: s.userId,
          role: s.role,
          dueDate: s.dueDate || undefined,
        }))
      )
    );
  };

  /* ── Distribute ── */
  const openDistributeModal = () => {
    loadUsers();
    setDistributeUserIds([]);
    setShowDistributeModal(true);
  };

  const toggleDistributeUser = (userId: number) => {
    setDistributeUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDistribute = () => {
    if (distributeUserIds.length === 0) {
      setActionError("Выберите хотя бы одного получателя");
      return;
    }
    setShowDistributeModal(false);
    doAction(() => documentsApi.distribute(activeVersion.id, distributeUserIds));
  };

  /* ── Helpers ── */
  const activeVersion = doc?.versions?.find((v: any) => v.id === activeVersionTab);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const inputCls =
    "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text focus:border-asvo-accent/50 focus:outline-none transition-colors";

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

      {!loading && !error && doc && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{doc.code}</span>
                <Badge color={TYPE_COLORS[doc.type] || "#3A4E62"} bg={`${TYPE_COLORS[doc.type] || "#3A4E62"}22`}>
                  {TYPE_LABELS[doc.type] || doc.type}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[doc.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">{STATUS_LABELS[doc.status] || doc.status}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text truncate">{doc.title}</h2>
              {doc.description && <p className="text-[12px] text-asvo-text-dim mt-1 line-clamp-2">{doc.description}</p>}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Владелец", value: doc.owner ? `${doc.owner.surname} ${doc.owner.name}` : "—" },
              { label: "Раздел ISO", value: doc.isoSection ? `§${doc.isoSection}` : "—" },
              { label: "Цикл пересмотра", value: `${doc.reviewCycleMonths || 12} мес.` },
              { label: "Пересмотр до", value: formatDate(doc.nextReviewDate), isOverdue: doc.nextReviewDate && new Date(doc.nextReviewDate) < new Date() },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className={`text-[13px] font-medium mt-0.5 ${(m as any).isOverdue ? "text-red-400" : "text-asvo-text"}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {doc.status === "EFFECTIVE" && (
              <ActionBtn variant="primary" icon={<Plus size={14} />} onClick={handleCreateVersion} disabled={actionLoading}>Новая версия</ActionBtn>
            )}
            {activeVersion?.status === "DRAFT" && activeVersion?.fileName && (
              <ActionBtn variant="primary" icon={<Send size={14} />} onClick={openSubmitModal} disabled={actionLoading}>
                Отправить на согласование
              </ActionBtn>
            )}
            {activeVersion?.status === "APPROVED" && (
              <ActionBtn variant="primary" icon={<Play size={14} />} onClick={() => handleMakeEffective(activeVersion.id)} disabled={actionLoading}>
                Ввести в действие
              </ActionBtn>
            )}
            {activeVersion?.status === "EFFECTIVE" && (
              <ActionBtn variant="secondary" icon={<Users size={14} />} onClick={openDistributeModal} disabled={actionLoading}>
                Разослать
              </ActionBtn>
            )}
            {actionError && <span className="text-red-400 text-[12px]">{actionError}</span>}
          </div>

          {/* Version Tabs */}
          {doc.versions?.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-asvo-text mb-2">Версии</h3>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {doc.versions.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVersionTab(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                      v.id === activeVersionTab
                        ? "bg-asvo-accent/15 text-asvo-accent border border-asvo-accent/30"
                        : "bg-asvo-surface-2 text-asvo-text-mid border border-asvo-border hover:border-asvo-accent/20"
                    }`}
                  >
                    <span>v{v.version}</span>
                    <StatusDot color={STATUS_DOT[v.status] || "grey"} />
                    <span className="text-[10px]">{VERSION_STATUS_LABELS[v.status] || v.status}</span>
                    {doc.currentVersionId === v.id && (
                      <span className="text-[9px] bg-asvo-accent/20 text-asvo-accent rounded px-1">текущая</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Version Detail */}
          {activeVersion && (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                <div>
                  <span className="text-asvo-text-dim">Создана:</span>
                  <span className="text-asvo-text ml-1">{formatDateTime(activeVersion.createdAt)}</span>
                </div>
                <div>
                  <span className="text-asvo-text-dim">Автор:</span>
                  <span className="text-asvo-text ml-1">
                    {activeVersion.createdBy ? `${activeVersion.createdBy.surname} ${activeVersion.createdBy.name}` : "—"}
                  </span>
                </div>
                {activeVersion.effectiveAt && (
                  <div>
                    <span className="text-asvo-text-dim">Введена в действие:</span>
                    <span className="text-asvo-text ml-1">{formatDateTime(activeVersion.effectiveAt)}</span>
                  </div>
                )}
                {activeVersion.approvedBy && (
                  <div>
                    <span className="text-asvo-text-dim">Утвердил:</span>
                    <span className="text-asvo-text ml-1">{activeVersion.approvedBy.surname} {activeVersion.approvedBy.name}</span>
                  </div>
                )}
              </div>

              {activeVersion.changeDescription && (
                <div className="text-[12px]">
                  <span className="text-asvo-text-dim">Описание изменений:</span>
                  <p className="text-asvo-text mt-0.5">{activeVersion.changeDescription}</p>
                </div>
              )}

              {/* File info with download/view/copy */}
              {activeVersion.fileName ? (
                <div className="flex items-center gap-2 bg-asvo-surface rounded-lg px-3 py-2 flex-wrap">
                  <FileText size={14} className="text-asvo-accent shrink-0" />
                  <span className="text-[12px] text-asvo-text flex-1 truncate min-w-0">{activeVersion.fileName}</span>
                  <span className="text-[10px] text-asvo-text-dim shrink-0">
                    {activeVersion.fileSize ? `${(activeVersion.fileSize / 1024).toFixed(0)} КБ` : ""}
                  </span>
                  {getFileUrl(activeVersion) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={getFileUrl(activeVersion)!}
                        download={activeVersion.fileName}
                        className="px-2 py-1 rounded bg-asvo-accent/15 text-asvo-accent text-[10px] font-medium hover:bg-asvo-accent/25 transition-colors flex items-center gap-1"
                      >
                        <Download size={12} /> Скачать
                      </a>
                      <a
                        href={getFileUrl(activeVersion)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-blue-500/15 text-blue-400 text-[10px] font-medium hover:bg-blue-500/25 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Открыть
                      </a>
                      <button
                        onClick={() => handleCopyLink(getFileUrl(activeVersion)!)}
                        className="px-2 py-1 rounded bg-asvo-surface-2 text-asvo-text-dim text-[10px] hover:text-asvo-text transition-colors"
                        title="Копировать ссылку"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ) : activeVersion.status === "DRAFT" ? (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 border-2 border-dashed border-asvo-border hover:border-asvo-accent/40 rounded-lg px-4 py-3 cursor-pointer transition-colors"
                  >
                    <Upload size={18} className="text-asvo-text-dim" />
                    <div>
                      <div className="text-[12px] text-asvo-text-mid">Загрузить файл документа</div>
                      <div className="text-[10px] text-asvo-text-dim">PDF, DOCX, XLSX — до 50 МБ</div>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.doc,.xls,.odt,.ods,.txt,.csv" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : null}

              {/* Approval Chain */}
              {activeVersion.approvals?.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-semibold text-asvo-text-mid mb-2 flex items-center gap-1.5">
                    <UserCheck size={14} /> Цепочка согласования
                  </h4>
                  {/* Progress bar */}
                  <div className="flex items-center gap-1 mb-3">
                    {activeVersion.approvals.sort((a: any, b: any) => a.step - b.step).map((a: any, idx: number, arr: any[]) => {
                      const st = APPROVAL_STATUS[a.decision] || APPROVAL_STATUS.PENDING;
                      return (
                        <React.Fragment key={a.id}>
                          <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ background: `${st.color}15`, color: st.color }}>
                            {st.icon}
                            <span>{a.role === "REVIEWER" ? "Рецензент" : a.role === "APPROVER" ? "Утверждающий" : "Качество"}</span>
                          </div>
                          {idx < arr.length - 1 && <div className="w-4 h-0.5 bg-asvo-border" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {activeVersion.approvals.sort((a: any, b: any) => a.step - b.step).map((a: any) => {
                      const st = APPROVAL_STATUS[a.decision] || APPROVAL_STATUS.PENDING;
                      return (
                        <div key={a.id} className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${st.color}22`, color: st.color }}>{a.step}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-asvo-text">{a.assignedTo ? `${a.assignedTo.surname} ${a.assignedTo.name}` : `#${a.assignedToId}`}</div>
                            <div className="text-[10px] text-asvo-text-dim">{a.role === "REVIEWER" ? "Рецензент" : a.role === "APPROVER" ? "Утверждающий" : "Ответственный по качеству"}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0" style={{ color: st.color }}>{st.icon}<span className="text-[11px] font-medium">{st.label}</span></div>
                          {a.decidedAt && <span className="text-[10px] text-asvo-text-dim shrink-0">{formatDateTime(a.decidedAt)}</span>}
                          {a.decision === "PENDING" && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleDecision(a.id, "APPROVED")} disabled={actionLoading} className="px-2 py-1 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50">Одобрить</button>
                              <button onClick={() => handleDecision(a.id, "RETURNED")} disabled={actionLoading} className="px-2 py-1 rounded bg-[#E87040]/15 text-[#E87040] text-[10px] font-medium hover:bg-[#E87040]/25 transition-colors disabled:opacity-50">Вернуть</button>
                              <button onClick={() => handleDecision(a.id, "REJECTED")} disabled={actionLoading} className="px-2 py-1 rounded bg-[#F06060]/15 text-[#F06060] text-[10px] font-medium hover:bg-[#F06060]/25 transition-colors disabled:opacity-50">Отклонить</button>
                            </div>
                          )}
                          {a.comment && <span className="text-[10px] text-asvo-text-dim italic max-w-[150px] truncate">«{a.comment}»</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Distributions */}
              {activeVersion.distributions?.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-semibold text-asvo-text-mid mb-2 flex items-center gap-1.5"><Users size={14} /> Рассылка и ознакомление</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeVersion.distributions.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-2 bg-asvo-surface rounded-lg px-3 py-2">
                        <div className="flex-1 text-[12px] text-asvo-text">{d.user ? `${d.user.surname} ${d.user.name}` : `#${d.userId}`}</div>
                        {d.acknowledged ? (
                          <span className="flex items-center gap-1 text-[10px] text-[#2DD4A8]"><Eye size={12} />{formatDateTime(d.acknowledgedAt)}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#E8A830]">Не ознакомлен</span>
                            <button onClick={() => handleAcknowledge(d.id)} disabled={actionLoading} className="px-2 py-0.5 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50">Подтвердить</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit for Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-asvo-surface border border-asvo-border rounded-xl p-5 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-asvo-text flex items-center gap-2"><Send size={16} className="text-asvo-accent" /> Отправить на согласование</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {approvalChain.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] text-asvo-text-dim w-5 text-center">{idx + 1}</span>
                  <select value={step.userId} onChange={(e) => updateApprovalStep(idx, "userId", Number(e.target.value))} className={`${inputCls} flex-1`}>
                    <option value={0}>— Выберите —</option>
                    {allUsers.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                  </select>
                  <select value={step.role} onChange={(e) => updateApprovalStep(idx, "role", e.target.value)} className={`${inputCls} w-40`}>
                    {APPROVAL_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <input type="date" value={step.dueDate} onChange={(e) => updateApprovalStep(idx, "dueDate", e.target.value)} className={`${inputCls} w-36`} />
                  {approvalChain.length > 1 && <button onClick={() => removeApprovalStep(idx)} className="text-red-400 hover:text-red-300"><X size={14} /></button>}
                </div>
              ))}
            </div>
            <button onClick={addApprovalStep} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1"><Plus size={12} /> Добавить шаг</button>
            <div className="flex justify-end gap-2 pt-2 border-t border-asvo-border">
              <ActionBtn variant="secondary" onClick={() => setShowSubmitModal(false)}>Отмена</ActionBtn>
              <ActionBtn variant="primary" icon={<Send size={14} />} onClick={handleSubmitForReview} disabled={actionLoading}>Отправить</ActionBtn>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowDistributeModal(false)}>
          <div className="bg-asvo-surface border border-asvo-border rounded-xl p-5 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-asvo-text flex items-center gap-2"><Users size={16} className="text-asvo-accent" /> Разослать для ознакомления</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {allUsers.map((u: any) => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-asvo-surface-2 cursor-pointer transition-colors">
                  <input type="checkbox" checked={distributeUserIds.includes(u.id)} onChange={() => toggleDistributeUser(u.id)} className="rounded border-asvo-border" />
                  <span className="text-[13px] text-asvo-text">{u.surname} {u.name}</span>
                </label>
              ))}
            </div>
            <div className="text-[11px] text-asvo-text-dim">Выбрано: {distributeUserIds.length}</div>
            <div className="flex justify-end gap-2 pt-2 border-t border-asvo-border">
              <ActionBtn variant="secondary" onClick={() => setShowDistributeModal(false)}>Отмена</ActionBtn>
              <ActionBtn variant="primary" icon={<Send size={14} />} onClick={handleDistribute} disabled={actionLoading}>Разослать</ActionBtn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetailModal;

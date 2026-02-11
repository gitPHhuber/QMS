/**
 * DocumentDetailModal.tsx — Детальный просмотр документа
 * Версии, цепочка согласований, действия (согласовать, ввести в действие, новая версия)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle, Clock, AlertTriangle, Download,
  Send, Play, Plus, UserCheck, X, Check, RotateCcw,
  Upload, Users, Eye,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { documentsApi } from "../../api/qmsApi";
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

  /* ── Fetch detail ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await documentsApi.getOne(docId);
      setDoc(d);
      // Default to the latest version tab
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
    doAction(() =>
      documentsApi.createVersion(docId, {
        changeDescription: "Новая версия",
      })
    );
  };

  const handleDecision = (approvalId: number, decision: string) => {
    const comment = decision === "REJECTED" || decision === "RETURNED"
      ? prompt("Укажите причину:") || ""
      : "";
    doAction(() => documentsApi.decide(approvalId, { decision, comment }));
  };

  /* ── Helpers ── */
  const activeVersion = doc?.versions?.find((v: any) => v.id === activeVersionTab);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
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
          <ActionBtn variant="secondary" onClick={fetchDetail} className="mt-3">
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* Content */}
      {!loading && !error && doc && (
        <div className="space-y-5">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">
                  {doc.code}
                </span>
                <Badge
                  color={TYPE_COLORS[doc.type] || "#3A4E62"}
                  bg={`${TYPE_COLORS[doc.type] || "#3A4E62"}22`}
                >
                  {TYPE_LABELS[doc.type] || doc.type}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[doc.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text truncate">{doc.title}</h2>
              {doc.description && (
                <p className="text-[12px] text-asvo-text-dim mt-1 line-clamp-2">{doc.description}</p>
              )}
            </div>
          </div>

          {/* ── Metadata Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Владелец", value: doc.owner ? `${doc.owner.surname} ${doc.owner.name}` : "—" },
              { label: "Раздел ISO", value: doc.isoSection ? `§${doc.isoSection}` : "—" },
              { label: "Цикл пересмотра", value: `${doc.reviewCycleMonths || 12} мес.` },
              {
                label: "Пересмотр до",
                value: formatDate(doc.nextReviewDate),
                isOverdue: doc.nextReviewDate && new Date(doc.nextReviewDate) < new Date(),
              },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className={`text-[13px] font-medium mt-0.5 ${
                  (m as any).isOverdue ? "text-red-400" : "text-asvo-text"
                }`}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {doc.status === "EFFECTIVE" && (
              <ActionBtn variant="primary" icon={<Plus size={14} />} onClick={handleCreateVersion} disabled={actionLoading}>
                Новая версия
              </ActionBtn>
            )}
            {activeVersion?.status === "APPROVED" && (
              <ActionBtn
                variant="primary"
                icon={<Play size={14} />}
                onClick={() => handleMakeEffective(activeVersion.id)}
                disabled={actionLoading}
              >
                Ввести в действие
              </ActionBtn>
            )}
            {actionError && (
              <span className="text-red-400 text-[12px]">{actionError}</span>
            )}
          </div>

          {/* ── Version Tabs ── */}
          {doc.versions?.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-asvo-text mb-2">Версии</h3>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {doc.versions.map((v: any) => {
                  const isActive = v.id === activeVersionTab;
                  const isCurrent = doc.currentVersionId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveVersionTab(v.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-asvo-accent/15 text-asvo-accent border border-asvo-accent/30"
                          : "bg-asvo-surface-2 text-asvo-text-mid border border-asvo-border hover:border-asvo-accent/20"
                      }`}
                    >
                      <span>v{v.version}</span>
                      <StatusDot color={STATUS_DOT[v.status] || "grey"} />
                      <span className="text-[10px]">
                        {VERSION_STATUS_LABELS[v.status] || v.status}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-asvo-accent/20 text-asvo-accent rounded px-1">
                          текущая
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Active Version Detail ── */}
          {activeVersion && (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
              {/* Version metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                <div>
                  <span className="text-asvo-text-dim">Создана:</span>
                  <span className="text-asvo-text ml-1">{formatDateTime(activeVersion.createdAt)}</span>
                </div>
                <div>
                  <span className="text-asvo-text-dim">Автор:</span>
                  <span className="text-asvo-text ml-1">
                    {activeVersion.createdBy
                      ? `${activeVersion.createdBy.surname} ${activeVersion.createdBy.name}`
                      : "—"}
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
                    <span className="text-asvo-text ml-1">
                      {activeVersion.approvedBy.surname} {activeVersion.approvedBy.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Change description */}
              {activeVersion.changeDescription && (
                <div className="text-[12px]">
                  <span className="text-asvo-text-dim">Описание изменений:</span>
                  <p className="text-asvo-text mt-0.5">{activeVersion.changeDescription}</p>
                </div>
              )}

              {/* File info */}
              {activeVersion.fileName && (
                <div className="flex items-center gap-2 bg-asvo-surface rounded-lg px-3 py-2">
                  <FileText size={14} className="text-asvo-accent" />
                  <span className="text-[12px] text-asvo-text flex-1">{activeVersion.fileName}</span>
                  <span className="text-[10px] text-asvo-text-dim">
                    {activeVersion.fileSize
                      ? `${(activeVersion.fileSize / 1024).toFixed(0)} КБ`
                      : ""}
                  </span>
                </div>
              )}

              {/* ── Approval Chain ── */}
              {activeVersion.approvals?.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-semibold text-asvo-text-mid mb-2 flex items-center gap-1.5">
                    <UserCheck size={14} />
                    Цепочка согласования
                  </h4>
                  <div className="space-y-2">
                    {activeVersion.approvals
                      .sort((a: any, b: any) => a.step - b.step)
                      .map((a: any) => {
                        const st = APPROVAL_STATUS[a.decision] || APPROVAL_STATUS.PENDING;
                        return (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2"
                          >
                            {/* Step number */}
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{
                                background: `${st.color}22`,
                                color: st.color,
                              }}
                            >
                              {a.step}
                            </div>

                            {/* Role + Assignee */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-asvo-text">
                                {a.assignedTo
                                  ? `${a.assignedTo.surname} ${a.assignedTo.name}`
                                  : `Пользователь #${a.assignedToId}`}
                              </div>
                              <div className="text-[10px] text-asvo-text-dim">
                                {a.role === "REVIEWER" ? "Рецензент" : a.role === "APPROVER" ? "Утверждающий" : "Ответственный по качеству"}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-1" style={{ color: st.color }}>
                              {st.icon}
                              <span className="text-[11px] font-medium">{st.label}</span>
                            </div>

                            {/* Date */}
                            {a.decidedAt && (
                              <span className="text-[10px] text-asvo-text-dim">
                                {formatDateTime(a.decidedAt)}
                              </span>
                            )}

                            {/* Action buttons for PENDING */}
                            {a.decision === "PENDING" && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDecision(a.id, "APPROVED")}
                                  disabled={actionLoading}
                                  className="px-2 py-1 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50"
                                >
                                  Одобрить
                                </button>
                                <button
                                  onClick={() => handleDecision(a.id, "RETURNED")}
                                  disabled={actionLoading}
                                  className="px-2 py-1 rounded bg-[#E87040]/15 text-[#E87040] text-[10px] font-medium hover:bg-[#E87040]/25 transition-colors disabled:opacity-50"
                                >
                                  Вернуть
                                </button>
                                <button
                                  onClick={() => handleDecision(a.id, "REJECTED")}
                                  disabled={actionLoading}
                                  className="px-2 py-1 rounded bg-[#F06060]/15 text-[#F06060] text-[10px] font-medium hover:bg-[#F06060]/25 transition-colors disabled:opacity-50"
                                >
                                  Отклонить
                                </button>
                              </div>
                            )}

                            {/* Comment */}
                            {a.comment && (
                              <span className="text-[10px] text-asvo-text-dim italic max-w-[150px] truncate">
                                «{a.comment}»
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ── Distributions ── */}
              {activeVersion.distributions?.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-semibold text-asvo-text-mid mb-2 flex items-center gap-1.5">
                    <Users size={14} />
                    Рассылка и ознакомление
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeVersion.distributions.map((d: any) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 bg-asvo-surface rounded-lg px-3 py-2"
                      >
                        <div className="flex-1 text-[12px] text-asvo-text">
                          {d.user ? `${d.user.surname} ${d.user.name}` : `#${d.userId}`}
                        </div>
                        {d.acknowledged ? (
                          <span className="flex items-center gap-1 text-[10px] text-[#2DD4A8]">
                            <Eye size={12} />
                            {formatDateTime(d.acknowledgedAt)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#E8A830]">Не ознакомлен</span>
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
    </Modal>
  );
};

export default DocumentDetailModal;
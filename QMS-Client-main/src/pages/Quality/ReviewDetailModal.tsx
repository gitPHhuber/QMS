/**
 * ReviewDetailModal.tsx — Детальный просмотр совещания анализа руководства
 * ISO 13485 §5.6 — Management Review
 */

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Plus, CheckCircle2, Clock, AlertTriangle, FileText, Loader2 } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { reviewsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PLANNED:     { label: "Запланировано", color: "#4A90E8" },
  IN_PROGRESS: { label: "В работе",     color: "#E8A830" },
  COMPLETED:   { label: "Проведено",    color: "#2DD4A8" },
  APPROVED:    { label: "Утверждено",    color: "#2DD4A8" },
};

const ACTION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN:        { label: "Назначено",  color: "#4A90E8" },
  IN_PROGRESS: { label: "В работе",   color: "#E8A830" },
  COMPLETED:   { label: "Выполнено",  color: "#2DD4A8" },
  OVERDUE:     { label: "Просрочено", color: "#F06060" },
  CANCELLED:   { label: "Отменено",   color: "#64748B" },
};

const QMS_EFFECTIVENESS = [
  { value: "EFFECTIVE",           label: "Результативна" },
  { value: "PARTIALLY_EFFECTIVE", label: "Частично результативна" },
  { value: "INEFFECTIVE",        label: "Нерезультативна" },
];

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number | null;
  onUpdated?: () => void;
  onAction?: () => void;
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isOpen, onClose, reviewId, onUpdated, onAction,
}) => {
  const handleRefresh = onUpdated || onAction;
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"main" | "input" | "decisions" | "actions">("main");
  const [users, setUsers] = useState<any[]>([]);

  // Action form
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionDesc, setActionDesc] = useState("");
  const [actionResp, setActionResp] = useState<number>(0);
  const [actionDeadline, setActionDeadline] = useState("");
  const [actionPriority, setActionPriority] = useState("MEDIUM");

  // Conclusion
  const [conclusion, setConclusion] = useState("");
  const [effectiveness, setEffectiveness] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    try {
      const data = await reviewsApi.getOne(reviewId);
      setReview(data);
      setConclusion(data.conclusion || "");
      setEffectiveness(data.qmsEffectiveness || "");
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (isOpen && reviewId) fetchDetail();
  }, [isOpen, reviewId, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
    }
  }, [isOpen, users.length]);

  const doUpdate = async (data: Record<string, any>) => {
    if (!reviewId) return;
    setSaving(true);
    setError(null);
    try {
      await reviewsApi.update(reviewId, data);
      await fetchDetail();
      handleRefresh?.();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAction = async () => {
    if (!reviewId || !actionDesc.trim()) return;
    setSaving(true);
    try {
      await reviewsApi.addAction(reviewId, {
        description: actionDesc.trim(),
        responsibleId: actionResp || undefined,
        deadline: actionDeadline || undefined,
        priority: actionPriority,
      });
      setActionDesc(""); setActionResp(0); setActionDeadline(""); setActionPriority("MEDIUM");
      setShowActionForm(false);
      await fetchDetail();
      handleRefresh?.();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateActionStatus = async (actionId: number, status: string) => {
    setSaving(true);
    try {
      await reviewsApi.updateAction(actionId, { status });
      await fetchDetail();
      handleRefresh?.();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU");
  };

  const getUserName = (id?: number) => {
    if (!id) return "—";
    const u = users.find((u: any) => u.id === id);
    return u ? `${u.surname} ${u.name}` : `ID ${id}`;
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  const handleDownloadMinutes = async () => {
    if (!reviewId) return;
    setDownloadingPdf(true);
    try {
      const blob = await reviewsApi.getMinutesPdf(reviewId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Protocol_${review?.reviewNumber || reviewId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.response?.data?.message || "Ошибка генерации протокола");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const tabs = [
    { key: "main", label: "Основное" },
    { key: "input", label: "§5.6.2 Входные данные" },
    { key: "decisions", label: "§5.6.3 Выходные данные" },
    { key: "actions", label: `Действия (${review?.actions?.length || 0})` },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={review?.title || "Совещание"} size="2xl">
      {loading && <div className="text-center py-8 text-asvo-text-dim">Загрузка...</div>}
      {!loading && review && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Header info */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-asvo-accent text-sm">{review.reviewNumber || `MR-${review.id}`}</span>
            <Badge color={STATUS_MAP[review.status]?.color || "#64748B"}>
              {STATUS_MAP[review.status]?.label || review.status}
            </Badge>
            <span className="text-[12px] text-asvo-text-dim">
              {formatDate(review.reviewDate)} | Период: {formatDate(review.periodFrom)} — {formatDate(review.periodTo)}
            </span>
            <div className="ml-auto">
              <ActionBtn
                variant="secondary"
                icon={downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                disabled={downloadingPdf}
                onClick={handleDownloadMinutes}
              >
                Скачать протокол
              </ActionBtn>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-3 py-2 text-[13px] border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-asvo-accent text-asvo-accent"
                    : "border-transparent text-asvo-text-dim hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Main tab */}
          {tab === "main" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[12px] text-asvo-text-dim">Председатель</span>
                  <p className="text-[13px] text-asvo-text">{getUserName(review.chairpersonId)}</p>
                </div>
                <div>
                  <span className="text-[12px] text-asvo-text-dim">Участники</span>
                  <p className="text-[13px] text-asvo-text">
                    {Array.isArray(review.participants) ? review.participants.map((p: any) => p.name).join(", ") : "—"}
                  </p>
                </div>
              </div>

              {/* Conclusion */}
              <div>
                <label className={labelCls}>Заключение</label>
                <textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Общее заключение о результативности СМК..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Результативность СМК</label>
                  <select value={effectiveness} onChange={(e) => setEffectiveness(e.target.value)} className={inputCls}>
                    <option value="">— Не оценена —</option>
                    {QMS_EFFECTIVENESS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>

              <ActionBtn
                variant="primary"
                onClick={() => doUpdate({ conclusion, qmsEffectiveness: effectiveness || undefined })}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </ActionBtn>

              {/* Status transitions */}
              <div className="flex gap-2 pt-2 border-t border-asvo-border">
                {review.status === "PLANNED" && (
                  <ActionBtn variant="primary" onClick={() => doUpdate({ status: "IN_PROGRESS" })} disabled={saving}>
                    Начать совещание
                  </ActionBtn>
                )}
                {review.status === "IN_PROGRESS" && (
                  <ActionBtn variant="primary" onClick={() => doUpdate({ status: "COMPLETED" })} disabled={saving}>
                    Завершить совещание
                  </ActionBtn>
                )}
                {review.status === "COMPLETED" && (
                  <ActionBtn variant="primary" onClick={() => doUpdate({ status: "APPROVED" })} disabled={saving}>
                    Утвердить протокол
                  </ActionBtn>
                )}
              </div>
            </div>
          )}

          {/* Input data tab */}
          {tab === "input" && (
            <div className="space-y-3">
              <p className="text-[12px] text-asvo-text-dim">
                Входные данные для анализа руководства в соответствии с ISO 13485 §5.6.2
              </p>
              {review.inputData ? (
                <div className="bg-asvo-surface-2 rounded-lg p-3 text-[13px] text-asvo-text">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(review.inputData, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-[13px] text-asvo-text-dim">Входные данные не заполнены</p>
              )}
            </div>
          )}

          {/* Output data tab */}
          {tab === "decisions" && (
            <div className="space-y-3">
              <p className="text-[12px] text-asvo-text-dim">
                Выходные данные анализа руководства в соответствии с ISO 13485 §5.6.3
              </p>
              {review.outputData ? (
                <div className="bg-asvo-surface-2 rounded-lg p-3 text-[13px] text-asvo-text">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(review.outputData, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-[13px] text-asvo-text-dim">Выходные данные не заполнены</p>
              )}
            </div>
          )}

          {/* Actions tab */}
          {tab === "actions" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-asvo-text-mid font-medium">Действия / решения</span>
                <ActionBtn variant="secondary" icon={<Plus size={14} />} onClick={() => setShowActionForm(true)}>
                  Добавить действие
                </ActionBtn>
              </div>

              {showActionForm && (
                <div className="bg-asvo-surface-2 rounded-lg p-3 space-y-3 border border-asvo-border">
                  <div>
                    <label className={labelCls}>Описание действия <span className="text-red-400">*</span></label>
                    <textarea value={actionDesc} onChange={(e) => setActionDesc(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Описание действия/решения..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Ответственный</label>
                      <select value={actionResp} onChange={(e) => setActionResp(Number(e.target.value))} className={inputCls}>
                        <option value={0}>— Не назначен —</option>
                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Срок</label>
                      <input type="date" value={actionDeadline} onChange={(e) => setActionDeadline(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Приоритет</label>
                      <select value={actionPriority} onChange={(e) => setActionPriority(e.target.value)} className={inputCls}>
                        <option value="LOW">Низкий</option>
                        <option value="MEDIUM">Средний</option>
                        <option value="HIGH">Высокий</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionBtn variant="primary" onClick={handleAddAction} disabled={saving || !actionDesc.trim()}>
                      Добавить
                    </ActionBtn>
                    <ActionBtn variant="secondary" onClick={() => setShowActionForm(false)}>Отмена</ActionBtn>
                  </div>
                </div>
              )}

              {/* Actions list */}
              {(review.actions || []).length === 0 && !showActionForm && (
                <p className="text-[13px] text-asvo-text-dim text-center py-4">Действия не добавлены</p>
              )}
              {(review.actions || []).map((a: any) => (
                <div key={a.id} className="bg-asvo-surface-2 rounded-lg p-3 border border-asvo-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[13px] text-asvo-text">{a.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-asvo-text-dim">
                          Ответственный: {getUserName(a.responsibleId)}
                        </span>
                        {a.deadline && (
                          <span className="text-[11px] text-asvo-text-dim flex items-center gap-1">
                            <Clock size={10} /> {formatDate(a.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge color={ACTION_STATUS_MAP[a.status]?.color || "#64748B"}>
                      {ACTION_STATUS_MAP[a.status]?.label || a.status}
                    </Badge>
                  </div>
                  {(a.status === "OPEN" || a.status === "IN_PROGRESS") && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-asvo-border/50">
                      {a.status === "OPEN" && (
                        <ActionBtn variant="secondary" onClick={() => handleUpdateActionStatus(a.id, "IN_PROGRESS")} disabled={saving}>
                          В работу
                        </ActionBtn>
                      )}
                      <ActionBtn variant="primary" icon={<CheckCircle2 size={12} />} onClick={() => handleUpdateActionStatus(a.id, "COMPLETED")} disabled={saving}>
                        Выполнено
                      </ActionBtn>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{error}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ReviewDetailModal;

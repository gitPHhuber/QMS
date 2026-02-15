/**
 * ObjectiveDetailModal.tsx — Просмотр / редактирование цели в области качества
 * ISO 13485 §5.4.1 — Цели в области качества
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Edit3, Save, X, Trash2, AlertTriangle,
  CheckCircle2, XCircle, Target,
} from "lucide-react";

import { Modal } from "../../../components/Modal/Modal";
import { ConfirmModal } from "../../../components/Modal/ConfirmModal";
import { dashboardApi } from "../../../api/qmsApi";
import { getUsers } from "../../../api/userApi";
import type { QualityObjectiveItem } from "../../../api/qmsApi";
import ActionBtn from "../../../components/qms/ActionBtn";
import Badge from "../../../components/qms/Badge";

/* ── Constants ── */

const ISO_SECTIONS = [
  "4.1", "4.2", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6",
  "6.1", "6.2", "6.3", "6.4", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6",
  "8.1", "8.2", "8.3", "8.4", "8.5",
];

const CATEGORIES = [
  { value: "PRODUCT_QUALITY", label: "Качество продукции" },
  { value: "PROCESS_EFFICIENCY", label: "Эффективность процессов" },
  { value: "CUSTOMER_SATISFACTION", label: "Удовлетворённость клиентов" },
  { value: "COMPLIANCE", label: "Соответствие" },
  { value: "IMPROVEMENT", label: "Улучшение" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Активна",
  ACHIEVED: "Достигнута",
  NOT_ACHIEVED: "Не достигнута",
  CANCELLED: "Отменена",
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  ACTIVE:       { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  ACHIEVED:     { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  NOT_ACHIEVED: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  CANCELLED:    { color: "#6B7280", bg: "rgba(107,114,128,0.14)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  PROCESS: "Процесс",
  PRODUCT: "Продукция",
  CUSTOMER: "Клиент",
  IMPROVEMENT: "Улучшение",
  COMPLIANCE: "Соответствие",
  PRODUCT_QUALITY: "Качество продукции",
  PROCESS_EFFICIENCY: "Эффективность процессов",
  CUSTOMER_SATISFACTION: "Удовлетворённость клиентов",
};

/* ── Props ── */

interface ObjectiveDetailModalProps {
  objectiveId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

/* ── Component ── */

const ObjectiveDetailModal: React.FC<ObjectiveDetailModalProps> = ({
  objectiveId, isOpen, onClose, onUpdated,
}) => {
  const [objective, setObjective] = useState<QualityObjectiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  /* ── Fetch ── */

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await dashboardApi.getObjective(objectiveId);
      setObjective(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [objectiveId]);

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setEditing(false);
      setActionError(null);
    }
  }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  /* ── Edit ── */

  const startEditing = () => {
    if (!objective) return;
    setEditForm({
      title: objective.title,
      description: objective.description || "",
      metric: objective.metric || "",
      targetValue: objective.targetValue,
      currentValue: objective.currentValue ?? "",
      unit: objective.unit || "%",
      category: objective.category || "PRODUCT_QUALITY",
      isoClause: objective.isoClause || "",
      responsibleId: objective.responsible?.id || 0,
      dueDate: objective.dueDate?.split("T")[0] || "",
    });
    setEditing(true);
    setActionError(null);
  };

  const handleSave = async () => {
    if (!editForm.title?.trim()) { setActionError("Укажите название цели"); return; }
    if (!editForm.targetValue) { setActionError("Укажите целевое значение"); return; }

    setSaving(true);
    setActionError(null);
    try {
      await dashboardApi.updateObjective(objectiveId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        metric: editForm.metric.trim() || undefined,
        targetValue: Number(editForm.targetValue),
        currentValue: editForm.currentValue !== "" ? Number(editForm.currentValue) : undefined,
        unit: editForm.unit || "%",
        category: editForm.category,
        isoClause: editForm.isoClause || undefined,
        responsibleId: editForm.responsibleId || undefined,
        dueDate: editForm.dueDate || undefined,
      });
      setEditing(false);
      await fetchDetail();
      onUpdated();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── Status change ── */

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await dashboardApi.updateObjective(objectiveId, { status: newStatus });
      await fetchDetail();
      onUpdated();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete (soft) ── */

  const handleDelete = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await dashboardApi.deleteObjective(objectiveId);
      setShowConfirm(false);
      onUpdated();
      onClose();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Helpers ── */

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const progressColor = (p: number) => {
    if (p >= 100) return "bg-asvo-accent";
    if (p >= 50)  return "bg-asvo-blue";
    return "bg-asvo-amber";
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
          <ActionBtn variant="secondary" onClick={fetchDetail} className="mt-3">Повторить</ActionBtn>
        </div>
      )}

      {/* Content */}
      {!loading && !error && objective && (
        <div className="space-y-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{objective.number}</span>
                {(() => {
                  const sc = STATUS_COLORS[objective.status] || STATUS_COLORS.ACTIVE;
                  return <Badge color={sc.color} bg={sc.bg}>{STATUS_LABELS[objective.status] || objective.status}</Badge>;
                })()}
                <Badge color="#A78BFA" bg="rgba(167,139,250,0.14)">
                  {CATEGORY_LABELS[objective.category] || objective.category}
                </Badge>
                {objective.isoClause && (
                  <span className="text-[10px] text-asvo-text-dim">§{objective.isoClause}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{objective.title}</h2>
            </div>
            {objective.status === "ACTIVE" && !editing && (
              <button
                onClick={startEditing}
                className="p-2 bg-asvo-accent/15 text-asvo-accent rounded-lg hover:bg-asvo-accent/25 transition shrink-0"
                title="Редактировать"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>

          {/* ── Progress ── */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-asvo-accent" />
              <span className="text-[13px] font-semibold text-asvo-text">Прогресс</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2.5 rounded-full bg-asvo-bg">
                <div
                  className={`h-2.5 rounded-full transition-all ${progressColor(objective.progress)}`}
                  style={{ width: `${Math.min(100, objective.progress)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-asvo-text w-12 text-right">{objective.progress}%</span>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-asvo-text-dim">
              {objective.metric && <span>Метрика: <span className="text-asvo-text">{objective.metric}</span></span>}
              <span>Цель: <span className="text-asvo-text font-semibold">{objective.targetValue}{objective.unit || ""}</span></span>
              <span>Текущ.: <span className="text-asvo-text font-semibold">{objective.currentValue != null ? `${objective.currentValue}${objective.unit || ""}` : "Не измерено"}</span></span>
            </div>
          </div>

          {/* ── Metadata Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Категория", value: CATEGORY_LABELS[objective.category] || objective.category },
              { label: "Раздел ISO", value: objective.isoClause ? `§${objective.isoClause}` : "\u2014" },
              { label: "Ответственный", value: objective.responsible ? `${objective.responsible.surname} ${objective.responsible.name}` : "\u2014" },
              { label: "Срок", value: fmtDate(objective.dueDate) },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className="text-[13px] font-medium mt-0.5 text-asvo-text truncate">{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── Description ── */}
          {objective.description && !editing && (
            <div>
              <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
              <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{objective.description}</p>
            </div>
          )}

          {/* ── Action Error ── */}
          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{actionError}</span>
            </div>
          )}

          {/* ── Edit Form ── */}
          {editing && (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">
              <div>
                <label className={labelCls}>Название <span className="text-red-400">*</span></label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Описание</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Категория</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Раздел ISO 13485</label>
                  <select value={editForm.isoClause} onChange={(e) => setEditForm({ ...editForm, isoClause: e.target.value })} className={inputCls}>
                    <option value="">— Не указан —</option>
                    {ISO_SECTIONS.map((s) => <option key={s} value={s}>§{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Метрика</label>
                  <input value={editForm.metric} onChange={(e) => setEditForm({ ...editForm, metric: e.target.value })} placeholder="% брака" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Целевое <span className="text-red-400">*</span></label>
                  <input type="number" value={editForm.targetValue} onChange={(e) => setEditForm({ ...editForm, targetValue: e.target.value ? Number(e.target.value) : "" })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Текущее</label>
                  <input type="number" value={editForm.currentValue} onChange={(e) => setEditForm({ ...editForm, currentValue: e.target.value ? Number(e.target.value) : "" })} placeholder="—" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ед. изм.</label>
                  <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} placeholder="%" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ответственный</label>
                  <select value={editForm.responsibleId} onChange={(e) => setEditForm({ ...editForm, responsibleId: Number(e.target.value) })} className={inputCls}>
                    <option value={0}>— Не назначен —</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Срок</label>
                  <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="flex gap-2">
                <ActionBtn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить"}
                </ActionBtn>
                <ActionBtn variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Отмена</ActionBtn>
              </div>
            </div>
          )}

          {/* ── Status Actions (only for ACTIVE) ── */}
          {!editing && objective.status === "ACTIVE" && (
            <div className="flex items-center gap-2 pt-2 border-t border-asvo-border">
              <ActionBtn
                variant="primary"
                icon={<CheckCircle2 size={14} />}
                onClick={() => handleStatusChange("ACHIEVED")}
                disabled={actionLoading}
              >
                Достигнута
              </ActionBtn>
              <ActionBtn
                variant="secondary"
                icon={<XCircle size={14} />}
                onClick={() => handleStatusChange("NOT_ACHIEVED")}
                disabled={actionLoading}
              >
                Не достигнута
              </ActionBtn>
              <div className="flex-1" />
              <ActionBtn
                variant="secondary"
                icon={<Trash2 size={14} />}
                onClick={() => setShowConfirm(true)}
                disabled={actionLoading}
                className="!text-red-400 hover:!bg-red-500/10"
              >
                Отменить цель
              </ActionBtn>
            </div>
          )}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Отмена цели"
        message={`Отменить цель "${objective?.title}"? Статус будет изменён на «Отменена».`}
        confirmText="Отменить цель"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  );
};

export default ObjectiveDetailModal;

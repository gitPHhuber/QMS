/**
 * CreateRiskModal.tsx — Модалка создания риска
 * ISO 14971 / ISO 13485 §7.1 — Управление рисками
 */

import React, { useState, useEffect, useMemo } from "react";
import { Shield } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { risksApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const CATEGORIES = [
  { value: "PRODUCT", label: "Продукция" },
  { value: "PROCESS", label: "Процесс" },
  { value: "SUPPLIER", label: "Поставщик" },
  { value: "REGULATORY", label: "Регуляторный" },
  { value: "INFRASTRUCTURE", label: "Инфраструктура" },
  { value: "HUMAN", label: "Человеческий фактор" },
  { value: "CYBER", label: "Кибербезопасность" },
];

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

function getRiskClass(level: number): { label: string; color: string; bg: string } {
  if (level <= 4)  return { label: "LOW",      color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" };
  if (level <= 9)  return { label: "MEDIUM",   color: "#E8A830", bg: "rgba(232,168,48,0.14)" };
  if (level <= 15) return { label: "HIGH",     color: "#E87040", bg: "rgba(232,112,64,0.14)" };
  return                   { label: "CRITICAL", color: "#F06060", bg: "rgba(240,96,96,0.14)" };
}

/* ── Props ── */

interface CreateRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateRiskModal: React.FC<CreateRiskModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [initialProbability, setInitialProbability] = useState(3);
  const [initialSeverity, setInitialSeverity] = useState(3);
  const [ownerId, setOwnerId] = useState<number>(0);
  const [reviewDate, setReviewDate] = useState("");
  const [isoClause, setIsoClause] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  const riskLevel = useMemo(() => initialProbability * initialSeverity, [initialProbability, initialSeverity]);
  const riskCls = useMemo(() => getRiskClass(riskLevel), [riskLevel]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("PRODUCT");
    setInitialProbability(3); setInitialSeverity(3);
    setOwnerId(0); setReviewDate(""); setIsoClause("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название риска"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await risksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        initialProbability,
        initialSeverity,
        ownerId: ownerId || undefined,
        reviewDate: reviewDate || undefined,
        isoClause: isoClause.trim() || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании риска");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать риск" size="xl">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Краткое название риска" className={inputCls} autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание риска и потенциальных последствий..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Категория</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Probability + Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Вероятность (P)</label>
            <select value={initialProbability} onChange={(e) => setInitialProbability(Number(e.target.value))} className={inputCls}>
              {PROBABILITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Тяжесть (S)</label>
            <select value={initialSeverity} onChange={(e) => setInitialSeverity(Number(e.target.value))} className={inputCls}>
              {SEVERITY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Auto-calculated risk level */}
        <div className="flex items-center gap-3 bg-asvo-surface-2 border border-asvo-border rounded-lg px-4 py-3">
          <span className="text-[13px] text-asvo-text-dim">Уровень риска:</span>
          <span className="font-mono text-[14px] font-bold text-asvo-text">
            {initialProbability} &times; {initialSeverity} = {riskLevel}
          </span>
          <span
            className="inline-flex items-center rounded-xl text-[11px] font-semibold px-2.5 py-0.5 leading-none"
            style={{ backgroundColor: riskCls.bg, color: riskCls.color }}
          >
            {riskCls.label}
          </span>
        </div>

        {/* Owner + Review date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Владелец риска</label>
            <select value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Дата пересмотра</label>
            <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* ISO Clause */}
        <div>
          <label className={labelCls}>Пункт ISO</label>
          <input value={isoClause} onChange={(e) => setIsoClause(e.target.value)} placeholder="Например: 7.1, 7.3.3, 8.2.1" className={inputCls} />
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Shield size={12} className="inline mr-1 text-asvo-accent" />
            Риску будет присвоен номер RISK-YYYY-NNNN. Статус: «Оценка». Начальная оценка P&times;S будет зафиксирована как первичная.
          </p>
        </div>

        {/* Error */}
        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-[12px]">{formError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>Отмена</ActionBtn>
          <ActionBtn variant="primary" icon={<Shield size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать риск"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRiskModal;

/**
 * CreateObjectiveModal.tsx — Создание цели в области качества
 * ISO 13485 §5.4.1 — Цели в области качества
 */

import React, { useState, useEffect } from "react";
import { Crosshair } from "lucide-react";

import { Modal } from "../../../components/Modal/Modal";
import { dashboardApi } from "../../../api/qmsApi";
import { getUsers } from "../../../api/userApi";
import ActionBtn from "../../../components/qms/ActionBtn";

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

interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateObjectiveModal: React.FC<CreateObjectiveModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [targetValue, setTargetValue] = useState<number | "">("");
  const [unit, setUnit] = useState("%");
  const [category, setCategory] = useState("PRODUCT_QUALITY");
  const [isoClause, setIsoClause] = useState("");
  const [responsibleId, setResponsibleId] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
    }
  }, [isOpen, users.length]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setMetric(""); setTargetValue("");
    setUnit("%"); setCategory("PRODUCT_QUALITY"); setIsoClause("");
    setResponsibleId(0); setDueDate(""); setPeriodFrom(""); setPeriodTo("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название цели"); return; }
    if (!targetValue) { setFormError("Укажите целевое значение"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await dashboardApi.createObjective({
        title: title.trim(),
        description: description.trim() || undefined,
        metric: metric.trim() || undefined,
        targetValue: Number(targetValue),
        unit,
        category,
        isoClause: isoClause || undefined,
        responsibleId: responsibleId || undefined,
        dueDate: dueDate || undefined,
        periodFrom: periodFrom || undefined,
        periodTo: periodTo || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании цели");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новая цель в области качества" size="xl">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Снизить % брака до 0.5%" className={inputCls} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Раздел ISO 13485</label>
            <select value={isoClause} onChange={(e) => setIsoClause(e.target.value)} className={inputCls}>
              <option value="">— Не указан —</option>
              {ISO_SECTIONS.map((s) => <option key={s} value={s}>§{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Подробное описание цели..." />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Метрика</label>
            <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="% брака" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Целевое значение <span className="text-red-400">*</span></label>
            <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : "")} placeholder="0.5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ед. измерения</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Ответственный</label>
            <select value={responsibleId} onChange={(e) => setResponsibleId(Number(e.target.value))} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Период с</label>
            <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Период до</label>
            <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-[12px]">{formError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>Отмена</ActionBtn>
          <ActionBtn variant="primary" icon={<Crosshair size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать цель"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateObjectiveModal;

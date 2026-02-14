/**
 * CreateChangeModal.tsx — Create Engineering Change Request (ECR)
 * ISO 13485 §7.3.9 — Design and Development Changes
 */

import React, { useState } from "react";
import { GitBranch } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { changeRequestsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Types ── */

type ChangeType = "DESIGN" | "PROCESS" | "DOCUMENT" | "SUPPLIER" | "SOFTWARE" | "MATERIAL" | "OTHER";
type ChangePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ChangeCategory = "MAJOR" | "MINOR";

const TYPE_OPTIONS: { value: ChangeType; label: string }[] = [
  { value: "DESIGN", label: "Конструкция" },
  { value: "PROCESS", label: "Процесс" },
  { value: "DOCUMENT", label: "Документ" },
  { value: "SUPPLIER", label: "Поставщик" },
  { value: "SOFTWARE", label: "ПО" },
  { value: "MATERIAL", label: "Материал" },
  { value: "OTHER", label: "Другое" },
];

const PRIORITY_OPTIONS: { value: ChangePriority; label: string }[] = [
  { value: "CRITICAL", label: "Критический" },
  { value: "HIGH", label: "Высокий" },
  { value: "MEDIUM", label: "Средний" },
  { value: "LOW", label: "Низкий" },
];

const CATEGORY_OPTIONS: { value: ChangeCategory; label: string }[] = [
  { value: "MAJOR", label: "MAJOR — влияет на безопасность / эффективность" },
  { value: "MINOR", label: "MINOR — не влияет на безопасность" },
];

/* ── Props ── */

interface CreateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateChangeModal: React.FC<CreateChangeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  /* Form fields */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [type, setType] = useState<ChangeType>("DESIGN");
  const [priority, setPriority] = useState<ChangePriority>("MEDIUM");
  const [category, setCategory] = useState<ChangeCategory>("MAJOR");
  const [affectedProducts, setAffectedProducts] = useState("");
  const [affectedDocuments, setAffectedDocuments] = useState("");
  const [affectedProcesses, setAffectedProcesses] = useState("");
  const [regulatoryImpact, setRegulatoryImpact] = useState("");
  const [plannedDate, setPlannedDate] = useState("");

  /* UI state */
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ── Reset ── */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setJustification("");
    setType("DESIGN");
    setPriority("MEDIUM");
    setCategory("MAJOR");
    setAffectedProducts("");
    setAffectedDocuments("");
    setAffectedProcesses("");
    setRegulatoryImpact("");
    setPlannedDate("");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setFormError(null);

    if (!title.trim()) {
      setFormError("Укажите название изменения");
      return;
    }

    setSubmitting(true);
    try {
      await changeRequestsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        justification: justification.trim() || undefined,
        type,
        priority,
        category,
        affectedProducts: affectedProducts.trim() || undefined,
        affectedDocuments: affectedDocuments.trim() || undefined,
        affectedProcesses: affectedProcesses.trim() || undefined,
        regulatoryImpact: regulatoryImpact.trim() || undefined,
        plannedDate: plannedDate || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(
        e.response?.data?.message || e.message || "Ошибка при создании запроса на изменение"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новый запрос на изменение (ECR)" size="3xl">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>
            Название <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Краткое описание изменения"
            className={inputCls}
            autoFocus
          />
        </div>

        {/* Type + Priority + Category */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Тип изменения</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChangeType)}
              className={inputCls}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ChangePriority)}
              className={inputCls}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChangeCategory)}
              className={inputCls}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание изменения</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробное описание предлагаемого изменения..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Justification */}
        <div>
          <label className={labelCls}>Обоснование</label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Причина и необходимость данного изменения..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Affected areas */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Затронутые продукты</label>
            <textarea
              value={affectedProducts}
              onChange={(e) => setAffectedProducts(e.target.value)}
              placeholder="Список продуктов..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Затронутые документы</label>
            <textarea
              value={affectedDocuments}
              onChange={(e) => setAffectedDocuments(e.target.value)}
              placeholder="Список документов..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Затронутые процессы</label>
            <textarea
              value={affectedProcesses}
              onChange={(e) => setAffectedProcesses(e.target.value)}
              placeholder="Список процессов..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Regulatory impact + Planned date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Регуляторное воздействие</label>
            <textarea
              value={regulatoryImpact}
              onChange={(e) => setRegulatoryImpact(e.target.value)}
              placeholder="Влияние на регуляторные требования..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Плановая дата внедрения</label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <GitBranch size={12} className="inline mr-1 text-asvo-accent" />
            Запрос на изменение будет создан со статусом «Черновик». После отправки
            он пройдёт этапы согласования, оценки влияния и верификации.
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
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>
            Отмена
          </ActionBtn>
          <ActionBtn
            variant="primary"
            icon={<GitBranch size={14} />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Создание..." : "Создать ECR"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateChangeModal;

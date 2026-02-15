/**
 * CreateProductModal.tsx — Modal for creating a new product
 * ISO 13485 §7.5.3 — Identification and Traceability
 */

import React, { useState } from "react";
import { Package } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { productsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const RISK_CLASSES = [
  { value: "CLASS_I",   label: "Класс I" },
  { value: "CLASS_IIA", label: "Класс IIa" },
  { value: "CLASS_IIB", label: "Класс IIb" },
  { value: "CLASS_III", label: "Класс III" },
];

const PRODUCTION_STATUSES = [
  { value: "DEVELOPMENT",   label: "Разработка" },
  { value: "PROTOTYPE",     label: "Прототип" },
  { value: "PILOT",         label: "Опытная серия" },
  { value: "SERIAL",        label: "Серийное производство" },
  { value: "DISCONTINUED",  label: "Снято с производства" },
];

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Props ── */

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [riskClass, setRiskClass] = useState("CLASS_I");
  const [productionStatus, setProductionStatus] = useState("DEVELOPMENT");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setRiskClass("CLASS_I");
    setProductionStatus("DEVELOPMENT");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Укажите наименование изделия");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await productsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        riskClass,
        productionStatus,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(
        e.response?.data?.message || e.message || "Ошибка при создании изделия"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новое изделие" size="xl">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls}>
            Наименование <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название медицинского изделия"
            className={inputCls}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание изделия, назначение..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Категория</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Например: Диагностическое оборудование"
            className={inputCls}
          />
        </div>

        {/* Risk Class + Production Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Класс риска</label>
            <select
              value={riskClass}
              onChange={(e) => setRiskClass(e.target.value)}
              className={inputCls}
            >
              {RISK_CLASSES.map((rc) => (
                <option key={rc.value} value={rc.value}>
                  {rc.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Статус производства</label>
            <select
              value={productionStatus}
              onChange={(e) => setProductionStatus(e.target.value)}
              className={inputCls}
            >
              {PRODUCTION_STATUSES.map((ps) => (
                <option key={ps.value} value={ps.value}>
                  {ps.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Package size={12} className="inline mr-1 text-asvo-accent" />
            Изделию будет присвоен уникальный код. Класс риска и статус производства можно изменить позже.
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
            icon={<Package size={14} />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Создание..." : "Создать изделие"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProductModal;

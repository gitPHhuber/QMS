/**
 * AddMaterialModal.tsx — Modal for adding material trace to a DHR record
 * ISO 13485 §7.5.9 — Traceability
 */

import React, { useState } from "react";
import { Package } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { dhrApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

const MATERIAL_TYPES = [
  { value: "COMPONENT", label: "Компонент" },
  { value: "RAW_MATERIAL", label: "Сырьё" },
  { value: "SUBASSEMBLY", label: "Подсборка" },
  { value: "PACKAGING", label: "Упаковка" },
];

interface AddMaterialModalProps {
  dhrId: number;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  dhrId, isOpen, onClose, onAdded,
}) => {
  const [materialType, setMaterialType] = useState("COMPONENT");
  const [description, setDescription] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("шт.");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setMaterialType("COMPONENT");
    setDescription("");
    setPartNumber("");
    setLotNumber("");
    setSupplierName("");
    setQuantity("");
    setUnit("шт.");
    setNotes("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!description.trim()) { setFormError("Укажите описание материала"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await dhrApi.addMaterial(dhrId, {
        materialType,
        description: description.trim(),
        partNumber: partNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit.trim() || "pcs",
        notes: notes.trim() || undefined,
      });
      resetForm();
      onAdded();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при добавлении материала");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить материал" size="2xl">
      <div className="space-y-4">
        {/* Material type + Description */}
        <div className="grid grid-cols-[180px_1fr] gap-4">
          <div>
            <label className={labelCls}>Тип материала</label>
            <select value={materialType} onChange={(e) => setMaterialType(e.target.value)} className={inputCls}>
              {MATERIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Описание <span className="text-red-400">*</span></label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Название / описание материала" className={inputCls} autoFocus />
          </div>
        </div>

        {/* Part # + Lot # */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Part #</label>
            <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Номер детали" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Lot / Batch #</label>
            <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Номер партии" className={inputCls} />
          </div>
        </div>

        {/* Supplier + Quantity + Unit */}
        <div className="grid grid-cols-[1fr_120px_100px] gap-4">
          <div>
            <label className={labelCls}>Поставщик</label>
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Название поставщика" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Количество</label>
            <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ед. изм.</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт." className={inputCls} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Примечания</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительная информация..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Info */}
        <div className="bg-[rgba(74,144,232,0.08)] border border-[rgba(74,144,232,0.2)] rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Package size={12} className="inline mr-1 text-[#4A90E8]" />
            Запись прослеживаемости материалов (ISO 13485 §7.5.9). Укажите партию и поставщика для обеспечения прослеживаемости компонентов.
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
          <ActionBtn variant="primary" icon={<Package size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Добавление..." : "Добавить материал"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default AddMaterialModal;

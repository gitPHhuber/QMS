/**
 * CreateNcModal.tsx — Модалка регистрации несоответствия (NC)
 * ISO 13485 §8.3 — Управление несоответствующей продукцией
 */

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { ncApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const NC_SOURCES = [
  { value: "INCOMING_INSPECTION", label: "Входной контроль" },
  { value: "IN_PROCESS",         label: "В процессе производства" },
  { value: "FINAL_INSPECTION",   label: "Финальная инспекция" },
  { value: "CUSTOMER_COMPLAINT", label: "Рекламация клиента" },
  { value: "INTERNAL_AUDIT",     label: "Внутренний аудит" },
  { value: "EXTERNAL_AUDIT",     label: "Внешний аудит" },
  { value: "SUPPLIER",           label: "Поставщик" },
  { value: "FIELD_RETURN",       label: "Возврат с поля" },
  { value: "OTHER",              label: "Другое" },
];

const NC_CLASSIFICATIONS = [
  { value: "CRITICAL", label: "Критическое" },
  { value: "MAJOR",    label: "Серьёзное" },
  { value: "MINOR",    label: "Незначительное" },
];

const NC_DISPOSITIONS = [
  { value: "USE_AS_IS",          label: "Использовать как есть" },
  { value: "REWORK",             label: "Доработка" },
  { value: "REPAIR",             label: "Ремонт" },
  { value: "SCRAP",              label: "Утилизация" },
  { value: "RETURN_TO_SUPPLIER", label: "Возврат поставщику" },
  { value: "CONCESSION",         label: "Уступка" },
  { value: "OTHER",              label: "Другое" },
];

/* ── Props ── */

interface CreateNcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Pre-fill source when creating from Complaint or Audit */
  defaultSource?: string;
}

/* ── Component ── */

const CreateNcModal: React.FC<CreateNcModalProps> = ({
  isOpen, onClose, onCreated, defaultSource,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState(defaultSource || "IN_PROCESS");
  const [classification, setClassification] = useState("MAJOR");
  const [productType, setProductType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [processName, setProcessName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [assignedToId, setAssignedToId] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [capaRequired, setCapaRequired] = useState(false);
  const [totalQty, setTotalQty] = useState<number | "">("");
  const [defectQty, setDefectQty] = useState<number | "">("");

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

  // Auto-set capaRequired for CRITICAL
  useEffect(() => {
    if (classification === "CRITICAL") setCapaRequired(true);
  }, [classification]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setSource(defaultSource || "IN_PROCESS");
    setClassification("MAJOR"); setProductType(""); setSerialNumber("");
    setLotNumber(""); setProcessName(""); setSupplierName("");
    setAssignedToId(0); setDueDate(""); setImmediateAction("");
    setCapaRequired(false); setTotalQty(""); setDefectQty("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название несоответствия"); return; }
    if (title.trim().length < 3) { setFormError("Название должно содержать минимум 3 символа"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await ncApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        source,
        classification,
        productType: productType.trim() || undefined,
        productSerialNumber: serialNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        processName: processName.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate || undefined,
        immediateAction: immediateAction.trim() || undefined,
        capaRequired,
        totalQty: totalQty || undefined,
        defectQty: defectQty || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании NC");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Регистрация несоответствия" size="2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Title */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Краткое описание несоответствия" className={inputCls} autoFocus />
        </div>

        {/* Source + Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Источник обнаружения <span className="text-red-400">*</span></label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
              {NC_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Классификация <span className="text-red-400">*</span></label>
            <select value={classification} onChange={(e) => setClassification(e.target.value)} className={inputCls}>
              {NC_CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание несоответствия, обстоятельства обнаружения..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Product info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Тип продукции</label>
            <input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Название изделия" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Серийный номер</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="S/N" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Номер партии</label>
            <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="LOT" className={inputCls} />
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Общее количество</label>
            <input type="number" min={0} value={totalQty} onChange={(e) => setTotalQty(e.target.value ? Number(e.target.value) : "")} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Количество дефектных</label>
            <input type="number" min={0} value={defectQty} onChange={(e) => setDefectQty(e.target.value ? Number(e.target.value) : "")} placeholder="0" className={inputCls} />
          </div>
        </div>

        {/* Process + Supplier */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Процесс</label>
            <input value={processName} onChange={(e) => setProcessName(e.target.value)} placeholder="Название процесса" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Поставщик</label>
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Название поставщика" className={inputCls} />
          </div>
        </div>

        {/* Immediate action */}
        <div>
          <label className={labelCls}>Немедленное действие</label>
          <textarea value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} placeholder="Какие немедленные действия были предприняты..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Assigned + Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ответственный</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(Number(e.target.value))} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Срок устранения</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* CAPA required */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={capaRequired} onChange={(e) => setCapaRequired(e.target.checked)} disabled={classification === "CRITICAL"} className="rounded border-asvo-border" />
          <span className="text-[13px] text-asvo-text">Требуется CAPA</span>
          {classification === "CRITICAL" && (
            <span className="text-[11px] text-red-400">(обязательно для критических)</span>
          )}
        </label>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <AlertTriangle size={12} className="inline mr-1 text-asvo-accent" />
            Несоответствию будет присвоен номер NC-YYYY-NNNN. После регистрации оно перейдёт в статус «Открыто» и начнётся отсчёт SLA.
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
          <ActionBtn variant="primary" icon={<AlertTriangle size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Регистрация..." : "Зарегистрировать NC"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateNcModal;

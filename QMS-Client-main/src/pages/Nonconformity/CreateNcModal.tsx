/**
 * CreateNcModal.tsx — Модалка регистрации несоответствия (NC)
 * ISO 13485 §8.3 — Управление несоответствующей продукцией
 *
 * Validation: Zod + react-hook-form
 */

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../components/Modal/Modal";
import { ncApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import { createNcSchema, type CreateNcFormData } from "../../validation/schemas";

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

/* ── Props ── */

interface CreateNcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultSource?: string;
}

/* ── Component ── */

const CreateNcModal: React.FC<CreateNcModalProps> = ({
  isOpen, onClose, onCreated, defaultSource,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateNcFormData>({
    resolver: zodResolver(createNcSchema),
    defaultValues: {
      title: "",
      description: "",
      source: (defaultSource as any) || "IN_PROCESS",
      classification: "MAJOR",
      productType: "",
      productSerialNumber: "",
      lotNumber: "",
      processName: "",
      supplierName: "",
      assignedToId: 0,
      dueDate: "",
      immediateAction: "",
      capaRequired: false,
      totalQty: undefined,
      defectQty: undefined,
    },
  });

  const classification = watch("classification");

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  // Auto-set capaRequired for CRITICAL
  useEffect(() => {
    if (classification === "CRITICAL") setValue("capaRequired", true);
  }, [classification, setValue]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: CreateNcFormData) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await ncApi.create(data);
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setServerError(e.response?.data?.message || e.message || "Ошибка при создании NC");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const inputErrCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-red-500/50 rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-red-400 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";
  const errCls = "text-red-400 text-[11px] mt-1";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Регистрация несоответствия" size="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Title */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input {...register("title")} placeholder="Краткое описание несоответствия" className={errors.title ? inputErrCls : inputCls} autoFocus />
          {errors.title && <p className={errCls}>{errors.title.message}</p>}
        </div>

        {/* Source + Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Источник обнаружения <span className="text-red-400">*</span></label>
            <select {...register("source")} className={errors.source ? inputErrCls : inputCls}>
              {NC_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {errors.source && <p className={errCls}>{errors.source.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Классификация <span className="text-red-400">*</span></label>
            <select {...register("classification")} className={errors.classification ? inputErrCls : inputCls}>
              {NC_CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.classification && <p className={errCls}>{errors.classification.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea {...register("description")} placeholder="Подробное описание несоответствия, обстоятельства обнаружения..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Product info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Тип продукции</label>
            <input {...register("productType")} placeholder="Название изделия" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Серийный номер</label>
            <input {...register("productSerialNumber")} placeholder="S/N" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Номер партии</label>
            <input {...register("lotNumber")} placeholder="LOT" className={inputCls} />
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Общее количество</label>
            <input type="number" min={0} {...register("totalQty")} placeholder="0" className={inputCls} />
            {errors.totalQty && <p className={errCls}>{errors.totalQty.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Количество дефектных</label>
            <input type="number" min={0} {...register("defectQty")} placeholder="0" className={inputCls} />
            {errors.defectQty && <p className={errCls}>{errors.defectQty.message}</p>}
          </div>
        </div>

        {/* Process + Supplier */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Процесс</label>
            <input {...register("processName")} placeholder="Название процесса" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Поставщик</label>
            <input {...register("supplierName")} placeholder="Название поставщика" className={inputCls} />
          </div>
        </div>

        {/* Immediate action */}
        <div>
          <label className={labelCls}>Немедленное действие</label>
          <textarea {...register("immediateAction")} placeholder="Какие немедленные действия были предприняты..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Assigned + Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ответственный</label>
            <select {...register("assignedToId")} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Срок устранения</label>
            <input type="date" {...register("dueDate")} className={inputCls} />
          </div>
        </div>

        {/* CAPA required */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("capaRequired")} disabled={classification === "CRITICAL"} className="rounded border-asvo-border" />
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

        {/* Server Error */}
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-[12px]">{serverError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>Отмена</ActionBtn>
          <ActionBtn variant="primary" icon={<AlertTriangle size={14} />} onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? "Регистрация..." : "Зарегистрировать NC"}
          </ActionBtn>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNcModal;

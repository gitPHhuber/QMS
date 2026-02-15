/**
 * CreateCapaModal.tsx — Модалка создания CAPA
 * ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия
 *
 * Validation: Zod + react-hook-form
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../components/Modal/Modal";
import { capaApi, ncApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import { createCapaSchema, type CreateCapaFormData } from "../../validation/schemas";

/* ── Constants ── */

const CAPA_TYPES = [
  { value: "CORRECTIVE",  label: "Корректирующее действие (§8.5.2)" },
  { value: "PREVENTIVE",  label: "Предупреждающее действие (§8.5.3)" },
];

const PRIORITIES = [
  { value: "LOW",      label: "Низкий" },
  { value: "MEDIUM",   label: "Средний" },
  { value: "HIGH",     label: "Высокий" },
  { value: "URGENT",   label: "Срочный" },
];

/* ── Props ── */

interface CreateCapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultNcId?: number;
}

/* ── Component ── */

const CreateCapaModal: React.FC<CreateCapaModalProps> = ({
  isOpen, onClose, onCreated, defaultNcId,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [ncList, setNcList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCapaFormData>({
    resolver: zodResolver(createCapaSchema),
    defaultValues: {
      type: "CORRECTIVE",
      title: "",
      description: "",
      priority: "MEDIUM",
      nonconformityId: defaultNcId || 0,
      assignedToId: 0,
      dueDate: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (users.length === 0) {
        getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
      }
      ncApi.getAll({ status: "OPEN,INVESTIGATING,DISPOSITION,IMPLEMENTING,VERIFICATION" })
        .then((res) => setNcList(res.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: CreateCapaFormData) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await capaApi.create(data);
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setServerError(e.response?.data?.message || e.message || "Ошибка при создании CAPA");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const inputErrCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-red-500/50 rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-red-400 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";
  const errCls = "text-red-400 text-[11px] mt-1";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать CAPA" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <div>
          <label className={labelCls}>Тип <span className="text-red-400">*</span></label>
          <select {...register("type")} className={errors.type ? inputErrCls : inputCls}>
            {CAPA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.type && <p className={errCls}>{errors.type.message}</p>}
        </div>

        {/* Title */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input {...register("title")} placeholder="Краткое название корректирующего/предупреждающего действия" className={errors.title ? inputErrCls : inputCls} autoFocus />
          {errors.title && <p className={errCls}>{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea {...register("description")} placeholder="Подробное описание проблемы и необходимых действий..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Priority + NC Link */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Приоритет</label>
            <select {...register("priority")} className={inputCls}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Связанное NC</label>
            <select {...register("nonconformityId")} className={inputCls}>
              <option value={0}>— Без привязки —</option>
              {ncList.map((nc: any) => <option key={nc.id} value={nc.id}>{nc.number} — {nc.title}</option>)}
            </select>
          </div>
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
            <label className={labelCls}>Срок выполнения</label>
            <input type="date" {...register("dueDate")} className={inputCls} />
          </div>
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <CheckCircle2 size={12} className="inline mr-1 text-asvo-accent" />
            CAPA будет присвоен номер CAPA-YYYY-NNNN. Статус: «Инициировано». Срок верификации эффективности — 90 дней после закрытия.
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
          <ActionBtn variant="primary" icon={<CheckCircle2 size={14} />} onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? "Создание..." : "Создать CAPA"}
          </ActionBtn>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCapaModal;

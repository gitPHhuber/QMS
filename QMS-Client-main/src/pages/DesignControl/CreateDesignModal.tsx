/**
 * CreateDesignModal.tsx -- Create a new Design Control project
 * ISO 13485 \u00a77.3 -- Design and Development Planning
 */

import React, { useState, useEffect } from "react";
import { Compass } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { designApi } from "../../api/qms/design";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* --- Constants --- */

const PRODUCT_TYPES = [
  { value: "IMPLANT",          label: "Имплантируемое изделие" },
  { value: "IVD",              label: "Средство IVD" },
  { value: "ACTIVE_DEVICE",    label: "Активное медицинское изделие" },
  { value: "NON_ACTIVE_DEVICE", label: "Неактивное медицинское изделие" },
  { value: "SOFTWARE",         label: "Программное обеспечение (SaMD)" },
  { value: "COMBINATION",      label: "Комбинированное изделие" },
  { value: "OTHER",            label: "Другое" },
];

const REGULATORY_CLASSES = [
  { value: "I",    label: "Класс I" },
  { value: "IIa",  label: "Класс IIa" },
  { value: "IIb",  label: "Класс IIb" },
  { value: "III",  label: "Класс III" },
];

/* --- Props --- */

interface CreateDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* --- Component --- */

const CreateDesignModal: React.FC<CreateDesignModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("ACTIVE_DEVICE");
  const [regulatoryClass, setRegulatoryClass] = useState("IIa");
  const [teamLeadId, setTeamLeadId] = useState<number>(0);
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");

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

  const resetForm = () => {
    setTitle(""); setDescription("");
    setProductType("ACTIVE_DEVICE"); setRegulatoryClass("IIa");
    setTeamLeadId(0); setPlannedStart(""); setPlannedEnd("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название проекта"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await designApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        productType,
        regulatoryClass,
        teamLeadId: teamLeadId || undefined,
        plannedStart: plannedStart || undefined,
        plannedEnd: plannedEnd || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании проекта");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новый проект Design Control" size="xl">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Название проекта <span className="text-red-400">*</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название проекта проектирования и разработки"
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
            placeholder="Цели проекта, область применения, предполагаемое назначение..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Product Type + Regulatory Class */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Тип изделия</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={inputCls}
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Класс регулирования</label>
            <select
              value={regulatoryClass}
              onChange={(e) => setRegulatoryClass(e.target.value)}
              className={inputCls}
            >
              {REGULATORY_CLASSES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Lead */}
        <div>
          <label className={labelCls}>Руководитель проекта</label>
          <select
            value={teamLeadId}
            onChange={(e) => setTeamLeadId(Number(e.target.value))}
            className={inputCls}
          >
            <option value={0}>{"\u2014"} Не назначен {"\u2014"}</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.surname} {u.name}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Планируемое начало</label>
            <input
              type="date"
              value={plannedStart}
              onChange={(e) => setPlannedStart(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Планируемое завершение</label>
            <input
              type="date"
              value={plannedEnd}
              onChange={(e) => setPlannedEnd(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-[rgba(232,144,48,0.06)] border border-[#E89030]/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Compass size={12} className="inline mr-1 text-[#E89030]" />
            Проекту будет присвоен номер DC-YYYY-NNNN. Статус: Планирование (\u00a77.3.2).
            Входные данные, анализ, верификация и валидация добавляются в карточке проекта.
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
          <ActionBtn variant="primary" icon={<Compass size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать проект"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateDesignModal;

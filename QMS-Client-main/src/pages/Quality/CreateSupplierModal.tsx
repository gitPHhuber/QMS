/**
 * CreateSupplierModal.tsx — Modal for creating a new supplier
 * ISO 13485 §7.4 — Purchasing / Supplier Management
 */

import React, { useState } from "react";
import { Truck } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { suppliersApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const CATEGORIES = [
  "Компоненты", "PCB", "Крепёж", "Корпуса", "Датчики", "Калибровка", "Другое",
];

const CRITICALITY_OPTIONS = [
  { value: "CRITICAL", label: "Критический" },
  { value: "HIGH",     label: "Высокий" },
  { value: "MEDIUM",   label: "Средний" },
  { value: "LOW",      label: "Низкий" },
];

/* ── Props ── */

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [criticality, setCriticality] = useState("MEDIUM");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [inn, setInn] = useState("");
  const [certifications, setCertifications] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName(""); setDescription(""); setCategory(CATEGORIES[0]);
    setCriticality("MEDIUM"); setContactPerson(""); setEmail("");
    setPhone(""); setAddress(""); setInn(""); setCertifications("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setFormError("Укажите название поставщика"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      const certs = certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await suppliersApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        criticality,
        contactPerson: contactPerson.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        inn: inn.trim() || undefined,
        certifications: certs.length ? certs : undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании поставщика");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новый поставщик" size="xl">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название компании-поставщика" className={inputCls} autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание поставщика и поставляемой продукции..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Category + Criticality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Критичность</label>
            <select value={criticality} onChange={(e) => setCriticality(e.target.value)} className={inputCls}>
              {CRITICALITY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Contact Person + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Контактное лицо</label>
            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="ФИО" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
        </div>

        {/* Phone + INN */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Телефон</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ИНН</label>
            <input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="1234567890" className={inputCls} />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className={labelCls}>Адрес</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Юридический адрес" className={inputCls} />
        </div>

        {/* Certifications */}
        <div>
          <label className={labelCls}>Сертификаты</label>
          <textarea value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="ISO 9001, ISO 13485, ISO 14001 (через запятую)" rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Truck size={12} className="inline mr-1 text-asvo-accent" />
            Поставщику будет присвоен статус &laquo;Новый&raquo;. Для смены статуса на &laquo;Одобрен&raquo; необходимо провести входной аудит и оценку.
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
          <ActionBtn variant="primary" icon={<Truck size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать поставщика"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateSupplierModal;

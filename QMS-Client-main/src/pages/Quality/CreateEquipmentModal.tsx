/**
 * CreateEquipmentModal.tsx — Модалка создания оборудования
 * ISO 13485 §7.6 — Управление оборудованием для мониторинга и измерений
 */

import React, { useState, useEffect } from "react";
import { Wrench } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { equipmentApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const EQUIPMENT_TYPES = [
  { value: "MEASURING", label: "Измерительное" },
  { value: "TESTING", label: "Испытательное" },
  { value: "PRODUCTION", label: "Производственное" },
  { value: "CLEANING", label: "Очистительное" },
  { value: "OTHER", label: "Прочее" },
];

/* ── Props ── */

interface CreateEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateEquipmentModal: React.FC<CreateEquipmentModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("MEASURING");
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [location, setLocation] = useState("");
  const [responsibleId, setResponsibleId] = useState<number>(0);
  const [nextCalibrationDate, setNextCalibrationDate] = useState("");
  const [accuracyClass, setAccuracyClass] = useState("");
  const [commissionDate, setCommissionDate] = useState("");

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
    setName(""); setType("MEASURING"); setSerialNumber("");
    setModel(""); setManufacturer(""); setLocation("");
    setResponsibleId(0); setNextCalibrationDate("");
    setAccuracyClass(""); setCommissionDate("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setFormError("Укажите название оборудования"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await equipmentApi.create({
        name: name.trim(),
        type,
        serialNumber: serialNumber.trim() || undefined,
        model: model.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        location: location.trim() || undefined,
        responsibleId: responsibleId || undefined,
        nextCalibrationDate: nextCalibrationDate || undefined,
        accuracyClass: accuracyClass.trim() || undefined,
        commissionDate: commissionDate || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании оборудования");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить оборудование" size="xl">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название оборудования" className={inputCls} autoFocus />
        </div>

        {/* Type */}
        <div>
          <label className={labelCls}>Тип</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {EQUIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Serial + Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Серийный номер</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="S/N" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Модель</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Модель" className={inputCls} />
          </div>
        </div>

        {/* Manufacturer */}
        <div>
          <label className={labelCls}>Производитель</label>
          <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Производитель" className={inputCls} />
        </div>

        {/* Location + Responsible */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Расположение</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Лаборатория, цех..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ответственный</label>
            <select value={responsibleId} onChange={(e) => setResponsibleId(Number(e.target.value))} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Next Calibration + Accuracy Class */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Следующая калибровка</label>
            <input type="date" value={nextCalibrationDate} onChange={(e) => setNextCalibrationDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Класс точности</label>
            <input value={accuracyClass} onChange={(e) => setAccuracyClass(e.target.value)} placeholder="Класс точности" className={inputCls} />
          </div>
        </div>

        {/* Commission Date */}
        <div>
          <label className={labelCls}>Дата ввода в эксплуатацию</label>
          <input type="date" value={commissionDate} onChange={(e) => setCommissionDate(e.target.value)} className={inputCls} />
        </div>

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <Wrench size={12} className="inline mr-1 text-asvo-accent" />
            Оборудованию будет присвоен инвентарный номер. Статус по умолчанию: «Исправно».
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
          <ActionBtn variant="primary" icon={<Wrench size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Добавить оборудование"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateEquipmentModal;

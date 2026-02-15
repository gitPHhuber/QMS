/**
 * CreateComplaintModal.tsx — Modal for creating a new complaint
 * ISO 13485 §8.2.2 — Customer feedback / Complaints handling
 */

import React, { useState, useEffect } from "react";
import { MessageSquareWarning, AlertTriangle } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { complaintsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const COMPLAINT_TYPES = [
  { value: "COMPLAINT",    label: "Рекламация" },
  { value: "RECLAMATION",  label: "Рекламация (возврат)" },
  { value: "FEEDBACK",     label: "Обратная связь" },
];

const SOURCES = [
  { value: "CUSTOMER",     label: "Заказчик" },
  { value: "DISTRIBUTOR",  label: "Дистрибьютор" },
  { value: "INTERNAL",     label: "Внутренний" },
  { value: "REGULATOR",    label: "Регулятор" },
  { value: "FIELD_REPORT", label: "Полевой отчёт" },
];

const SEVERITIES = [
  { value: "CRITICAL",      label: "Критическая" },
  { value: "MAJOR",         label: "Значительная" },
  { value: "MINOR",         label: "Незначительная" },
  { value: "INFORMATIONAL", label: "Информационная" },
];

const CATEGORIES = [
  { value: "SAFETY",        label: "Безопасность" },
  { value: "PERFORMANCE",   label: "Производительность" },
  { value: "LABELING",      label: "Маркировка" },
  { value: "PACKAGING",     label: "Упаковка" },
  { value: "DOCUMENTATION", label: "Документация" },
  { value: "DELIVERY",      label: "Доставка" },
  { value: "SERVICE",       label: "Сервис" },
  { value: "OTHER",         label: "Другое" },
];

/* ── Props ── */

interface CreateComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  /* Form state */
  const [complaintType, setComplaintType] = useState("COMPLAINT");
  const [source, setSource] = useState("CUSTOMER");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [reporterOrganization, setReporterOrganization] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [countryOfOccurrence, setCountryOfOccurrence] = useState("");
  const [productName, setProductName] = useState("");
  const [productModel, setProductModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MAJOR");
  const [category, setCategory] = useState("OTHER");
  const [patientInvolved, setPatientInvolved] = useState(false);
  const [healthHazard, setHealthHazard] = useState(false);
  const [responsibleId, setResponsibleId] = useState<number>(0);

  /* Aux state */
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* Auto-calculate reportable */
  const isReportable =
    severity === "CRITICAL" && (category === "SAFETY" || category === "PERFORMANCE");

  /* Fetch users */
  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  const resetForm = () => {
    setComplaintType("COMPLAINT"); setSource("CUSTOMER");
    setReporterName(""); setReporterContact(""); setReporterOrganization("");
    setReceivedDate(""); setEventDate(""); setCountryOfOccurrence("");
    setProductName(""); setProductModel(""); setSerialNumber(""); setLotNumber("");
    setTitle(""); setDescription("");
    setSeverity("MAJOR"); setCategory("OTHER");
    setPatientInvolved(false); setHealthHazard(false);
    setResponsibleId(0); setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название рекламации"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await complaintsApi.create({
        complaintType,
        source,
        reporterName: reporterName.trim() || undefined,
        reporterContact: reporterContact.trim() || undefined,
        reporterOrganization: reporterOrganization.trim() || undefined,
        receivedDate: receivedDate || undefined,
        eventDate: eventDate || undefined,
        countryOfOccurrence: countryOfOccurrence.trim() || undefined,
        productName: productName.trim() || undefined,
        productModel: productModel.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        category,
        patientInvolved,
        healthHazard,
        responsibleId: responsibleId || undefined,
        isReportable,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании рекламации");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новая рекламация" size="3xl">
      <div className="space-y-4">
        {/* Type + Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Тип <span className="text-red-400">*</span></label>
            <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)} className={inputCls}>
              {COMPLAINT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Источник <span className="text-red-400">*</span></label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Reporter info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Имя заявителя</label>
            <input value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="ФИО" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Контакт</label>
            <input value={reporterContact} onChange={(e) => setReporterContact(e.target.value)} placeholder="Email / телефон" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Организация</label>
            <input value={reporterOrganization} onChange={(e) => setReporterOrganization(e.target.value)} placeholder="Название организации" className={inputCls} />
          </div>
        </div>

        {/* Dates + Country */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Дата получения</label>
            <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Дата события</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Страна (ISO 3166)</label>
            <input value={countryOfOccurrence} onChange={(e) => setCountryOfOccurrence(e.target.value)} placeholder="RU, DE, US..." className={inputCls} />
          </div>
        </div>

        {/* Product info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Название продукта</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Наименование изделия" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Модель</label>
            <input value={productModel} onChange={(e) => setProductModel(e.target.value)} placeholder="Модель / артикул" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Серийный номер</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="S/N" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Номер партии</label>
            <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Lot / Batch" className={inputCls} />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelCls}>Название <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Краткое описание рекламации" className={inputCls} autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание проблемы, обстоятельства, последствия..." rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Severity + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Серьёзность <span className="text-red-400">*</span></label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputCls}>
              {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Категория <span className="text-red-400">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={patientInvolved} onChange={(e) => setPatientInvolved(e.target.checked)} className="rounded border-asvo-border text-asvo-accent focus:ring-asvo-accent/30" />
            <span className="text-[13px] text-asvo-text">Пациент вовлечён</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={healthHazard} onChange={(e) => setHealthHazard(e.target.checked)} className="rounded border-asvo-border text-asvo-accent focus:ring-asvo-accent/30" />
            <span className="text-[13px] text-asvo-text">Угроза здоровью</span>
          </label>
        </div>

        {/* Responsible */}
        <div>
          <label className={labelCls}>Ответственный</label>
          <select value={responsibleId} onChange={(e) => setResponsibleId(Number(e.target.value))} className={inputCls}>
            <option value={0}>— Не назначен —</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
          </select>
        </div>

        {/* Reportable warning */}
        {isReportable && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-red-400 leading-relaxed">
              Требуется уведомление регулятора (Vigilance). Критическая серьёзность в сочетании
              с категорией «Безопасность» или «Производительность» подлежит обязательному
              уведомлению в установленные сроки.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <MessageSquareWarning size={12} className="inline mr-1 text-asvo-accent" />
            Рекламации будет присвоен номер COMPL-YYYY-NNNN. Статус: «Получена». Расследование должно
            быть завершено в срок, определённый процедурой обработки рекламаций.
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
          <ActionBtn variant="primary" icon={<MessageSquareWarning size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать рекламацию"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateComplaintModal;

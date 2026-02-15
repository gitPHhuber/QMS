/**
 * CreatePlanModal.tsx — Modal for creating Risk Management Plans
 * ISO 14971 §4.4 — Risk Management Plan
 */

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";

import { Modal } from "../../../components/Modal/Modal";
import { riskManagementApi } from "../../../api/qmsApi";
import { getUsers } from "../../../api/userApi";
import ActionBtn from "../../../components/qms/ActionBtn";

const LIFECYCLE_PHASES = [
  { value: "CONCEPT", label: "Разработка концепции" },
  { value: "DESIGN", label: "Проектирование" },
  { value: "VERIFICATION", label: "Верификация" },
  { value: "VALIDATION", label: "Валидация" },
  { value: "PRODUCTION", label: "Производство" },
  { value: "POST_MARKET", label: "Постмаркетинговое наблюдение" },
];

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [productName, setProductName] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [scope, setScope] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [intendedPatientPopulation, setIntendedPatientPopulation] = useState("");
  const [lifecyclePhase, setLifecyclePhase] = useState("CONCEPT");
  const [responsiblePersonId, setResponsiblePersonId] = useState<number>(0);
  const [nextReviewDate, setNextReviewDate] = useState("");

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
    setTitle(""); setProductName(""); setIntendedUse(""); setScope("");
    setProductDescription(""); setIntendedPatientPopulation("");
    setLifecyclePhase("CONCEPT"); setResponsiblePersonId(0);
    setNextReviewDate(""); setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название плана"); return; }
    if (!productName.trim()) { setFormError("Укажите название изделия"); return; }
    if (!intendedUse.trim()) { setFormError("Укажите предполагаемое назначение (ISO 14971 §5.2)"); return; }
    if (!scope.trim()) { setFormError("Укажите область применения"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await riskManagementApi.createPlan({
        title: title.trim(),
        productName: productName.trim(),
        productDescription: productDescription.trim() || undefined,
        intendedUse: intendedUse.trim(),
        intendedPatientPopulation: intendedPatientPopulation.trim() || undefined,
        scope: scope.trim(),
        lifecyclePhase,
        responsiblePersonId: responsiblePersonId || undefined,
        nextReviewDate: nextReviewDate || undefined,
        riskAcceptabilityCriteria: {
          acceptableRiskClasses: ["LOW"],
          conditionallyAcceptableRiskClasses: ["MEDIUM"],
          unacceptableRiskClasses: ["HIGH", "CRITICAL"],
          alaRpThreshold: "Настолько низкий, насколько практически достижимо",
        },
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании плана");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать план менеджмента рисков" size="3xl">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Название плана <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="План менеджмента рисков для..." className={inputCls} autoFocus />
        </div>

        {/* Product name + Lifecycle phase */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Наименование изделия <span className="text-red-400">*</span></label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Название медицинского изделия" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Фаза жизненного цикла</label>
            <select value={lifecyclePhase} onChange={(e) => setLifecyclePhase(e.target.value)} className={inputCls}>
              {LIFECYCLE_PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Product description */}
        <div>
          <label className={labelCls}>Описание изделия</label>
          <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Описание медицинского изделия и его предназначения" rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Intended use */}
        <div>
          <label className={labelCls}>Предполагаемое назначение (ISO 14971 §5.2) <span className="text-red-400">*</span></label>
          <textarea value={intendedUse} onChange={(e) => setIntendedUse(e.target.value)} placeholder="Для чего предназначено изделие, условия применения..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Patient population */}
        <div>
          <label className={labelCls}>Целевая популяция пациентов</label>
          <input value={intendedPatientPopulation} onChange={(e) => setIntendedPatientPopulation(e.target.value)} placeholder="Возраст, состояние здоровья, особые группы..." className={inputCls} />
        </div>

        {/* Scope */}
        <div>
          <label className={labelCls}>Область применения <span className="text-red-400">*</span></label>
          <textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Область применения плана менеджмента рисков..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Responsible + Review date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ответственное лицо</label>
            <select value={responsiblePersonId} onChange={(e) => setResponsiblePersonId(Number(e.target.value))} className={inputCls}>
              <option value={0}>— Не назначен —</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Дата следующего пересмотра</label>
            <input type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Info */}
        <div className="bg-[rgba(160,106,232,0.08)] border border-[rgba(160,106,232,0.2)] rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <FileText size={12} className="inline mr-1 text-[#A06AE8]" />
            Плану будет присвоен номер RMP-ГГГГ-NNN. Статус: «Черновик». Критерии приемлемости рисков установлены по умолчанию (LOW — приемлемый, MEDIUM — условно приемлемый, HIGH/CRITICAL — неприемлемый).
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
          <ActionBtn variant="primary" icon={<FileText size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать план"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePlanModal;

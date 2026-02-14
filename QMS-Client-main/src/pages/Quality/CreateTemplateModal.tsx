/**
 * CreateTemplateModal.tsx — Modal for creating Validation Protocol Templates
 * ISO 13485 §7.5.6 — Validation of processes
 */

import React, { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { validationsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

const PHASES = [
  { value: "IQ", label: "IQ — Квалификация монтажа" },
  { value: "OQ", label: "OQ — Квалификация функционирования" },
  { value: "PQ", label: "PQ — Квалификация эксплуатации" },
];

interface ChecklistItem {
  title: string;
  acceptanceCriteria: string;
  isMandatory: boolean;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("IQ");
  const [items, setItems] = useState<ChecklistItem[]>([
    { title: "", acceptanceCriteria: "", isMandatory: true },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPhase("IQ");
    setItems([{ title: "", acceptanceCriteria: "", isMandatory: true }]);
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const addItem = () => {
    setItems([...items, { title: "", acceptanceCriteria: "", isMandatory: true }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ChecklistItem, value: string | boolean) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите название шаблона"); return; }

    const validItems = items.filter((item) => item.title.trim() && item.acceptanceCriteria.trim());
    if (validItems.length === 0) {
      setFormError("Добавьте хотя бы один пункт чек-листа с критерием приёмки");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await validationsApi.createTemplate({
        title: title.trim(),
        description: description.trim() || undefined,
        phase,
        checklistTemplate: validItems.map((item, idx) => ({
          sortOrder: idx + 1,
          title: item.title.trim(),
          acceptanceCriteria: item.acceptanceCriteria.trim(),
          isMandatory: item.isMandatory,
        })),
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании шаблона");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать шаблон протокола валидации" size="3xl">
      <div className="space-y-4">
        {/* Title + Phase */}
        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div>
            <label className={labelCls}>Название шаблона <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Протокол IQ для..." className={inputCls} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Фаза валидации</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value)} className={inputCls}>
              {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание протокола и область применения..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Checklist Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Пункты чек-листа <span className="text-red-400">*</span></label>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-[12px] text-asvo-accent hover:text-asvo-accent/80 transition-colors"
            >
              <Plus size={13} /> Добавить пункт
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="bg-asvo-surface-2/50 border border-asvo-border/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-asvo-text-dim font-mono mt-2 shrink-0 w-5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                      placeholder="Название проверки"
                      className={inputCls}
                    />
                    <input
                      value={item.acceptanceCriteria}
                      onChange={(e) => updateItem(idx, "acceptanceCriteria", e.target.value)}
                      placeholder="Критерий приёмки (acceptance criteria)"
                      className={inputCls}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isMandatory}
                        onChange={(e) => updateItem(idx, "isMandatory", e.target.checked)}
                        className="accent-[#4A90E8]"
                      />
                      <span className="text-[12px] text-asvo-text-dim">Обязательный пункт</span>
                    </label>
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-asvo-text-dim hover:text-[#F06060] transition-colors mt-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-[rgba(160,106,232,0.08)] border border-[rgba(160,106,232,0.2)] rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <FileText size={12} className="inline mr-1 text-[#A06AE8]" />
            Шаблону будет присвоен номер VPT-NNN. Статус: «Черновик». Чек-лист можно будет применить к конкретной валидации процесса.
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
            {submitting ? "Создание..." : "Создать шаблон"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTemplateModal;

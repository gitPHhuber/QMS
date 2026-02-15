/**
 * CreateReviewModal.tsx — Создание совещания анализа руководства
 * ISO 13485 §5.6 — Management Review
 */

import React, { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { reviewsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  isOpen, onClose, onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [chairpersonId, setChairpersonId] = useState<number>(0);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [agenda, setAgenda] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
    }
  }, [isOpen, users.length]);

  const resetForm = () => {
    setTitle(""); setReviewDate(""); setPeriodFrom(""); setPeriodTo("");
    setChairpersonId(0); setParticipantIds([]); setAgenda("");
    setFormError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const toggleParticipant = (userId: number) => {
    setParticipantIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError("Укажите тему совещания"); return; }
    if (!reviewDate) { setFormError("Укажите дату совещания"); return; }
    if (!periodFrom || !periodTo) { setFormError("Укажите анализируемый период"); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      const participants = participantIds.map(id => {
        const u = users.find((usr: any) => usr.id === id);
        return { userId: id, name: u ? `${u.surname} ${u.name}` : `ID ${id}`, role: "" };
      });

      await reviewsApi.create({
        title: title.trim(),
        reviewDate,
        periodFrom,
        periodTo,
        chairpersonId: chairpersonId || undefined,
        participants: participants.length > 0 ? participants : undefined,
        inputData: agenda.trim() ? { agenda: agenda.trim() } : undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || "Ошибка при создании совещания");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новое совещание анализа руководства" size="xl">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Тема совещания <span className="text-red-400">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Анализ СМК за 1-е полугодие 2026" className={inputCls} autoFocus />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Дата совещания <span className="text-red-400">*</span></label>
            <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Период с <span className="text-red-400">*</span></label>
            <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Период по <span className="text-red-400">*</span></label>
            <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Председатель</label>
          <select value={chairpersonId} onChange={(e) => setChairpersonId(Number(e.target.value))} className={inputCls}>
            <option value={0}>— Не указан —</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Участники</label>
          <div className="flex flex-wrap gap-2 p-2 bg-asvo-surface-2 border border-asvo-border rounded-lg min-h-[40px]">
            {users.map((u: any) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleParticipant(u.id)}
                className={`px-2 py-1 rounded text-[12px] transition-colors ${
                  participantIds.includes(u.id)
                    ? "bg-asvo-accent/20 text-asvo-accent border border-asvo-accent/40"
                    : "bg-asvo-surface border border-asvo-border text-asvo-text-dim hover:text-asvo-text"
                }`}
              >
                {u.surname} {u.name}
              </button>
            ))}
            {users.length === 0 && <span className="text-[12px] text-asvo-text-dim">Загрузка...</span>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Повестка</label>
          <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Вопросы для рассмотрения на совещании..." />
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-[12px]">{formError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>Отмена</ActionBtn>
          <ActionBtn variant="primary" icon={<BarChart3 size={14} />} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Создание..." : "Создать совещание"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateReviewModal;

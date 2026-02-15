import React, { useState, useEffect } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { Modal } from "../../components/Modal/Modal";
import ActionBtn from "../../components/qms/ActionBtn";
import { validationsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";

/* ------------------------------------------------------------------ */
/*  Style constants                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface CreateValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const CreateValidationModal: React.FC<CreateValidationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  /* ---- form state ---- */

  const [processName, setProcessName] = useState("");
  const [processOwner, setProcessOwner] = useState("");
  const [description, setDescription] = useState("");
  const [revalidationIntervalMonths, setRevalidationIntervalMonths] = useState(12);
  const [responsibleId, setResponsibleId] = useState<number | "">("");

  /* ---- users list ---- */

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* ---- submit state ---- */

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- fetch users when modal opens ---- */

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await getUsers();
        setUsers(Array.isArray(data) ? data : data?.rows ?? []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  /* ---- reset form when modal closes ---- */

  useEffect(() => {
    if (!isOpen) {
      setProcessName("");
      setProcessOwner("");
      setDescription("");
      setRevalidationIntervalMonths(12);
      setResponsibleId("");
      setError(null);
    }
  }, [isOpen]);

  /* ---- submit handler ---- */

  const handleSubmit = async () => {
    if (!processName.trim()) {
      setError("Название процесса обязательно");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await validationsApi.create({
        processName: processName.trim(),
        processOwner: processOwner.trim(),
        description: description.trim(),
        revalidationIntervalMonths,
        responsibleId: responsibleId || undefined,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Ошибка при создании валидации"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- render ---- */

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новая валидация процесса" size="lg">
      <div className="space-y-4">
        {/* Icon header */}
        <div className="flex items-center gap-2 pb-2 border-b border-asvo-border">
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(160,106,232,0.12)" }}
          >
            <FlaskConical size={18} style={{ color: "#A06AE8" }} />
          </div>
          <span className="text-sm text-asvo-text-mid">
            ISO 13485 &sect;7.5.6 &mdash; Валидация специальных процессов
          </span>
        </div>

        {/* Process name */}
        <div>
          <label className={labelCls}>
            Название процесса <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            placeholder="Введите название процесса"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
          />
        </div>

        {/* Process owner */}
        <div>
          <label className={labelCls}>Владелец процесса</label>
          <input
            className={inputCls}
            placeholder="Имя владельца процесса"
            value={processOwner}
            onChange={(e) => setProcessOwner(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            placeholder="Описание процесса валидации"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Revalidation interval */}
        <div>
          <label className={labelCls}>Интервал ревалидации (мес.)</label>
          <input
            type="number"
            className={inputCls}
            value={revalidationIntervalMonths}
            min={1}
            onChange={(e) =>
              setRevalidationIntervalMonths(parseInt(e.target.value, 10) || 12)
            }
          />
        </div>

        {/* Responsible user */}
        <div>
          <label className={labelCls}>Ответственный</label>
          {loadingUsers ? (
            <div className="flex items-center gap-2 text-xs text-asvo-text-dim py-2">
              <Loader2 size={14} className="animate-spin" />
              Загрузка пользователей...
            </div>
          ) : (
            <select
              className={inputCls}
              value={responsibleId}
              onChange={(e) =>
                setResponsibleId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">-- Не выбран --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.surname}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={onClose}>
            Отмена
          </ActionBtn>
          <ActionBtn
            variant="primary"
            icon={
              submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FlaskConical size={15} />
              )
            }
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Создание..." : "Создать валидацию"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateValidationModal;

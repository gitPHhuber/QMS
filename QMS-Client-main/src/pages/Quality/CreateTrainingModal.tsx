import React, { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Modal } from "../../components/Modal/Modal";
import ActionBtn from "../../components/qms/ActionBtn";
import { trainingApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";

/* ------------------------------------------------------------------ */
/*  Style constants                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ------------------------------------------------------------------ */
/*  Training types                                                      */
/* ------------------------------------------------------------------ */

const TRAINING_TYPES = [
  { value: "GMP", label: "GMP" },
  { value: "ISO_13485", label: "ISO 13485" },
  { value: "IPC_A_610", label: "IPC-A-610" },
  { value: "ESD", label: "ESD" },
  { value: "SOLDERING", label: "Пайка" },
  { value: "EQUIPMENT", label: "Оборудование" },
  { value: "SAFETY", label: "Безопасность" },
  { value: "OTHER", label: "Другое" },
];

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface CreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                                */
/* ------------------------------------------------------------------ */

type Tab = "plan" | "record";

/* ================================================================== */
/*  Component                                                           */
/* ================================================================== */

const CreateTrainingModal: React.FC<CreateTrainingModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [tab, setTab] = useState<Tab>("plan");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Users list ---- */
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : data?.rows ?? []))
      .catch(() => setUsers([]));
  }, [isOpen]);

  /* ---- Plan form state ---- */
  const [planYear, setPlanYear] = useState(new Date().getFullYear());
  const [planTitle, setPlanTitle] = useState("");

  /* ---- Record form state ---- */
  const [traineeId, setTraineeId] = useState<number | "">("");
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0].value);
  const [recTitle, setRecTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [trainer, setTrainer] = useState("");

  /* ---- Reset on open ---- */
  useEffect(() => {
    if (isOpen) {
      setPlanYear(new Date().getFullYear());
      setPlanTitle("");
      setTraineeId("");
      setTrainingType(TRAINING_TYPES[0].value);
      setRecTitle("");
      setDescription("");
      setStartDate("");
      setTrainer("");
      setError(null);
    }
  }, [isOpen]);

  /* ---- Submit ---- */

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      if (tab === "plan") {
        if (!planTitle.trim()) {
          setError("Укажите название плана");
          setSaving(false);
          return;
        }
        await trainingApi.createPlan({ year: planYear, title: planTitle.trim() });
      } else {
        if (!recTitle.trim()) {
          setError("Укажите название обучения");
          setSaving(false);
          return;
        }
        await trainingApi.createRecord({
          traineeId: traineeId || undefined,
          trainingType,
          title: recTitle.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          trainer: trainer.trim() || undefined,
        });
      }
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Tab button helper ---- */

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-asvo-accent text-asvo-bg"
        : "text-asvo-text-mid hover:text-asvo-text hover:bg-asvo-surface-2"
    }`;

  /* ---- Render ---- */

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-asvo-accent-dim rounded-xl">
          <GraduationCap size={20} className="text-asvo-accent" />
        </div>
        <h2 className="text-lg font-bold text-asvo-text">Назначить обучение</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button className={tabCls("plan")} onClick={() => setTab("plan")}>
          План обучения
        </button>
        <button className={tabCls("record")} onClick={() => setTab("record")}>
          Запись обучения
        </button>
      </div>

      {/* ---- Plan tab ---- */}
      {tab === "plan" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Год</label>
            <input
              type="number"
              className={inputCls}
              value={planYear}
              onChange={(e) => setPlanYear(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Название плана *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Введите название плана обучения"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ---- Record tab ---- */}
      {tab === "record" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Сотрудник</label>
            <select
              className={inputCls}
              value={traineeId}
              onChange={(e) =>
                setTraineeId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">— Выберите сотрудника —</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.surname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Тип обучения</label>
            <select
              className={inputCls}
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
            >
              {TRAINING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Название обучения *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Введите название"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Описание</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              placeholder="Описание обучения"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Дата начала</label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Преподаватель</label>
              <input
                type="text"
                className={inputCls}
                placeholder="ФИО преподавателя"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-[13px] text-[#F06060]">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <ActionBtn variant="secondary" onClick={onClose}>
          Отмена
        </ActionBtn>
        <ActionBtn variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Сохранение..." : "Создать"}
        </ActionBtn>
      </div>
    </Modal>
  );
};

export default CreateTrainingModal;

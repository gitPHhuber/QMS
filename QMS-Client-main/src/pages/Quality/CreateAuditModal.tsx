/**
 * CreateAuditModal.tsx — Создание плана или аудита (schedule)
 * ISO 13485 §8.2.4 — Программа внутренних аудитов
 */

import React, { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { internalAuditsApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Props ── */

interface CreateAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateAuditModal: React.FC<CreateAuditModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [mode, setMode] = useState<"plan" | "schedule">("plan");

  /* Plan fields */
  const [year, setYear] = useState(new Date().getFullYear());
  const [planTitle, setPlanTitle] = useState("");

  /* Schedule fields */
  const [auditPlanId, setAuditPlanId] = useState<number>(0);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scope, setScope] = useState("");
  const [isoClause, setIsoClause] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [leadAuditorId, setLeadAuditorId] = useState<number>(0);
  const [auditeeId, setAuditeeId] = useState<number>(0);

  /* Lookups */
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  /* UI state */
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ── Fetch lookups ── */
  useEffect(() => {
    if (!isOpen) return;
    if (users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
    internalAuditsApi
      .getPlans()
      .then((res) => setPlans(res.rows ?? []))
      .catch(() => {});
  }, [isOpen, users.length]);

  /* ── Reset ── */
  const resetForm = () => {
    setMode("plan");
    setYear(new Date().getFullYear());
    setPlanTitle("");
    setAuditPlanId(0);
    setScheduleTitle("");
    setScope("");
    setIsoClause("");
    setPlannedDate("");
    setLeadAuditorId(0);
    setAuditeeId(0);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setFormError(null);

    if (mode === "plan") {
      if (!planTitle.trim()) {
        setFormError("Укажите название плана");
        return;
      }
      setSubmitting(true);
      try {
        await internalAuditsApi.createPlan({
          year,
          title: planTitle.trim(),
        });
        resetForm();
        onCreated();
        onClose();
      } catch (e: any) {
        setFormError(
          e.response?.data?.message || e.message || "Ошибка при создании плана"
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    /* mode === "schedule" */
    if (!scheduleTitle.trim()) {
      setFormError("Укажите название аудита");
      return;
    }
    setSubmitting(true);
    try {
      await internalAuditsApi.createSchedule({
        auditPlanId: auditPlanId || undefined,
        title: scheduleTitle.trim(),
        scope: scope.trim() || undefined,
        isoClause: isoClause.trim() || undefined,
        plannedDate: plannedDate || undefined,
        leadAuditorId: leadAuditorId || undefined,
        auditeeId: auditeeId || undefined,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(
        e.response?.data?.message || e.message || "Ошибка при создании аудита"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Tabs ── */
  const modes: { key: "plan" | "schedule"; label: string }[] = [
    { key: "plan", label: "План" },
    { key: "schedule", label: "Аудит" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новый аудит" size="xl">
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-1 border-b border-asvo-border">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setFormError(null);
              }}
              className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                mode === m.key
                  ? "text-asvo-accent border-asvo-accent"
                  : "text-asvo-text-dim border-transparent hover:text-asvo-text"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ---- Plan mode ---- */}
        {mode === "plan" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Год <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputCls}
                  min={2020}
                  max={2099}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Название плана <span className="text-red-400">*</span>
                </label>
                <input
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Годовой план аудитов 2026"
                  className={inputCls}
                  autoFocus
                />
              </div>
            </div>
          </>
        )}

        {/* ---- Schedule mode ---- */}
        {mode === "schedule" && (
          <>
            {/* Plan select + Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>План аудитов</label>
                <select
                  value={auditPlanId}
                  onChange={(e) => setAuditPlanId(Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={0}>-- Без привязки --</option>
                  {plans.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title || `План ${p.year}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  Название <span className="text-red-400">*</span>
                </label>
                <input
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="Аудит процесса закупок"
                  className={inputCls}
                  autoFocus
                />
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className={labelCls}>Область аудита</label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Описание области и границ аудита..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* ISO Clause + Planned date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Пункт ISO</label>
                <input
                  value={isoClause}
                  onChange={(e) => setIsoClause(e.target.value)}
                  placeholder="7.4"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Плановая дата</label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Lead auditor + Auditee */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Ведущий аудитор</label>
                <select
                  value={leadAuditorId}
                  onChange={(e) => setLeadAuditorId(Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={0}>-- Не назначен --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.surname} {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Аудитируемый</label>
                <select
                  value={auditeeId}
                  onChange={(e) => setAuditeeId(Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={0}>-- Не назначен --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.surname} {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <ClipboardList
              size={12}
              className="inline mr-1 text-asvo-accent"
            />
            {mode === "plan"
              ? "Годовой план аудитов будет создан с указанным годом. Далее к нему можно привязывать расписания аудитов."
              : "Аудит будет создан со статусом «Запланирован». Номер присваивается автоматически."}
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
          <ActionBtn
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Отмена
          </ActionBtn>
          <ActionBtn
            variant="primary"
            icon={<ClipboardList size={14} />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "Создание..."
              : mode === "plan"
                ? "Создать план"
                : "Создать аудит"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateAuditModal;

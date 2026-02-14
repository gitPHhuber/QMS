import React, { useState, useEffect, useCallback } from "react";
import { GraduationCap, Save } from "lucide-react";
import { Modal } from "../../components/Modal/Modal";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import { trainingApi } from "../../api/qmsApi";

/* ------------------------------------------------------------------ */
/*  Style constants                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ------------------------------------------------------------------ */
/*  Examination result options                                          */
/* ------------------------------------------------------------------ */

const EXAM_RESULTS = [
  { value: "PENDING", label: "Ожидание" },
  { value: "PASSED", label: "Сдан" },
  { value: "FAILED", label: "Не сдан" },
];

/* ------------------------------------------------------------------ */
/*  Status badge config                                                 */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  passed:      { label: "Пройдено",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  in_progress: { label: "В процессе",  color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  assigned:    { label: "Назначено",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  overdue:     { label: "Просрочено",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  completed:   { label: "Завершено",   color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
};

/* ------------------------------------------------------------------ */
/*  Training type labels                                                */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  GMP: "GMP",
  ISO_13485: "ISO 13485",
  IPC_A_610: "IPC-A-610",
  ESD: "ESD",
  SOLDERING: "Пайка",
  EQUIPMENT: "Оборудование",
  SAFETY: "Безопасность",
  OTHER: "Другое",
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface TrainingDetailModalProps {
  recordId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                                */
/* ------------------------------------------------------------------ */

type Tab = "main" | "result";

/* ================================================================== */
/*  Component                                                           */
/* ================================================================== */

const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  recordId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [tab, setTab] = useState<Tab>("main");
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Result form state ---- */
  const [completionDate, setCompletionDate] = useState("");
  const [examinationResult, setExaminationResult] = useState("PENDING");
  const [examinationDate, setExaminationDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateExpiry, setCertificateExpiry] = useState("");

  /* ---- Fetch record ---- */

  const fetchRecord = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trainingApi.getRecords({ id: recordId });
      const rec = res?.rows?.[0] ?? res;
      setRecord(rec);
      // Populate result fields
      setCompletionDate(rec.completionDate?.slice(0, 10) ?? "");
      setExaminationResult(rec.examinationResult ?? "PENDING");
      setExaminationDate(rec.examinationDate?.slice(0, 10) ?? "");
      setCertificateNumber(rec.certificateNumber ?? "");
      setCertificateExpiry(rec.certificateExpiry?.slice(0, 10) ?? "");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка загрузки записи");
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    if (isOpen && recordId) {
      setTab("main");
      fetchRecord();
    }
  }, [isOpen, recordId, fetchRecord]);

  /* ---- Save result ---- */

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await trainingApi.updateRecord(recordId, {
        completionDate: completionDate || undefined,
        examinationResult,
        examinationDate: examinationDate || undefined,
        certificateNumber: certificateNumber.trim() || undefined,
        certificateExpiry: certificateExpiry || undefined,
      });
      onAction?.();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Info row helper ---- */

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2 border-b border-asvo-border/30 last:border-0">
      <span className="text-[13px] text-asvo-text-dim w-36 shrink-0">{label}</span>
      <span className="text-[13px] text-asvo-text">{value || "---"}</span>
    </div>
  );

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
        <h2 className="text-lg font-bold text-asvo-text">
          {record?.title ?? "Запись обучения"}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button className={tabCls("main")} onClick={() => setTab("main")}>
          Основное
        </button>
        <button className={tabCls("result")} onClick={() => setTab("result")}>
          Результат
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="w-6 h-6 border-4 border-t-4 border-asvo-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ---- Tab: Main ---- */}
      {!loading && record && tab === "main" && (
        <div className="space-y-0">
          <InfoRow
            label="Сотрудник"
            value={
              record.trainee
                ? `${record.trainee.name ?? ""} ${record.trainee.surname ?? ""}`.trim()
                : record.traineeId ?? "---"
            }
          />
          <InfoRow
            label="Тип обучения"
            value={TYPE_LABELS[record.trainingType] ?? record.trainingType}
          />
          <InfoRow label="Название" value={record.title} />
          <InfoRow label="Описание" value={record.description} />
          <InfoRow label="Дата начала" value={record.startDate?.slice(0, 10)} />
          <InfoRow label="Преподаватель" value={record.trainer} />
          <InfoRow
            label="Статус"
            value={
              (() => {
                const s = STATUS_BADGE[record.status] ?? STATUS_BADGE.assigned;
                return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
              })()
            }
          />
        </div>
      )}

      {/* ---- Tab: Result ---- */}
      {!loading && record && tab === "result" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Дата завершения</label>
            <input
              type="date"
              className={inputCls}
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Результат экзамена</label>
            <select
              className={inputCls}
              value={examinationResult}
              onChange={(e) => setExaminationResult(e.target.value)}
            >
              {EXAM_RESULTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Дата экзамена</label>
            <input
              type="date"
              className={inputCls}
              value={examinationDate}
              onChange={(e) => setExaminationDate(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Номер сертификата</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Введите номер сертификата"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Срок действия сертификата</label>
            <input
              type="date"
              className={inputCls}
              value={certificateExpiry}
              onChange={(e) => setCertificateExpiry(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-[#F06060]">{error}</p>
          )}

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2">
            <ActionBtn variant="secondary" onClick={onClose}>
              Отмена
            </ActionBtn>
            <ActionBtn
              variant="primary"
              icon={<Save size={15} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </ActionBtn>
          </div>
        </div>
      )}

      {/* Error (for main tab / loading errors) */}
      {error && tab === "main" && (
        <p className="mt-3 text-[13px] text-[#F06060]">{error}</p>
      )}
    </Modal>
  );
};

export default TrainingDetailModal;

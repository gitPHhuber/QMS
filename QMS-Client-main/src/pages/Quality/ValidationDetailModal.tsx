import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  Loader2,
  AlertTriangle,
  Save,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Modal } from "../../components/Modal/Modal";
import ActionBtn from "../../components/qms/ActionBtn";
import { validationsApi } from "../../api/qmsApi";

/* ------------------------------------------------------------------ */
/*  Style constants                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type QualPhase = "PASSED" | "NOT_STARTED" | "IN_PROGRESS" | "FAILED" | "N_A";

type ValidationStatus =
  | "PLANNED"
  | "IQ_PHASE"
  | "OQ_PHASE"
  | "PQ_PHASE"
  | "VALIDATED"
  | "REVALIDATION_DUE"
  | "EXPIRED"
  | "FAILED";

type TabKey = "general" | "iq" | "oq" | "pq";

interface ValidationDetail {
  id: number;
  processName: string;
  process?: string;
  processOwner?: string;
  owner?: string;
  description?: string;
  status: ValidationStatus;
  iqStatus: QualPhase;
  iqDate: string | null;
  oqStatus: QualPhase;
  oqDate: string | null;
  pqStatus: QualPhase;
  pqDate: string | null;
  validationDate?: string;
  revalidationDate?: string;
  revalidationIntervalMonths?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const PHASE_OPTIONS: { value: QualPhase; label: string }[] = [
  { value: "NOT_STARTED", label: "Не начат" },
  { value: "IN_PROGRESS", label: "В процессе" },
  { value: "PASSED", label: "Пройден" },
  { value: "FAILED", label: "Не пройден" },
  { value: "N_A", label: "Не применимо" },
];

const STATUS_LABELS: Record<ValidationStatus, string> = {
  PLANNED: "Запланирован",
  IQ_PHASE: "IQ фаза",
  OQ_PHASE: "OQ фаза",
  PQ_PHASE: "PQ фаза",
  VALIDATED: "Валидирован",
  REVALIDATION_DUE: "Треб. ревалидация",
  EXPIRED: "Истёк",
  FAILED: "Не пройден",
};

const STATUS_COLORS: Record<ValidationStatus, string> = {
  PLANNED: "#64748B",
  IQ_PHASE: "#4A90E8",
  OQ_PHASE: "#4A90E8",
  PQ_PHASE: "#E8A830",
  VALIDATED: "#2DD4A8",
  REVALIDATION_DUE: "#E87040",
  EXPIRED: "#F06060",
  FAILED: "#F06060",
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface ValidationDetailModalProps {
  validationId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const ValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
  validationId,
  isOpen,
  onClose,
  onAction,
}) => {
  /* ---- data state ---- */

  const [detail, setDetail] = useState<ValidationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- tab state ---- */

  const [activeTab, setActiveTab] = useState<TabKey>("general");

  /* ---- phase edit state ---- */

  const [iqStatus, setIqStatus] = useState<QualPhase>("NOT_STARTED");
  const [iqDate, setIqDate] = useState("");
  const [oqStatus, setOqStatus] = useState<QualPhase>("NOT_STARTED");
  const [oqDate, setOqDate] = useState("");
  const [pqStatus, setPqStatus] = useState<QualPhase>("NOT_STARTED");
  const [pqDate, setPqDate] = useState("");

  /* ---- save state ---- */

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ---- fetch detail ---- */

  const fetchDetail = useCallback(async () => {
    if (!validationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await validationsApi.getOne(validationId);
      setDetail(data);
      setIqStatus(data.iqStatus ?? "NOT_STARTED");
      setIqDate(data.iqDate ? data.iqDate.substring(0, 10) : "");
      setOqStatus(data.oqStatus ?? "NOT_STARTED");
      setOqDate(data.oqDate ? data.oqDate.substring(0, 10) : "");
      setPqStatus(data.pqStatus ?? "NOT_STARTED");
      setPqDate(data.pqDate ? data.pqDate.substring(0, 10) : "");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [validationId]);

  useEffect(() => {
    if (isOpen && validationId) {
      setActiveTab("general");
      setSaveError(null);
      setSaveSuccess(false);
      fetchDetail();
    }
  }, [isOpen, validationId, fetchDetail]);

  /* ---- save phase handler ---- */

  const handleSavePhase = async (
    phase: "iq" | "oq" | "pq"
  ) => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: Record<string, any> = {};
    if (phase === "iq") {
      payload.iqStatus = iqStatus;
      payload.iqDate = iqDate || null;
    } else if (phase === "oq") {
      payload.oqStatus = oqStatus;
      payload.oqDate = oqDate || null;
    } else {
      payload.pqStatus = pqStatus;
      payload.pqDate = pqDate || null;
    }

    try {
      await validationsApi.update(validationId, payload);
      setSaveSuccess(true);
      onAction();
      await fetchDetail();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.message || err?.message || "Ошибка сохранения"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---- tab config ---- */

  const tabs: { key: TabKey; label: string }[] = [
    { key: "general", label: "Основное" },
    { key: "iq", label: "IQ" },
    { key: "oq", label: "OQ" },
    { key: "pq", label: "PQ" },
  ];

  /* ---- info row helper ---- */

  const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({
    label,
    value,
  }) => (
    <div className="flex items-start gap-3 py-2 border-b border-asvo-border/50 last:border-b-0">
      <span className="text-[13px] text-asvo-text-dim min-w-[160px] shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-asvo-text">{value || "---"}</span>
    </div>
  );

  /* ---- phase editor helper ---- */

  const PhaseEditor: React.FC<{
    phaseLabel: string;
    phaseKey: "iq" | "oq" | "pq";
    status: QualPhase;
    setStatus: (v: QualPhase) => void;
    date: string;
    setDate: (v: string) => void;
  }> = ({ phaseLabel, phaseKey, status, setStatus, date, setDate }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-asvo-border">
        <FlaskConical size={16} style={{ color: "#4A90E8" }} />
        <span className="text-sm font-medium text-asvo-text">{phaseLabel}</span>
      </div>

      <div>
        <label className={labelCls}>Статус</label>
        <select
          className={inputCls}
          value={status}
          onChange={(e) => setStatus(e.target.value as QualPhase)}
        >
          {PHASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Дата</label>
        <input
          type="date"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Save error / success */}
      {saveError && (
        <div className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="text-[13px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={14} />
          Сохранено
        </div>
      )}

      <div className="flex justify-end pt-2">
        <ActionBtn
          variant="primary"
          icon={
            saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )
          }
          onClick={() => handleSavePhase(phaseKey)}
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </ActionBtn>
      </div>
    </div>
  );

  /* ---- render ---- */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        detail
          ? `Валидация: ${detail.processName || detail.process || `#${detail.id}`}`
          : "Валидация процесса"
      }
      size="2xl"
    >
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-asvo-accent" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle size={28} style={{ color: "#F06060" }} />
          <span className="text-sm text-asvo-text">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchDetail}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* Content */}
      {detail && !loading && !error && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSaveError(null);
                  setSaveSuccess(false);
                }}
                className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "text-asvo-accent border-asvo-accent"
                    : "text-asvo-text-dim border-transparent hover:text-asvo-text-mid"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: General */}
          {activeTab === "general" && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 pb-3 border-b border-asvo-border mb-2">
                <Info size={16} style={{ color: "#4A90E8" }} />
                <span className="text-sm font-medium text-asvo-text">
                  Основная информация
                </span>
              </div>

              <InfoRow
                label="Процесс"
                value={detail.processName || detail.process}
              />
              <InfoRow
                label="Владелец"
                value={detail.processOwner || detail.owner}
              />
              <InfoRow label="Описание" value={detail.description} />
              <InfoRow
                label="Статус"
                value={STATUS_LABELS[detail.status] || detail.status}
              />
              <div className="flex items-start gap-3 py-2 border-b border-asvo-border/50">
                <span className="text-[13px] text-asvo-text-dim min-w-[160px] shrink-0">
                  Статус
                </span>
                <span
                  className="text-[13px] font-medium px-2 py-0.5 rounded"
                  style={{
                    color: STATUS_COLORS[detail.status] || "#64748B",
                    background: `${STATUS_COLORS[detail.status] || "#64748B"}1F`,
                  }}
                >
                  {STATUS_LABELS[detail.status] || detail.status}
                </span>
              </div>
              <InfoRow
                label="Дата валидации"
                value={
                  detail.validationDate
                    ? detail.validationDate.substring(0, 10)
                    : undefined
                }
              />
              <InfoRow
                label="Дата ревалидации"
                value={
                  detail.revalidationDate
                    ? detail.revalidationDate.substring(0, 10)
                    : undefined
                }
              />
              <InfoRow
                label="Интервал ревалидации"
                value={
                  detail.revalidationIntervalMonths
                    ? `${detail.revalidationIntervalMonths} мес.`
                    : undefined
                }
              />
              <InfoRow
                label="Создано"
                value={
                  detail.createdAt
                    ? detail.createdAt.substring(0, 10)
                    : undefined
                }
              />
              <InfoRow
                label="Обновлено"
                value={
                  detail.updatedAt
                    ? detail.updatedAt.substring(0, 10)
                    : undefined
                }
              />
            </div>
          )}

          {/* Tab: IQ */}
          {activeTab === "iq" && (
            <PhaseEditor
              phaseLabel="Installation Qualification (IQ)"
              phaseKey="iq"
              status={iqStatus}
              setStatus={setIqStatus}
              date={iqDate}
              setDate={setIqDate}
            />
          )}

          {/* Tab: OQ */}
          {activeTab === "oq" && (
            <PhaseEditor
              phaseLabel="Operational Qualification (OQ)"
              phaseKey="oq"
              status={oqStatus}
              setStatus={setOqStatus}
              date={oqDate}
              setDate={setOqDate}
            />
          )}

          {/* Tab: PQ */}
          {activeTab === "pq" && (
            <PhaseEditor
              phaseLabel="Performance Qualification (PQ)"
              phaseKey="pq"
              status={pqStatus}
              setStatus={setPqStatus}
              date={pqDate}
              setDate={setPqDate}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ValidationDetailModal;

/**
 * CreateDhrModal.tsx — Create a new Device History Record
 * ISO 13485 §7.5.9 — Traceability
 */

import React, { useState, useEffect } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal/Modal";
import ActionBtn from "../../components/qms/ActionBtn";
import { dhrApi } from "../../api/qmsApi";

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Props ── */

interface CreateDhrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateDhrModal: React.FC<CreateDhrModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  /* ---- form state ---- */

  const [product, setProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [batchSize, setBatchSize] = useState<number | "">(1);
  const [dmrVersion, setDmrVersion] = useState("");
  const [notes, setNotes] = useState("");

  /* ---- submit state ---- */

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- reset form when modal closes ---- */

  useEffect(() => {
    if (!isOpen) {
      setProduct("");
      setSerialNumber("");
      setLotNumber("");
      setBatchSize(1);
      setDmrVersion("");
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  /* ---- submit handler ---- */

  const handleSubmit = async () => {
    if (!product.trim()) {
      setError("Изделие обязательно для заполнения");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await dhrApi.create({
        productName: product.trim(),
        serialNumber: serialNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        batchSize: batchSize || 1,
        dmrVersion: dmrVersion.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("DHR создан успешно");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Ошибка при создании DHR"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- render ---- */

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новая запись DHR" size="lg">
      <div className="space-y-4">
        {/* Icon header */}
        <div className="flex items-center gap-2 pb-2 border-b border-asvo-border">
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(74,144,232,0.12)" }}
          >
            <ClipboardList size={18} style={{ color: "#4A90E8" }} />
          </div>
          <span className="text-sm text-asvo-text-mid">
            ISO 13485 &sect;7.5.9 &mdash; Прослеживаемость
          </span>
        </div>

        {/* Product */}
        <div>
          <label className={labelCls}>
            Изделие <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            placeholder="Название изделия"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>

        {/* Serial Number */}
        <div>
          <label className={labelCls}>Серийный номер</label>
          <input
            className={inputCls}
            placeholder="S/N"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>

        {/* Lot Number */}
        <div>
          <label className={labelCls}>Номер партии</label>
          <input
            className={inputCls}
            placeholder="Lot #"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
          />
        </div>

        {/* Batch Size */}
        <div>
          <label className={labelCls}>Размер партии</label>
          <input
            type="number"
            className={inputCls}
            value={batchSize}
            min={1}
            onChange={(e) =>
              setBatchSize(e.target.value ? parseInt(e.target.value, 10) : "")
            }
          />
        </div>

        {/* DMR Version */}
        <div>
          <label className={labelCls}>Версия DMR</label>
          <input
            className={inputCls}
            placeholder="v1.0"
            value={dmrVersion}
            onChange={(e) => setDmrVersion(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Примечания</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            placeholder="Дополнительные комментарии"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
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
                <ClipboardList size={15} />
              )
            }
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Создание..." : "Создать DHR"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateDhrModal;

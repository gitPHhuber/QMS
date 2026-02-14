/**
 * ProductDetailModal.tsx — Detail modal for a product
 * ISO 13485 §7.5.3 — Identification and Traceability
 */

import React, { useState, useEffect, useCallback } from "react";
import { Package, Save } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { productsApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";

/* ── Constants ── */

const RISK_CLASSES = [
  { value: "CLASS_I",   label: "Класс I" },
  { value: "CLASS_IIA", label: "Класс IIa" },
  { value: "CLASS_IIB", label: "Класс IIb" },
  { value: "CLASS_III", label: "Класс III" },
];

const PRODUCTION_STATUSES = [
  { value: "DEVELOPMENT",   label: "Разработка" },
  { value: "PROTOTYPE",     label: "Прототип" },
  { value: "PILOT",         label: "Опытная серия" },
  { value: "SERIAL",        label: "Серийное производство" },
  { value: "DISCONTINUED",  label: "Снято с производства" },
];

const riskClassBadge: Record<string, { color: string; bg: string; label: string }> = {
  CLASS_I:   { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)",  label: "Класс I" },
  CLASS_IIA: { color: "#4A90E8", bg: "rgba(74,144,232,0.14)",  label: "Класс IIa" },
  CLASS_IIB: { color: "#E8A830", bg: "rgba(232,168,48,0.14)",  label: "Класс IIb" },
  CLASS_III: { color: "#F06060", bg: "rgba(240,96,96,0.14)",   label: "Класс III" },
};

/* ── Style constants ── */

const inputCls =
  "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

/* ── Props ── */

interface ProductDetailModalProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
}

/* ── Component ── */

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  isOpen,
  onClose,
  onAction,
}) => {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  /* ── edit state ── */
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editRiskClass, setEditRiskClass] = useState("CLASS_I");
  const [editProductionStatus, setEditProductionStatus] = useState("DEVELOPMENT");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── helpers ── */

  const populateForm = useCallback((p: any) => {
    setEditName(p.name || "");
    setEditDescription(p.description || "");
    setEditCategory(p.category || "");
    setEditRiskClass(p.riskClass || "CLASS_I");
    setEditProductionStatus(p.productionStatus || "DEVELOPMENT");
  }, []);

  /* ── fetch detail ── */

  const fetchDetail = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await productsApi.getOne(productId);
      setProduct(data);
      populateForm(data);
    } catch (err) {
      console.error("ProductDetailModal fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, populateForm]);

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, fetchDetail]);

  /* ── save ── */

  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError("Наименование обязательно");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await productsApi.update(productId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory.trim() || undefined,
        riskClass: editRiskClass,
        productionStatus: editProductionStatus,
      });
      setSaveSuccess(true);
      onAction?.();
      await fetchDetail();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) {
      setSaveError(
        e.response?.data?.message || e.message || "Ошибка сохранения"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── badge helpers ── */

  const rcBadge = riskClassBadge[product?.riskClass] || riskClassBadge.CLASS_I;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product?.name || "Изделие"}
      size="3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-asvo-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header info */}
          {product && (
            <div className="flex items-center gap-2 mb-2">
              {product.productCode && (
                <span className="font-mono text-asvo-accent text-[14px] font-bold">
                  {product.productCode}
                </span>
              )}
              <Badge color={rcBadge.color} bg={rcBadge.bg}>
                {rcBadge.label}
              </Badge>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelCls}>
              Наименование <span className="text-red-400">*</span>
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Описание</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Описание изделия..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Категория</label>
            <input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Категория изделия"
              className={inputCls}
            />
          </div>

          {/* Risk Class + Production Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Класс риска</label>
              <select
                value={editRiskClass}
                onChange={(e) => setEditRiskClass(e.target.value)}
                className={inputCls}
              >
                {RISK_CLASSES.map((rc) => (
                  <option key={rc.value} value={rc.value}>
                    {rc.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Статус производства</label>
              <select
                value={editProductionStatus}
                onChange={(e) => setEditProductionStatus(e.target.value)}
                className={inputCls}
              >
                {PRODUCTION_STATUSES.map((ps) => (
                  <option key={ps.value} value={ps.value}>
                    {ps.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save error / success */}
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <span className="text-green-400 text-[12px]">Сохранено успешно</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
            <ActionBtn variant="secondary" onClick={onClose}>
              Закрыть
            </ActionBtn>
            <ActionBtn
              variant="primary"
              icon={<Save size={14} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </ActionBtn>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProductDetailModal;

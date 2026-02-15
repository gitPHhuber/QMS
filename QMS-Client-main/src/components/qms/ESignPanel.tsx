/**
 * ESignPanel.tsx -- Reusable E-Signature panel component
 * 21 CFR Part 11 compliant electronic signatures
 *
 * Embeddable in any entity page to show existing signatures and allow signing.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  PenTool, CheckCircle2, AlertTriangle, ShieldCheck,
  Clock, XCircle, Loader2, Lock,
} from "lucide-react";

import { esignApi } from "../../api/qms/esign";
import Badge from "./Badge";

/* --- Props --- */

interface ESignPanelProps {
  entity: string;
  entityId: number;
  action: string;
  onSigned?: () => void;
}

/* --- Types --- */

interface Signature {
  id: number;
  signerName: string;
  signerRole?: string;
  meaning: string;
  reason?: string;
  signedAt: string;
  isValid: boolean;
  verifiedAt?: string;
  signer?: {
    name: string;
    surname: string;
    role?: string;
  };
}

/* --- Helpers --- */

const fmtDateTime = (iso: string | null): string => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* --- Component --- */

const ESignPanel: React.FC<ESignPanelProps> = ({
  entity, entityId, action, onSigned,
}) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sign form
  const [showSignForm, setShowSignForm] = useState(false);
  const [meaning, setMeaning] = useState("APPROVED");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  /* -- Fetch signatures -- */
  const fetchSignatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await esignApi.getSignatures(entity, entityId);
      setSignatures(Array.isArray(result) ? result : result?.rows ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки подписей");
    } finally {
      setLoading(false);
    }
  }, [entity, entityId]);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  /* -- Sign handler -- */
  const handleSign = async () => {
    if (!password.trim()) {
      setSignError("Введите пароль для подтверждения подписи");
      return;
    }

    setSigning(true);
    setSignError(null);
    try {
      await esignApi.sign({
        entity,
        entityId,
        action,
        meaning,
        password: password.trim(),
        reason: reason.trim() || undefined,
      });
      setPassword("");
      setReason("");
      setShowSignForm(false);
      await fetchSignatures();
      onSigned?.();
    } catch (e: any) {
      setSignError(e.response?.data?.message || e.message || "Ошибка подписания");
    } finally {
      setSigning(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";

  const MEANING_OPTIONS = [
    { value: "APPROVED",  label: "Утверждено" },
    { value: "REVIEWED",  label: "Рассмотрено" },
    { value: "VERIFIED",  label: "Верифицировано" },
    { value: "AUTHORED",  label: "Составлено" },
    { value: "WITNESSED", label: "Засвидетельствовано" },
  ];

  return (
    <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool size={16} className="text-[#64B4E8]" />
          <h3 className="text-sm font-semibold text-asvo-text">Электронные подписи</h3>
          <span className="text-[10px] text-asvo-text-dim">(21 CFR Part 11)</span>
        </div>
        {!showSignForm && (
          <button
            onClick={() => setShowSignForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#64B4E8]/10 border border-[#64B4E8]/30 rounded-lg text-[12px] font-medium text-[#64B4E8] hover:bg-[#64B4E8]/20 transition-colors"
          >
            <PenTool size={12} />
            Подписать
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="text-asvo-accent animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
          <span className="text-red-400 text-[12px]">{error}</span>
        </div>
      )}

      {/* Signature list */}
      {!loading && signatures.length === 0 && !error && (
        <p className="text-[13px] text-asvo-text-dim py-3">
          Подписи отсутствуют
        </p>
      )}

      {!loading && signatures.length > 0 && (
        <div className="space-y-2 mb-3">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className="flex items-center gap-3 bg-asvo-surface rounded-lg px-3 py-2.5"
            >
              {/* Verification icon */}
              <div className="shrink-0">
                {sig.isValid ? (
                  <CheckCircle2 size={18} className="text-[#2DD4A8]" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
              </div>

              {/* Signer info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] text-asvo-text font-medium">
                    {sig.signer ? `${sig.signer.surname} ${sig.signer.name}` : sig.signerName}
                  </span>
                  {(sig.signerRole || sig.signer?.role) && (
                    <span className="text-[11px] text-asvo-text-dim">
                      ({sig.signerRole || sig.signer?.role})
                    </span>
                  )}
                  <Badge variant="esign">{sig.meaning}</Badge>
                </div>
                {sig.reason && (
                  <div className="text-[11px] text-asvo-text-dim mt-0.5">
                    Причина: {sig.reason}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-[11px] text-asvo-text-dim">
                  <Clock size={11} />
                  {fmtDateTime(sig.signedAt)}
                </div>
                {sig.isValid && (
                  <div className="flex items-center gap-1 text-[10px] text-[#2DD4A8] mt-0.5">
                    <ShieldCheck size={10} />
                    Верифицирована
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign form */}
      {showSignForm && (
        <div className="border border-[#64B4E8]/30 rounded-lg p-4 space-y-3 bg-[#64B4E8]/5">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} className="text-[#64B4E8]" />
            <h4 className="text-[13px] font-semibold text-asvo-text">Электронная подпись</h4>
          </div>

          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            Подтверждая подпись, вы гарантируете, что действуете осознанно.
            Подпись имеет юридическую силу электронной подписи (21 CFR Part 11).
          </p>

          {/* Meaning */}
          <div>
            <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">Значение подписи</label>
            <select
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className={inputCls}
            >
              {MEANING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">Причина (необязательно)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина подписания..."
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">
              Пароль <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль для подтверждения"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleSign()}
            />
          </div>

          {/* Sign error */}
          {signError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{signError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSign}
              disabled={signing}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#64B4E8] text-asvo-bg font-bold rounded-lg text-[13px] transition-all hover:bg-[#64B4E8]/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PenTool size={14} />
              {signing ? "Подписание..." : "Подписать"}
            </button>
            <button
              onClick={() => { setShowSignForm(false); setPassword(""); setSignError(null); }}
              disabled={signing}
              className="flex items-center gap-1.5 px-4 py-2 border border-asvo-border rounded-lg text-[13px] font-medium text-asvo-text-mid hover:bg-asvo-surface-2 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESignPanel;

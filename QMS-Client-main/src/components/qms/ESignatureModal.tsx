/**
 * ESignatureModal.tsx — Электронная подпись ISO 13485 §4.2.5
 * Compliant e-signature for critical QMS actions
 */

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import QmsModal from "src/components/qms/Modal";
import FormInput from "src/components/qms/FormInput";
import ActionBtn from "src/components/qms/ActionBtn";

/* ─── Types ──────────────────────────────────────────── */

interface ESignatureProps {
  actionDescription: string;
  onSign: (data: { reason: string; comment: string; password: string }) => void;
  onCancel: () => void;
}

/* ─── Component ──────────────────────────────────────── */

const ESignatureModal: React.FC<ESignatureProps> = ({ actionDescription, onSign, onCancel }) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [password, setPassword] = useState("");

  const now = new Date();
  const dateTimeStr = now.toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + " " + now.toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }) + " MSK";

  const handleSign = () => {
    onSign({ reason, comment, password });
  };

  return (
    <QmsModal title="Электронная подпись" onClose={onCancel} width={440}>
      <div className="flex flex-col items-center mb-4">
        <div className="w-12 h-12 bg-asvo-accent-dim rounded-xl flex items-center justify-center mb-3">
          <ShieldCheck size={28} className="text-asvo-accent" />
        </div>
        <div className="text-sm font-semibold text-asvo-text">Подтвердите действие</div>
        <div className="text-xs text-asvo-text-dim mt-1 text-center">{actionDescription}</div>
      </div>

      {/* Signer info card */}
      <div className="bg-asvo-surface border border-asvo-border rounded-lg p-3 mb-4 space-y-1.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-asvo-text-dim">Пользователь</span>
          <span className="text-asvo-text font-medium">Холтобин Алексей Витальевич</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-asvo-text-dim">Роль</span>
          <span className="text-asvo-blue font-medium">Техн. директор</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-asvo-text-dim">Дата/время</span>
          <span className="text-asvo-text font-medium">{dateTimeStr}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-asvo-text-dim">IP</span>
          <span className="text-asvo-text-dim font-mono text-[11px]">192.168.1.45</span>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-3 mb-4">
        <FormInput
          label="Причина подписания"
          options={["Утверждение", "Согласование", "Отклонение", "Пересмотр"]}
          value={reason}
          onChange={setReason}
        />
        <FormInput
          label="Комментарий"
          textarea
          placeholder="Необязательный комментарий..."
          value={comment}
          onChange={setComment}
        />
        <FormInput
          label="Пароль для подтверждения"
          type="password"
          placeholder="Введите пароль..."
          value={password}
          onChange={setPassword}
        />
      </div>

      {/* Warning */}
      <div className="bg-asvo-accent-dim rounded-lg p-3 border border-asvo-accent/20 mb-4">
        <p className="text-[11px] text-asvo-text-dim leading-relaxed">
          ⚠ Электронная подпись имеет юридическую силу согласно §4.2.5 ISO 13485.
          Запись будет внесена в иммутабельный аудит-трейл.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-asvo-border">
        <ActionBtn variant="secondary" onClick={onCancel}>
          Отмена
        </ActionBtn>
        <ActionBtn variant="primary" onClick={handleSign}>
          Подписать
        </ActionBtn>
      </div>
    </QmsModal>
  );
};

export default ESignatureModal;

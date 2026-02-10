import React from "react";

export interface ConfirmModalProps {
  isOpen?: boolean;
  title?: string;
  title1?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  actionConfirm?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "red" | "green" | "blue";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Подтверждение",
  title1,
  message = "Вы уверены?",
  onConfirm,
  onCancel,
  actionConfirm,
  onClose,
  confirmText = "✅ ДА",
  cancelText = "❌ Отмена",
  confirmColor = "green"
}) => {
  const handleConfirm = actionConfirm || onConfirm || (() => {});
  const handleCancel = onClose || onCancel || (() => {});

  if (!isOpen) return null;

  const confirmColorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-emerald-600 hover:bg-emerald-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
      />


      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center justify-center text-center">
          {(title1 || title) && (
            <h2 className="text-xl font-bold text-gray-800">{title1 || title}</h2>
          )}
          {message && (
            <p className="text-gray-600 mt-2">{message}</p>
          )}
          <div className="flex justify-center gap-4 mt-6 w-full">
            <button
              type="button"
              className={`flex-1 ${confirmColorClasses[confirmColor]} text-white py-3 rounded-lg transition font-semibold shadow-lg`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition font-semibold shadow-lg"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

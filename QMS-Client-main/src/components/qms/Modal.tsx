import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, width = 600, children }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="bg-asvo-card border border-asvo-border rounded-2xl flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        style={{ width, maxWidth: "90vw", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-5 border-b border-asvo-border">
          <h3 className="text-base font-bold text-asvo-text">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-asvo-surface-2 text-asvo-text-dim rounded-lg hover:bg-asvo-text hover:text-asvo-bg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

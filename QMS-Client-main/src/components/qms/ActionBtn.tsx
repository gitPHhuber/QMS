import React from "react";

interface ActionBtnProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  color?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const ActionBtn: React.FC<ActionBtnProps> = ({
  children, variant = "primary", color, icon, onClick, className = "",
}) => {
  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition-all hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] ${className}`}
      >
        {icon}{children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-[13px] font-medium transition-all hover:bg-asvo-surface-2 ${className}`}
      style={color ? { borderColor: `${color}44`, color } : { borderColor: "#1A2D4244", color: "#8899AB" }}
    >
      {icon}{children}
    </button>
  );
};

export default ActionBtn;

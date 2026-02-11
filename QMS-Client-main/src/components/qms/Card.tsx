import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => (
  <div
    className={`bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 ${onClick ? "cursor-pointer hover:bg-asvo-surface-3 transition-colors" : ""} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Card;

import React from "react";

interface KeyValueProps {
  label: string;
  value: string | React.ReactNode;
  color?: string;
}

const KeyValue: React.FC<KeyValueProps> = ({ label, value, color }) => (
  <div className="flex justify-between py-1.5 border-b border-asvo-border/20">
    <span className="text-xs text-asvo-text-dim">{label}</span>
    <span
      className="text-[13px] font-medium text-asvo-text"
      style={color ? { color } : undefined}
    >
      {value}
    </span>
  </div>
);

export default KeyValue;

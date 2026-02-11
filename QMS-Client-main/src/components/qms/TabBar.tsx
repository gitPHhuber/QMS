import React from "react";

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 border-b border-asvo-border mb-4">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`px-4 py-2 text-[13px] font-medium transition-all border-b-2 -mb-px ${
          active === t.key
            ? "bg-asvo-accent-dim text-asvo-accent border-asvo-accent font-semibold"
            : "text-asvo-text-dim border-transparent hover:text-asvo-text-mid"
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export default TabBar;

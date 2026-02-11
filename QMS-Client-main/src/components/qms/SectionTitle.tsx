import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-asvo-text">{children}</h3>
    {action && <div>{action}</div>}
  </div>
);

export default SectionTitle;

import React from "react";

export const ToolBtn = ({ icon, label, onClick, title }: { icon: React.ReactElement; label: string; onClick: () => void; title?: string }) => (
  <button
    onClick={onClick}
    type="button"
    title={title}
    className="flex flex-col items-center justify-center w-14 h-14 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all group border border-transparent hover:border-indigo-200"
  >
    <div className="group-hover:-translate-y-0.5 transition-transform">
      {React.cloneElement(icon, { size: 22 })}
    </div>
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

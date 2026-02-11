/**
 * Pagination.tsx — Переиспользуемый компонент пагинации
 * Стилизован под ASVO-QMS тёмную тему.
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalCount,
  limit,
  onChange,
}) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  // Generate page numbers to show
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) pages.push("...");

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("...");

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const btnCls =
    "px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
  const normalCls = `${btnCls} bg-asvo-surface-2 border-asvo-border text-asvo-text-mid hover:border-asvo-accent/40 hover:text-asvo-text`;
  const activeCls = `${btnCls} bg-asvo-accent/15 border-asvo-accent/40 text-asvo-accent font-semibold`;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-[12px] text-asvo-text-dim">
        {from}–{to} из {totalCount}
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={normalCls}
          title="Назад"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1.5 text-asvo-text-dim text-[12px]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={p === page ? activeCls : normalCls}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={normalCls}
          title="Далее"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
  });
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "ON_STOCK": return "bg-asvo-green-dim text-asvo-green border-asvo-border";
    case "IN_WORK": return "bg-asvo-blue-dim text-asvo-blue border-asvo-border";
    case "DONE": return "bg-asvo-purple-dim text-asvo-purple border-asvo-border";
    case "SCRAP": return "bg-asvo-red-dim text-asvo-red border-asvo-border";
    case "QUARANTINE": return "bg-asvo-amber-dim text-asvo-amber border-asvo-border";
    case "APPROVED": return "bg-asvo-green-dim text-asvo-green border-asvo-border";
    case "REJECTED": return "bg-asvo-red-dim text-asvo-red border-asvo-border";
    case "UNDER_REVIEW": return "bg-asvo-blue-dim text-asvo-blue border-asvo-border";
    case "RETURN_TO_SUPPLIER": return "bg-asvo-orange text-asvo-bg border-asvo-border";
    default: return "bg-asvo-grey-dim text-asvo-text-mid border-asvo-border";
  }
};


export const calculateBatch = (total: number, capacity: number) => {

    const safeTotal = Math.max(0, Number(total) || 0);


    const safeCapacity = Math.max(1, Number(capacity) || 1);

    if (safeTotal === 0) {
        return { fullUnits: 0, remainder: 0, totalUnits: 0 };
    }

    const fullUnits = Math.floor(safeTotal / safeCapacity);
    const remainder = safeTotal % safeCapacity;


    const totalUnits = fullUnits + (remainder > 0 ? 1 : 0);

    return { fullUnits, remainder, totalUnits };
};

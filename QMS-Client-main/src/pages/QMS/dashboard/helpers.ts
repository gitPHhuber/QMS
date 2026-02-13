import type { DashboardTrends } from "../../../api/qmsApi";
import type { DashboardRole, TrendPoint } from "./types";
import { MONTH_NAMES } from "./constants";

export const riskCellColor = (likelihood: number, severity: number): string => {
  const score = likelihood * severity;
  if (score <= 4)  return "bg-asvo-green-dim  text-asvo-green";
  if (score <= 9)  return "bg-asvo-amber-dim  text-asvo-amber";
  if (score <= 16) return "bg-[rgba(232,112,64,0.15)] text-asvo-orange";
  return                   "bg-asvo-red-dim    text-asvo-red";
};

export const effColor = (rate: number): string => {
  if (rate >= 80) return "text-[#2DD4A8]";
  if (rate >= 60) return "text-[#E8A830]";
  return "text-[#F06060]";
};

export const auditDaysBadge = (days: number): string => {
  if (days > 14) return "bg-asvo-green-dim text-[#2DD4A8]";
  if (days >= 7) return "bg-asvo-amber-dim text-[#E8A830]";
  return "bg-asvo-red-dim text-[#F06060]";
};

/** "2025-03" → "Мар" */
export function formatMonth(m: string): string {
  const mm = m.split("-")[1];
  return MONTH_NAMES[mm] || m;
}

/** ISO date → "DD.MM" */
export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

/** ISO date → "DD.MM.YYYY" */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Build risk matrix 5x5 from cellCounts */
export function buildRiskMatrix(cellCounts: Record<string, number>): (number | null)[][] {
  const matrix: (number | null)[][] = [];
  for (let l = 5; l >= 1; l--) {
    const row: (number | null)[] = [];
    for (let s = 1; s <= 5; s++) {
      const count = cellCounts[`${l}-${s}`];
      row.push(count ? count : null);
    }
    matrix.push(row);
  }
  return matrix;
}

/** Merge NC/CAPA trend data into Recharts format */
export function buildTrendData(trends: DashboardTrends | null): TrendPoint[] {
  if (!trends) return [];
  const months = new Set<string>();
  trends.nc.forEach(p => months.add(p.month));
  trends.capa.forEach(p => months.add(p.month));

  const ncMap: Record<string, number> = {};
  const capaMap: Record<string, number> = {};
  trends.nc.forEach(p => { ncMap[p.month] = p.count; });
  trends.capa.forEach(p => { capaMap[p.month] = p.count; });

  return [...months].sort().map(m => ({
    month: formatMonth(m),
    nc: ncMap[m] || 0,
    capa: capaMap[m] || 0,
  }));
}

/** Role-based section visibility */
export function showForRole(role: DashboardRole, qm: boolean, ph: boolean, dir: boolean): boolean {
  switch (role) {
    case "quality_manager": return qm;
    case "production_head": return ph;
    case "director":        return dir;
  }
}

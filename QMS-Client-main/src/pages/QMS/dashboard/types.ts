import type React from "react";

export type DashboardRole = "quality_manager" | "production_head" | "director";

export interface KpiCard {
  label: string;
  value: string | number;
  color: string;
  bgClass: string;
  icon: React.ElementType;
  roles: DashboardRole[];
}

export interface TrendPoint {
  month: string;
  nc: number;
  capa: number;
}

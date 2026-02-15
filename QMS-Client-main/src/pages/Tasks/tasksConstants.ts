import React from "react";
import {
  Circle, Clock, Eye, CheckCircle2, Archive,
} from "lucide-react";

/* ─── Shared types ─────────────────────────────────────────────────── */

export interface TaskStats { total: number; done: number; inWork: number; onStock: number; }

/* ─── Column config ─────────────────────────────────────────────────── */

export type StatusDotColor = "blue" | "amber" | "purple" | "accent" | "grey";
export type ProgressBarColor = "blue" | "amber" | "purple" | "accent" | "green";

export interface ColumnDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  dotColor: StatusDotColor;
  progressColor: ProgressBarColor;
  textCls: string;
  badgeCls: string;
  borderTopCls: string;
  gradientCls: string;
  dragBorderCls: string;
}

export const COLUMNS: ColumnDef[] = [
  {
    key: "NEW", label: "Новые", icon: Circle, dotColor: "blue", progressColor: "blue",
    textCls: "text-[#4A90E8]", badgeCls: "bg-[#4A90E8]/15 text-[#4A90E8]",
    borderTopCls: "border-t-2 border-[#4A90E8]/40",
    gradientCls: "bg-gradient-to-br from-[#4A90E8]/[0.04] to-transparent",
    dragBorderCls: "border-[#4A90E8]",
  },
  {
    key: "IN_PROGRESS", label: "В работе", icon: Clock, dotColor: "amber", progressColor: "amber",
    textCls: "text-[#E8A830]", badgeCls: "bg-[#E8A830]/15 text-[#E8A830]",
    borderTopCls: "border-t-2 border-[#E8A830]/40",
    gradientCls: "bg-gradient-to-br from-[#E8A830]/[0.04] to-transparent",
    dragBorderCls: "border-[#E8A830]",
  },
  {
    key: "REVIEW", label: "На проверке", icon: Eye, dotColor: "purple", progressColor: "purple",
    textCls: "text-[#A06AE8]", badgeCls: "bg-[#A06AE8]/15 text-[#A06AE8]",
    borderTopCls: "border-t-2 border-[#A06AE8]/40",
    gradientCls: "bg-gradient-to-br from-[#A06AE8]/[0.04] to-transparent",
    dragBorderCls: "border-[#A06AE8]",
  },
  {
    key: "DONE", label: "Готово", icon: CheckCircle2, dotColor: "accent", progressColor: "accent",
    textCls: "text-[#2DD4A8]", badgeCls: "bg-[#2DD4A8]/15 text-[#2DD4A8]",
    borderTopCls: "border-t-2 border-[#2DD4A8]/40",
    gradientCls: "bg-gradient-to-br from-[#2DD4A8]/[0.04] to-transparent",
    dragBorderCls: "border-[#2DD4A8]",
  },
  {
    key: "CLOSED", label: "Закрыто", icon: Archive, dotColor: "grey", progressColor: "green",
    textCls: "text-[#3A4E62]", badgeCls: "bg-[#3A4E62]/15 text-[#8899AB]",
    borderTopCls: "border-t-2 border-[#3A4E62]/40",
    gradientCls: "bg-gradient-to-br from-[#3A4E62]/[0.04] to-transparent",
    dragBorderCls: "border-[#3A4E62]",
  },
];

/* ─── Source / origin filters ───────────────────────────────────────── */

export const SOURCE_FILTERS = [
  { key: "ALL",       label: "Все",        color: "#2DD4A8" },
  { key: "NC",        label: "NC",         color: "#F06060" },
  { key: "CAPA",      label: "CAPA",       color: "#E8A830" },
  { key: "RISK",      label: "Риск",       color: "#A06AE8" },
  { key: "AUDIT",     label: "Аудит",      color: "#4A90E8" },
  { key: "TRAINING",  label: "Обучение",   color: "#36B5E0" },
  { key: "PRODUCT",   label: "Изделие",    color: "#E06890" },
  { key: "COMPONENT", label: "Компонент",  color: "#3A4E62" },
];

export type BadgeVariant = "nc" | "capa" | "risk" | "audit" | "training" | "sop" | "closed" | "product" | "component";

export const originToBadge: Record<string, BadgeVariant> = {
  NC: "nc", CAPA: "capa", RISK: "risk", AUDIT: "audit",
  TRAINING: "training", PRODUCT: "product", COMPONENT: "component",
};

/* ─── Priority config ──────────────────────────────────────────────── */

export interface PriorityConfig {
  icon: string;
  color: string;
  borderCls: string;
  title: string;
}

export const PRIORITY_MAP: Record<number, PriorityConfig> = {
  3: { icon: "▲▲", color: "text-[#F06060]",  borderCls: "border-l-[3px] border-l-[#F06060]/60",  title: "Критический" },
  2: { icon: "●",  color: "text-[#E8A830]",  borderCls: "border-l-[3px] border-l-[#E8A830]/60",  title: "Средний" },
  1: { icon: "▼",  color: "text-[#4A90E8]",  borderCls: "border-l-[3px] border-l-[#4A90E8]/60",  title: "Низкий" },
};

export const getPriority = (p: number | null | undefined): PriorityConfig => {
  return PRIORITY_MAP[p || 1] || PRIORITY_MAP[1];
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

export const isOverdue = (d?: string | null) => {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toISOString().slice(0, 10));
};

export const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" });
};

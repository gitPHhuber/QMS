// ═══════════════════════════════════════════════════════════════
// ASVO-QMS — Shared UI Components
// ═══════════════════════════════════════════════════════════════

import React from "react";
import {
  ACCENT,
  ACCENT_DIM,
  SURFACE,
  SURFACE2,
  SURFACE3,
  BORDER,
  TEXT,
  TEXT_DIM,
} from "./constants";

// ─── Interfaces ──────────────────────────────────────────────

export interface StatCardItem {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  desc?: string;
  color?: string;
}

// ─── Components ──────────────────────────────────────────────

export const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = ACCENT, children }) => (
  <span style={{
    background: color + "22",
    color,
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  }}>{children}</span>
);

export const StatusDot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{
    width: 8, height: 8, borderRadius: "50%",
    background: color, display: "inline-block",
    boxShadow: `0 0 6px ${color}66`,
  }} />
);

export const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = ACCENT, height = 6 }) => (
  <div style={{ background: SURFACE, borderRadius: height, height, width: "100%", overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, Math.max(0, value))}%`,
      height: "100%",
      background: `linear-gradient(90deg, ${color}88, ${color})`,
      borderRadius: height,
      transition: "width 0.6s ease",
    }} />
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: SURFACE2,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 16,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    ...style,
  }}>{children}</div>
);

export const StatCard: React.FC<StatCardItem> = ({ icon, label, value, sub, color = ACCENT }) => (
  <Card style={{ textAlign: "center", minWidth: 130 }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{sub}</div>}
  </Card>
);

export const Table: React.FC<{ columns: string[]; rows: React.ReactNode[][] }> = ({ columns, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={{
              textAlign: "left", padding: "10px 12px",
              color: TEXT_DIM, fontWeight: 600, fontSize: 11,
              textTransform: "uppercase", letterSpacing: 0.5,
              borderBottom: `1px solid ${BORDER}`,
              background: SURFACE,
              position: "sticky", top: 0,
            }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = SURFACE3)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${BORDER}22`,
                color: TEXT,
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TabBar: React.FC<{ tabs: string[]; active: string; onChange: (t: string) => void }> = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: "8px 16px",
        background: active === t ? ACCENT_DIM : "transparent",
        color: active === t ? ACCENT : TEXT_DIM,
        border: "none",
        borderBottom: active === t ? `2px solid ${ACCENT}` : "2px solid transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.2s",
      }}>{t}</button>
    ))}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>{children}</h3>
    {action}
  </div>
);

export const ActionBtn: React.FC<{
  children: React.ReactNode;
  primary?: boolean;
  small?: boolean;
  color?: string;
}> = ({ children, primary, small, color }) => (
  <button style={{
    padding: small ? "4px 12px" : "8px 20px",
    background: primary ? (color || ACCENT) : "transparent",
    color: primary ? SURFACE : (color || ACCENT),
    border: primary ? "none" : `1px solid ${color || ACCENT}44`,
    borderRadius: 8,
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: 6,
  }}>{children}</button>
);

export const KpiRow: React.FC<{ items: StatCardItem[] }> = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)`, gap: 12 }}>
    {items.map((item, i) => <StatCard key={i} {...item} />)}
  </div>
);

export const Timeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div style={{ position: "relative", paddingLeft: 24 }}>
    <div style={{ position: "absolute", left: 8, top: 4, bottom: 4, width: 2, background: BORDER }} />
    {events.map((ev, i) => (
      <div key={i} style={{ marginBottom: 16, position: "relative" }}>
        <div style={{
          position: "absolute", left: -20, top: 4,
          width: 12, height: 12, borderRadius: "50%",
          background: ev.color || ACCENT,
          border: `2px solid ${SURFACE2}`,
        }} />
        <div style={{ fontSize: 11, color: TEXT_DIM }}>{ev.date}</div>
        <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{ev.title}</div>
        {ev.desc && <div style={{ fontSize: 12, color: TEXT_DIM }}>{ev.desc}</div>}
      </div>
    ))}
  </div>
);

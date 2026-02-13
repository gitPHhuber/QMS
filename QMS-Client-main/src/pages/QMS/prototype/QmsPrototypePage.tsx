/**
 * QmsPrototypePage.tsx — Интерактивный прототип всех 10 QMS-модулей
 * Standalone design prototype с демо-данными (DEXA / ASVOTECH)
 * Тёмная тема, акцент #2dd4a8, inline styles
 */

import React, { useState } from "react";
import {
  ACCENT,
  ACCENT_DIM,
  SURFACE,
  SURFACE3,
  BORDER,
  TEXT,
  TEXT_DIM,
} from "./constants";
import { Badge } from "./shared";
import {
  DashboardModule,
  DocumentsModule,
  NonconformityModule,
  CapaModule,
  RisksModule,
  SuppliersModule,
  AuditsModule,
  TrainingModule,
  EquipmentModule,
  ManagementReviewModule,
} from "./modules";

// ═══════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════

const MODULES: { key: string; label: string; icon: string; Component: React.FC }[] = [
  { key: "dashboard", label: "Дашборд", icon: "\u{1F4CA}", Component: DashboardModule },
  { key: "documents", label: "Документы", icon: "\u{1F4C4}", Component: DocumentsModule },
  { key: "nc", label: "Несоответствия", icon: "\u26A0\uFE0F", Component: NonconformityModule },
  { key: "capa", label: "CAPA", icon: "\u{1F504}", Component: CapaModule },
  { key: "risks", label: "Риски", icon: "\u{1F3AF}", Component: RisksModule },
  { key: "suppliers", label: "Поставщики", icon: "\u{1F3ED}", Component: SuppliersModule },
  { key: "audits", label: "Аудиты", icon: "\u{1F4CB}", Component: AuditsModule },
  { key: "training", label: "Обучение", icon: "\u{1F4DA}", Component: TrainingModule },
  { key: "equipment", label: "Оборудование", icon: "\u{1F527}", Component: EquipmentModule },
  { key: "review", label: "Анализ руководства", icon: "\u{1F454}", Component: ManagementReviewModule },
];

export const QmsPrototypePage: React.FC = () => {
  const [active, setActive] = useState("dashboard");
  const mod = MODULES.find(m => m.key === active) || MODULES[0];

  return (
    <div style={{
      background: SURFACE,
      minHeight: "100vh",
      color: TEXT,
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#0a1219",
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 52,
        gap: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: SURFACE,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>ASVO-QMS</span>
          <Badge color={ACCENT}>Dev</Badge>
        </div>

        <div style={{ display: "flex", gap: 2, marginLeft: 24 }}>
          {["Задачи", "Качество", "Склад", "Админ"].map(tab => (
            <button key={tab} style={{
              padding: "6px 16px",
              background: tab === "Качество" ? ACCENT_DIM : "transparent",
              color: tab === "Качество" ? ACCENT : TEXT_DIM,
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_DIM }}>11.02.2026 12:45</span>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: SURFACE3, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: ACCENT,
          }}>ИК</div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{
          width: 220,
          borderRight: `1px solid ${BORDER}`,
          background: "#0c161f",
          padding: "12px 8px",
          minHeight: "calc(100vh - 52px)",
          flexShrink: 0,
        }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Качество
          </div>
          {MODULES.map(m => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                background: active === m.key ? ACCENT_DIM : "transparent",
                color: active === m.key ? ACCENT : TEXT_DIM,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active === m.key ? 600 : 400,
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: 2,
                borderLeft: active === m.key ? `3px solid ${ACCENT}` : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: 16, width: 22 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflow: "auto", maxHeight: "calc(100vh - 52px)" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{mod.icon}</span>
              {mod.label}
            </h2>
            <div style={{ fontSize: 12, color: TEXT_DIM }}>
              ISO 13485:2016 &bull; ASVO-QMS v2.0
            </div>
          </div>
          <mod.Component />
        </div>
      </div>
    </div>
  );
};

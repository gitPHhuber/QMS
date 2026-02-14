/**
 * ToleranceGauge.tsx — Визуальный индикатор допуска
 * Horizontal bar with red/yellow/green zones and pointer for actual value.
 * ASVO-QMS design system
 */

import React from "react";

interface ToleranceGaugeProps {
  value: number | null;
  lowerLimit: number | null;
  upperLimit: number | null;
  nominal?: number | null;
  unit?: string;
}

const ToleranceGauge: React.FC<ToleranceGaugeProps> = ({
  value,
  lowerLimit,
  upperLimit,
  nominal,
  unit,
}) => {
  /* ---- Bail out if no limits ---- */
  if (lowerLimit == null && upperLimit == null) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-asvo-text-dim">
        <span>Значение:</span>
        <span className="font-mono text-asvo-text">{value != null ? `${value}${unit ? ` ${unit}` : ""}` : "\u2014"}</span>
      </div>
    );
  }

  /* ---- Calculate range for visualization ---- */
  const lo = lowerLimit ?? (upperLimit! - Math.abs(upperLimit!) * 0.5);
  const hi = upperLimit ?? (lowerLimit! + Math.abs(lowerLimit!) * 0.5);
  const span = hi - lo;
  const margin = span * 0.25;
  const vizMin = lo - margin;
  const vizMax = hi + margin;
  const vizSpan = vizMax - vizMin;

  /* Yellow zone: 10% inside each boundary */
  const yellowWidth = span * 0.1;

  /* Positions as percentages */
  const loPct = ((lo - vizMin) / vizSpan) * 100;
  const hiPct = ((hi - vizMin) / vizSpan) * 100;
  const greenStart = loPct + (yellowWidth / vizSpan) * 100;
  const greenEnd = hiPct - (yellowWidth / vizSpan) * 100;

  /* Pointer position */
  const valPct = value != null ? Math.max(0, Math.min(100, ((value - vizMin) / vizSpan) * 100)) : null;

  /* Nominal position */
  const nomPct = nominal != null ? Math.max(0, Math.min(100, ((nominal - vizMin) / vizSpan) * 100)) : null;

  /* Determine value status */
  let valueColor = "#8899AB";
  if (value != null) {
    if (lowerLimit != null && value < lowerLimit) {
      valueColor = "#F06060"; // red - below lower
    } else if (upperLimit != null && value > upperLimit) {
      valueColor = "#F06060"; // red - above upper
    } else if (
      (lowerLimit != null && value < lowerLimit + yellowWidth) ||
      (upperLimit != null && value > upperLimit - yellowWidth)
    ) {
      valueColor = "#E8A830"; // yellow - near boundary
    } else {
      valueColor = "#2DD4A8"; // green - in spec
    }
  }

  return (
    <div className="w-full">
      {/* Value label */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-[11px]">
          {lowerLimit != null && (
            <span className="text-asvo-text-dim">
              Мин: <span className="font-mono text-asvo-text-mid">{lowerLimit}</span>
            </span>
          )}
          {nominal != null && (
            <span className="text-asvo-text-dim">
              Ном: <span className="font-mono text-asvo-text-mid">{nominal}</span>
            </span>
          )}
          {upperLimit != null && (
            <span className="text-asvo-text-dim">
              Макс: <span className="font-mono text-asvo-text-mid">{upperLimit}</span>
            </span>
          )}
          {unit && <span className="text-asvo-text-dim">{unit}</span>}
        </div>
        {value != null && (
          <span className="text-[12px] font-mono font-semibold" style={{ color: valueColor }}>
            {value}{unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>

      {/* Gauge bar */}
      <div className="relative w-full h-3 rounded-full overflow-hidden bg-asvo-surface border border-asvo-border/30">
        {/* Red zone left */}
        <div
          className="absolute top-0 bottom-0 rounded-l-full"
          style={{
            left: 0,
            width: `${loPct}%`,
            background: "rgba(240,96,96,0.25)",
          }}
        />

        {/* Yellow zone left */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${loPct}%`,
            width: `${greenStart - loPct}%`,
            background: "rgba(232,168,48,0.25)",
          }}
        />

        {/* Green zone */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${greenStart}%`,
            width: `${Math.max(0, greenEnd - greenStart)}%`,
            background: "rgba(45,212,168,0.25)",
          }}
        />

        {/* Yellow zone right */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${greenEnd}%`,
            width: `${hiPct - greenEnd}%`,
            background: "rgba(232,168,48,0.25)",
          }}
        />

        {/* Red zone right */}
        <div
          className="absolute top-0 bottom-0 rounded-r-full"
          style={{
            left: `${hiPct}%`,
            width: `${100 - hiPct}%`,
            background: "rgba(240,96,96,0.25)",
          }}
        />

        {/* Nominal marker */}
        {nomPct != null && (
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${nomPct}%`,
              background: "rgba(136,153,171,0.5)",
            }}
          />
        )}

        {/* Value pointer */}
        {valPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 shadow-sm"
            style={{
              left: `${valPct}%`,
              transform: `translate(-50%, -50%)`,
              borderColor: valueColor,
              backgroundColor: valueColor,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ToleranceGauge;

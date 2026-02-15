/**
 * KpiDashboardPage.tsx — KPI Производства
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.4 — Анализ данных
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { mesKpiApi } from "src/api/qms/mesKpi";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KpiSummary {
  fpy: number;
  oee: number;
  cycleTime: number;
  throughput: number;
}

/* ---- Helpers ---- */

const fpyColor = (val: number): string => {
  if (val > 95) return "#2DD4A8";
  if (val > 90) return "#E8A830";
  return "#F06060";
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const KpiDashboardPage: React.FC = () => {
  /* ---- state ---- */
  const [data, setData] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- fetch ---- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mesKpiApi.getSummary();
      setData({
        fpy: res.fpy ?? 0,
        oee: res.oee ?? 0,
        cycleTime: res.cycleTime ?? 0,
        throughput: res.throughput ?? 0,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- loading state ---- */

  if (loading && !data) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка KPI...</span>
        </div>
      </div>
    );
  }

  /* ---- error state ---- */

  if (error && !data) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error}</span>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-surface text-asvo-accent border border-asvo-border hover:bg-asvo-border transition"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  /* ---- KPI cards config ---- */

  const cards = [
    {
      title: "FPY (First Pass Yield)",
      value: `${(data?.fpy ?? 0).toFixed(1)}%`,
      color: fpyColor(data?.fpy ?? 0),
    },
    {
      title: "OEE (Overall Equipment Effectiveness)",
      value: `${(data?.oee ?? 0).toFixed(1)}%`,
      color: "#4A90E8",
    },
    {
      title: "Средний цикл",
      value: `${(data?.cycleTime ?? 0).toFixed(1)} мин`,
      color: "#E8A830",
    },
    {
      title: "Выпуск",
      value: `${data?.throughput ?? 0} ед.`,
      color: "#2DD4A8",
    },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
          <BarChart3 size={22} style={{ color: "#4A90E8" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-asvo-text">
            KPI Производства
          </h1>
          <p className="text-xs text-asvo-text-dim">
            ISO 13485 &sect;8.4 &mdash; Анализ данных
          </p>
        </div>
      </div>

      {/* KPI Grid 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6"
          >
            <span className="text-xs text-asvo-text-dim">{card.title}</span>
            <div className="mt-3 flex items-end gap-2">
              <span
                className="text-3xl font-bold"
                style={{ color: card.color }}
              >
                {card.value}
              </span>
              <div
                className="w-2 h-2 rounded-full mb-2"
                style={{ background: card.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiDashboardPage;

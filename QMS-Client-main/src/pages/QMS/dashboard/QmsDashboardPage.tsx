/**
 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS (ISO 8.4)
 * Dark-theme dashboard с реальными данными из API
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import TabBar from "../../../components/qms/TabBar";
import ProcessMap from "../../../components/qms/ProcessMap";
import { dashboardApi, type DashboardSummary, type DashboardTrends } from "../../../api/qmsApi";
import CreateObjectiveModal from "./CreateObjectiveModal";

import type { DashboardRole } from "./types";
import { roleTabs } from "./constants";
import { buildRiskMatrix, buildTrendData, showForRole } from "./helpers";
import {
  buildKpiCards,
  buildTimelineEvents,
  KpiCardsGrid,
  RiskMatrixWidget,
  TimelineWidget,
  TrendChartWidget,
  QualityObjectivesWidget,
  OverdueCapaWidget,
  CapaEfficiencyWidget,
  CalibrationsWidget,
  SuppliersWidget,
  TrainingWidget,
  DocsApprovalWidget,
  ComplaintsWidget,
  AuditWidget,
  ManagementReviewWidget,
} from "./widgets";

export const QmsDashboardPage: React.FC = () => {
  const [role, setRole] = useState<DashboardRole>("quality_manager");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([dashboardApi.getSummary(), dashboardApi.getTrends()])
      .then(([s, t]) => { setSummary(s); setTrends(t); })
      .catch(e => setError(e?.response?.data?.message || e.message || "Ошибка загрузки дашборда"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([dashboardApi.getSummary(), dashboardApi.getTrends()])
      .then(([s, t]) => {
        if (!cancelled) { setSummary(s); setTrends(t); }
      })
      .catch(e => {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Ошибка загрузки дашборда");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /* ---------- derived data ---------- */

  const kpiCards    = useMemo(() => summary ? buildKpiCards(summary) : [], [summary]);
  const riskMatrix  = useMemo(() => summary?.risks ? buildRiskMatrix(summary.risks.cellCounts) : null, [summary]);
  const trendData   = useMemo(() => buildTrendData(trends), [trends]);
  const timelineAll = useMemo(() => summary ? buildTimelineEvents(summary) : [], [summary]);

  const filteredEvents = role === "production_head"
    ? timelineAll.filter(e => e.category === "nc" || e.category === "equipment")
    : timelineAll;

  const show = (qm: boolean, ph: boolean, dir: boolean) => showForRole(role, qm, ph, dir);

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">
        <TabBar tabs={roleTabs} active={role} onChange={(key) => setRole(key as DashboardRole)} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-64" />
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-64" />
        </div>
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg px-4 py-6 flex items-center justify-center">
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6 text-center max-w-md">
          <AlertTriangle size={32} className="text-asvo-red mx-auto mb-3" />
          <p className="text-sm text-asvo-red mb-2">Ошибка загрузки дашборда</p>
          <p className="text-xs text-asvo-text-dim">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">

      {/* Role Switcher */}
      <TabBar tabs={roleTabs} active={role} onChange={(key) => setRole(key as DashboardRole)} />

      {/* KPI Cards */}
      <KpiCardsGrid cards={kpiCards} role={role} />

      {/* Risk Matrix + Timeline */}
      {show(true, false, true) && riskMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RiskMatrixWidget matrix={riskMatrix} />
          <TimelineWidget events={filteredEvents} />
        </div>
      )}

      {/* Timeline for production_head (no risk matrix) */}
      {role === "production_head" && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TimelineWidget events={filteredEvents} />
        </div>
      )}

      {/* NC / CAPA Trends */}
      {show(true, true, true) && trendData.length > 0 && (
        <TrendChartWidget data={trendData} />
      )}

      {/* Quality Objectives */}
      {show(true, false, true) && <QualityObjectivesWidget summary={summary} />}

      {/* Bottom widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {show(true, false, true) && <OverdueCapaWidget summary={summary} />}
        {show(true, false, true) && <CapaEfficiencyWidget summary={summary} />}
        {show(true, true, false) && <CalibrationsWidget summary={summary} />}
        {show(true, false, true) && <SuppliersWidget summary={summary} />}
        {show(true, true, true) && <TrainingWidget summary={summary} />}
        {show(true, false, true) && <DocsApprovalWidget summary={summary} />}
        {show(true, false, true) && <ComplaintsWidget summary={summary} />}
        {show(true, false, true) && <AuditWidget summary={summary} />}
        {show(true, false, true) && <ManagementReviewWidget summary={summary} />}
      </div>

      {/* Process Map */}
      <ProcessMap />

      {/* Objective Modal */}
      <CreateObjectiveModal
        isOpen={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
        onCreated={reload}
      />
    </div>
  );
};

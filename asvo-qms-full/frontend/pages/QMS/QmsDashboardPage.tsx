/**
 * QmsDashboardPage.tsx — Главный дашборд QMS
 * НОВЫЙ ФАЙЛ: src/pages/QMS/QmsDashboardPage.tsx
 * 
 * Отображает: статус hash-chain, NC/CAPA метрики, DMS статистику
 */

import React, { useEffect, useState } from "react";
import {
  Shield, FileText, AlertTriangle, CheckCircle2, XCircle,
  Clock, Activity, TrendingUp, Loader2, RefreshCw,
  ChevronRight, Lock, Unlock
} from "lucide-react";
import { auditApi, documentsApi, ncApi } from "src/api/qmsApi";
import type { AuditVerifyReport, AuditStats, DocumentStats, NcCapaStats } from "src/api/qmsApi";

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, sub, color = "text-white", onClick }) => (
  <div
    className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${onClick ? "cursor-pointer hover:border-gray-600 transition" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className="text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
  </div>
);

export const QmsDashboardPage: React.FC = () => {
  const [chainReport, setChainReport] = useState<AuditVerifyReport | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [docStats, setDocStats] = useState<DocumentStats | null>(null);
  const [ncStats, setNcStats] = useState<NcCapaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [chain, audit, docs, nc] = await Promise.allSettled([
        auditApi.quickVerify(200),
        auditApi.getStats(30),
        documentsApi.getStats(),
        ncApi.getStats(),
      ]);
      if (chain.status === "fulfilled") setChainReport(chain.value);
      if (audit.status === "fulfilled") setAuditStats(audit.value);
      if (docs.status === "fulfilled") setDocStats(docs.value);
      if (nc.status === "fulfilled") setNcStats(nc.value);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const runFullVerify = async () => {
    setVerifying(true);
    try {
      const report = await auditApi.fullVerify();
      setChainReport(report);
    } finally {
      setVerifying(false);
    }
  };

  const ncOpen = ncStats?.ncByStatus?.find(s => s.status === "OPEN");
  const ncTotal = ncStats?.ncByStatus?.reduce((s, v) => s + Number(v.count), 0) || 0;
  const capaOpen = ncStats?.capaByStatus?.filter(s => !["CLOSED", "EFFECTIVE"].includes(s.status))
    .reduce((s, v) => s + Number(v.count), 0) || 0;

  const docsEffective = docStats?.byStatus?.find(s => s.status === "EFFECTIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ASVO-QMS</h1>
            <p className="text-sm text-gray-500">Система менеджмента качества • ISO 13485</p>
          </div>
        </div>
        <button onClick={loadAll} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
          <RefreshCw size={12} /> Обновить
        </button>
      </div>

      {/* Hash-Chain Status Banner */}
      {chainReport && (
        <div className={`rounded-xl p-4 mb-6 border ${
          chainReport.valid
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {chainReport.valid ? (
                <Lock className="w-6 h-6 text-emerald-600" />
              ) : (
                <Unlock className="w-6 h-6 text-red-600" />
              )}
              <div>
                <div className={`font-bold ${chainReport.valid ? "text-emerald-800" : "text-red-800"}`}>
                  {chainReport.valid ? "Целостность аудит-трейла подтверждена" : `Обнаружено ${chainReport.invalidRecords} нарушений!`}
                </div>
                <div className="text-xs text-gray-600">
                  {chainReport.totalRecords} записей проверено • {chainReport.unchainedRecords} без hash-chain (legacy)
                  {chainReport.durationMs && ` • ${chainReport.durationMs}ms`}
                </div>
              </div>
            </div>
            <button
              onClick={runFullVerify}
              disabled={verifying}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {verifying ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
              Полная проверка
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={Activity} label="Аудит событий (30д)" value={auditStats?.total || 0}
          sub={`${auditStats?.chainCoverage || 0}% с hash-chain`} color="text-indigo-400" />

        <StatCard icon={FileText} label="Документов" value={Number(docsEffective?.count || 0)}
          sub={`${docStats?.pendingApprovalsCount || 0} на согласовании`} color="text-blue-400" />

        <StatCard icon={AlertTriangle} label="NC открытых" value={Number(ncOpen?.count || 0)}
          sub={`${ncTotal} всего`} color={Number(ncOpen?.count || 0) > 0 ? "text-red-400" : "text-emerald-400"} />

        <StatCard icon={CheckCircle2} label="CAPA активных" value={capaOpen}
          color={capaOpen > 0 ? "text-amber-400" : "text-emerald-400"} />

        <StatCard icon={Clock} label="NC просрочено" value={ncStats?.overdueNc || 0}
          color={Number(ncStats?.overdueNc || 0) > 0 ? "text-red-500" : "text-gray-400"} />

        <StatCard icon={Clock} label="CAPA просрочено" value={ncStats?.overdueCapa || 0}
          color={Number(ncStats?.overdueCapa || 0) > 0 ? "text-red-500" : "text-gray-400"} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Журнал аудита", desc: "Hash-chain аудит-трейл", href: "/audit", icon: Shield, color: "from-indigo-500 to-blue-600" },
          { title: "Документы СМК", desc: "Реестр документации", href: "/documents", icon: FileText, color: "from-blue-500 to-cyan-600" },
          { title: "Несоответствия", desc: "Реестр NC", href: "/nonconformity", icon: AlertTriangle, color: "from-red-500 to-orange-600" },
          { title: "CAPA", desc: "Корректирующие действия", href: "/capa", icon: CheckCircle2, color: "from-amber-500 to-yellow-600" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition flex items-center gap-3"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${link.color} rounded-lg flex items-center justify-center shadow`}>
              <link.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-sm">{link.title}</div>
              <div className="text-xs text-gray-500">{link.desc}</div>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
          </a>
        ))}
      </div>

      {/* Severity Distribution */}
      {auditStats?.bySeverity && auditStats.bySeverity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Распределение по severity (30 дней)</h3>
          <div className="flex gap-2">
            {auditStats.bySeverity.map((s) => {
              const colors: Record<string, string> = {
                INFO: "bg-gray-100 text-gray-700",
                WARNING: "bg-amber-100 text-amber-700",
                CRITICAL: "bg-red-100 text-red-700",
                SECURITY: "bg-purple-100 text-purple-700",
              };
              return (
                <div key={s.severity} className={`px-3 py-2 rounded-lg ${colors[s.severity] || "bg-gray-100"}`}>
                  <div className="text-lg font-bold">{s.count}</div>
                  <div className="text-xs">{s.severity}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NC by Classification */}
      {ncStats?.ncByClassification && ncStats.ncByClassification.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">NC по классификации</h3>
          <div className="flex gap-2">
            {ncStats.ncByClassification.map((c) => {
              const colors: Record<string, string> = {
                CRITICAL: "bg-red-100 text-red-700 border-red-200",
                MAJOR: "bg-amber-100 text-amber-700 border-amber-200",
                MINOR: "bg-gray-100 text-gray-700 border-gray-200",
              };
              const labels: Record<string, string> = {
                CRITICAL: "Критические", MAJOR: "Серьёзные", MINOR: "Незначительные",
              };
              return (
                <div key={c.classification} className={`px-4 py-3 rounded-lg border ${colors[c.classification] || "bg-gray-100"}`}>
                  <div className="text-2xl font-bold">{c.count}</div>
                  <div className="text-xs">{labels[c.classification] || c.classification}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Shield, AlertTriangle, CheckCircle,
  Search, Eye, ChevronRight, Scale, Link2, Loader2,
} from 'lucide-react';
import KpiRow from '../../../components/qms/KpiRow';
import ActionBtn from '../../../components/qms/ActionBtn';
import Badge from '../../../components/qms/Badge';
import DataTable from '../../../components/qms/DataTable';
import SectionTitle from '../../../components/qms/SectionTitle';
import {
  riskManagementApi,
  type TraceabilityMatrixRow,
  type RiskClass,
} from '../../../api/qmsApi';
import type { TabKey, PlanRow, HazardRow, TraceRow, BenefitRiskRow, StatsData } from './types';
import { riskClassColors, hazardCategoryColors } from './constants';
import { planColumns, hazardColumns, traceColumns } from './columns';
import { mapPlan, mapHazard, mapTraceRow, mapBenefitRisk } from './mappers';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'plans',        label: 'Plany RMP',             icon: <FileText size={15} /> },
  { key: 'hazards',      label: 'Analiz opasnostey',     icon: <AlertTriangle size={15} /> },
  { key: 'traceability', label: 'Matritsa proslezh.',    icon: <Link2 size={15} /> },
  { key: 'benefit-risk', label: 'Pol\'za / Risk',        icon: <Scale size={15} /> },
];

const RiskManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('plans');
  const [search, setSearch] = useState('');

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [hazards, setHazards] = useState<HazardRow[]>([]);
  const [traceability, setTraceability] = useState<TraceRow[]>([]);
  const [benefitRisk, setBenefitRisk] = useState<BenefitRiskRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    riskManagementApi.getStats()
      .then((data) => setStats(data))
      .catch(() => {/* stats are non-critical */});
  }, []);

  const fetchTabData = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case 'plans': {
          const res = await riskManagementApi.getPlans({ search: search || undefined });
          setPlans((res.rows ?? []).map(mapPlan));
          break;
        }
        case 'hazards': {
          const res = await riskManagementApi.getHazards({ search: search || undefined });
          setHazards((res.rows ?? []).map(mapHazard));
          break;
        }
        case 'traceability': {
          const res = await riskManagementApi.getTraceability({ search: search || undefined });
          const rows: TraceRow[] = (res.rows ?? []).flatMap((t: TraceabilityMatrixRow) => mapTraceRow(t));
          setTraceability(rows);
          break;
        }
        case 'benefit-risk': {
          const res = await riskManagementApi.getBenefitRisk({ search: search || undefined });
          setBenefitRisk((res.rows ?? []).map(mapBenefitRisk));
          break;
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Oshibka zagruzki dannykh');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const kpis = [
    { label: 'Plany RMP',              value: stats?.totalPlans ?? 0,        color: '#A06AE8', icon: <FileText size={18} /> },
    { label: 'Opasnostey',             value: stats?.totalHazards ?? 0,      color: '#F06060', icon: <AlertTriangle size={18} /> },
    { label: 'Mer upravleniya',        value: stats?.totalControls ?? 0,     color: '#4A90E8', icon: <Shield size={18} /> },
    { label: 'Verifitsirovano',        value: stats?.verifiedControls ?? 0,  color: '#2DD4A8', icon: <CheckCircle size={18} /> },
    { label: 'Benefit-Risk analizov',  value: stats?.totalBenefitRisk ?? 0,  color: '#E8A830', icon: <Scale size={18} /> },
  ];

  const hazardCategorySummary: Array<{ cat: string; count: number; color: string }> =
    stats?.hazardsByCategory
      ? stats.hazardsByCategory.map((item) => ({
          cat: item.category,
          count: Number(item.count),
          color: hazardCategoryColors[item.category] ?? '#8899AB',
        }))
      : Object.entries(
          hazards.reduce<Record<string, number>>((acc, h) => {
            acc[h.category] = (acc[h.category] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([cat, count]) => ({
          cat,
          count,
          color: hazardCategoryColors[cat] ?? '#8899AB',
        }));

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(160,106,232,0.12)' }}>
            <FileText className="text-[#A06AE8]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Fayl menedzhmenta riska</h1>
            <p className="text-asvo-text-dim text-sm">ISO 14971:2019 &mdash; Primeneniye menedzhmenta riska k meditsinskim izdeliyam</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn icon={<Plus size={15} />}>
            {activeTab === 'plans' ? 'Noviy plan' :
             activeTab === 'hazards' ? 'Novaya opasnost\'' :
             activeTab === 'traceability' ? 'Novaya mera' :
             'Noviy analiz'}
          </ActionBtn>
          <ActionBtn variant="secondary" color="#A06AE8" icon={<Eye size={15} />}>
            Otchyot ISO 14971
          </ActionBtn>
        </div>
      </div>

      <KpiRow items={kpis} />

      {/* Tabs */}
      <div className="flex gap-1 bg-asvo-surface border border-asvo-border rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-asvo-accent/15 text-asvo-accent'
                : 'text-asvo-text-dim hover:text-asvo-text hover:bg-asvo-surface-2'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Poisk po ID, nazvaniyu ili opisaniyu..."
            className="w-full pl-10 pr-4 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 shrink-0" size={20} />
          <div>
            <p className="text-red-400 text-sm font-medium">Oshibka zagruzki</p>
            <p className="text-red-400/70 text-xs">{error}</p>
          </div>
          <button
            onClick={() => fetchTabData(activeTab)}
            className="ml-auto text-xs text-red-400 border border-red-400/30 rounded px-3 py-1 hover:bg-red-400/10 transition-colors"
          >
            Povtorit'
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-asvo-accent" size={32} />
          <span className="ml-3 text-asvo-text-dim text-sm">Zagruzka...</span>
        </div>
      )}

      {/* Plans tab */}
      {!loading && activeTab === 'plans' && (
        <>
          <SectionTitle>Plany menedzhmenta riskov (ISO 14971 &sect;4.4)</SectionTitle>
          <DataTable columns={planColumns} data={plans} />
        </>
      )}

      {/* Hazards tab */}
      {!loading && activeTab === 'hazards' && (
        <>
          <SectionTitle>Analiz opasnostey (ISO 14971 &sect;5)</SectionTitle>
          <DataTable columns={hazardColumns} data={hazards} />

          {hazardCategorySummary.length > 0 && (
            <>
              <SectionTitle>Opasnosti po kategoriyam</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {hazardCategorySummary.map(item => (
                  <div
                    key={item.cat}
                    className="bg-asvo-surface border border-asvo-border rounded-lg p-3 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-asvo-text-mid text-xs flex-1">{item.cat}</span>
                    <span className="text-asvo-text font-bold text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Traceability tab */}
      {!loading && activeTab === 'traceability' && (
        <>
          <SectionTitle>Matritsa proslezhivayemosti mer upravleniya (ISO 14971 &sect;7-8)</SectionTitle>
          <p className="text-asvo-text-dim text-xs mb-3">
            Polnaya tsepochka: Opasnost' &rarr; Iskhodnyy risk &rarr; Mera upravleniya &rarr; Verifikatsiya &rarr; Rezidual'nyy risk &rarr; Benefit/Risk
          </p>
          <DataTable columns={traceColumns} data={traceability} />

          <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 mt-4">
            <h4 className="text-xs font-semibold text-asvo-text mb-2">Prioritet mer po ISO 14971</h4>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Badge color="#2DD4A8" bg="rgba(45,212,168,0.14)">1</Badge>
                <span className="text-asvo-text-mid text-xs">Bezopasnyy po suti dizayn (&sect;7.2)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="#4A90E8" bg="rgba(74,144,232,0.14)">2</Badge>
                <span className="text-asvo-text-mid text-xs">Zashchitnyye mery (&sect;7.3)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="#E8A830" bg="rgba(232,168,48,0.14)">3</Badge>
                <span className="text-asvo-text-mid text-xs">Informatsiya dlya bezopasnosti (&sect;7.4)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Benefit-risk tab */}
      {!loading && activeTab === 'benefit-risk' && (
        <>
          <SectionTitle>Analiz pol'zy/riska (ISO 14971 &sect;6.5)</SectionTitle>
          <p className="text-asvo-text-dim text-xs mb-3">
            Otsenka obosnovannosti ostatochnogo riska s tochki zreniya klinicheskoy pol'zy
          </p>

          <div className="space-y-3">
            {benefitRisk.length === 0 && (
              <div className="bg-asvo-surface border border-asvo-border rounded-xl p-8 text-center">
                <p className="text-asvo-text-dim text-sm">Net dannykh</p>
              </div>
            )}
            {benefitRisk.map(bra => (
              <div
                key={bra.id}
                className="bg-asvo-surface border border-asvo-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-asvo-accent text-sm">BRA-{String(bra.id).padStart(3, '0')}</span>
                    <ChevronRight size={14} className="text-asvo-text-dim" />
                    <span className="text-asvo-text text-sm">{bra.hazard}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      color={riskClassColors[bra.residualRisk as RiskClass]?.color}
                      bg={riskClassColors[bra.residualRisk as RiskClass]?.bg}
                    >
                      Rezid: {bra.residualRisk}
                    </Badge>
                    <Badge
                      color={bra.outweighs ? '#2DD4A8' : '#F06060'}
                      bg={bra.outweighs ? 'rgba(45,212,168,0.14)' : 'rgba(240,96,96,0.14)'}
                    >
                      {bra.outweighs ? 'Pol\'za > Risk' : 'Risk > Pol\'za'}
                    </Badge>
                  </div>
                </div>
                <p className="text-asvo-text-mid text-xs mb-1">
                  <strong>Pol'za:</strong> {bra.benefit}
                </p>
                <p className="text-asvo-text-dim text-xs">
                  <strong>Zaklyucheniye:</strong> {bra.conclusion}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RiskManagementPage;

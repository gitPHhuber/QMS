import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Shield, AlertTriangle, CheckCircle,
  Search, Eye, ChevronRight, Activity, ClipboardList,
  Scale, Link2, Loader2,
} from 'lucide-react';
import KpiRow from '../../components/qms/KpiRow';
import ActionBtn from '../../components/qms/ActionBtn';
import Badge from '../../components/qms/Badge';
import DataTable from '../../components/qms/DataTable';
import SectionTitle from '../../components/qms/SectionTitle';
import {
  riskManagementApi,
  RmpStatus,
  LifecyclePhase,
  HazardCategory,
  HazardStatus,
  RiskClass,
  ControlType,
  RiskManagementPlanShort,
  HazardShort,
  TraceabilityMatrixRow,
} from '../../api/qmsApi';

/* ───── row interfaces for tables ───── */
interface PlanRow {
  id: number;
  planNumber: string;
  title: string;
  product: string;
  phase: string;
  status: RmpStatus;
  hazardCount: number;
  version: string;
  [key: string]: unknown;
}

interface HazardRow {
  id: number;
  number: string;
  category: string;
  description: string;
  harm: string;
  p: number;
  s: number;
  level: number;
  riskClass: RiskClass;
  residualClass: RiskClass | null;
  status: HazardStatus;
  controlCount: number;
  [key: string]: unknown;
}

interface TraceRow {
  id: string;
  hazardNum: string;
  hazardDesc: string;
  initialRisk: string;
  controlType: ControlType;
  controlDesc: string;
  verifResult: string;
  residualRisk: string;
  braResult: string;
  [key: string]: unknown;
}

/* ───── mock data ───── */
const PLANS: PlanRow[] = [
  { id: '1', planNumber: 'RMP-2026-001', title: 'Kardiomonitor KM-200', product: 'KM-200', phase: 'Proizvodstvo', status: 'EFFECTIVE', hazardCount: 18, version: '2.1' },
  { id: '2', planNumber: 'RMP-2026-002', title: 'Infuzniy nasos IN-100', product: 'IN-100', phase: 'Verifikatsiya', status: 'APPROVED', hazardCount: 24, version: '1.0' },
  { id: '3', planNumber: 'RMP-2026-003', title: "Pul'soksimetr PO-50", product: 'PO-50', phase: 'Proyektirovaniye', status: 'DRAFT', hazardCount: 7, version: '0.3' },
];

const HAZARDS: HazardRow[] = [
  { id: '1', number: 'HAZ-001', category: 'ENERGY', description: 'Elektricheskiy udar cherez korpus', harm: "Smert' patsiyenta", p: 2, s: 5, level: 10, riskClass: 'HIGH', residualClass: 'LOW', status: 'VERIFIED', controlCount: 3 },
  { id: '2', number: 'HAZ-002', category: 'SOFTWARE', description: 'Oshibka algoritma rasschyota SpO2', harm: 'Nevernaya diagnostika', p: 3, s: 4, level: 12, riskClass: 'HIGH', residualClass: 'MEDIUM', status: 'CONTROLLED', controlCount: 2 },
  { id: '3', number: 'HAZ-003', category: 'MECHANICAL', description: 'Razrusheniye krepleniya datchika', harm: 'Travma kozhi patsiyenta', p: 2, s: 3, level: 6, riskClass: 'MEDIUM', residualClass: 'LOW', status: 'ACCEPTED', controlCount: 1 },
  { id: '4', number: 'HAZ-004', category: 'USE_ERROR', description: "Nepravil'noye podklyucheniye elektrodov", harm: 'Nevernaya EKG-diagnostika', p: 4, s: 4, level: 16, riskClass: 'CRITICAL', residualClass: 'MEDIUM', status: 'CONTROLLED', controlCount: 4 },
  { id: '5', number: 'HAZ-005', category: 'ELECTROMAGNETIC', description: 'EMI ot sosednikh priborov', harm: 'Artefakty signala', p: 3, s: 3, level: 9, riskClass: 'MEDIUM', residualClass: null, status: 'IDENTIFIED', controlCount: 0 },
  { id: '6', number: 'HAZ-006', category: 'BIOLOGICAL', description: "Bionesovmestimost' materiala elektroda", harm: 'Allergicheskaya reaktsiya', p: 2, s: 3, level: 6, riskClass: 'MEDIUM', residualClass: 'LOW', status: 'VERIFIED', controlCount: 2 },
];

interface BenefitRiskRow {
  id: number;
  hazard: string;
  residualRisk: string;
  benefit: string;
  conclusion: string;
  outweighs: boolean;
  [key: string]: unknown;
}


interface StatsData {
  totalPlans: number;
  totalHazards: number;
  totalControls: number;
  verifiedControls: number;
  totalBenefitRisk: number;
  hazardsByCategory?: Array<{ category: string; count: number }>;
  [key: string]: unknown;
}

/* ───── status / class colors ───── */
const rmpStatusColors: Record<RmpStatus, { color: string; bg: string }> = {
  DRAFT:     { color: '#8899AB', bg: 'rgba(136,153,171,0.14)' },
  REVIEW:    { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  APPROVED:  { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  EFFECTIVE: { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  REVISION:  { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  ARCHIVED:  { color: '#3A4E62', bg: 'rgba(58,78,98,0.15)' },
};

const rmpStatusLabels: Record<RmpStatus, string> = {
  DRAFT: 'Chernovik', REVIEW: 'Na rassmotreniye', APPROVED: 'Utverzhdon',
  EFFECTIVE: 'Deystvuyushchiy', REVISION: 'Reviziya', ARCHIVED: 'Arkhiv',
};

const riskClassColors: Record<RiskClass, { color: string; bg: string }> = {
  LOW:      { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  MEDIUM:   { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  HIGH:     { color: '#E87040', bg: 'rgba(232,112,64,0.14)' },
  CRITICAL: { color: '#F06060', bg: 'rgba(240,96,96,0.14)' },
};

const hazardStatusLabels: Record<HazardStatus, string> = {
  IDENTIFIED: 'Vyyavleno', ANALYZED: 'Proanalizirovano', CONTROLLED: 'Pod kontrolem',
  VERIFIED: 'Verifitsirovano', ACCEPTED: 'Prinyato', MONITORING: 'Monitoring',
};

const hazardStatusColors: Record<HazardStatus, { color: string; bg: string }> = {
  IDENTIFIED: { color: '#8899AB', bg: 'rgba(136,153,171,0.14)' },
  ANALYZED:   { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  CONTROLLED: { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  VERIFIED:   { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  ACCEPTED:   { color: '#36B5E0', bg: 'rgba(54,181,224,0.14)' },
  MONITORING: { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
};

const controlTypeLabels: Record<ControlType, string> = {
  INHERENT_SAFETY: 'Bezop. design',
  PROTECTIVE:      'Zashch. mery',
  INFORMATION:     'Informirovaniye',
};

const controlTypeColors: Record<ControlType, { color: string; bg: string }> = {
  INHERENT_SAFETY: { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  PROTECTIVE:      { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  INFORMATION:     { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
};

const hazardCategoryColors: Record<string, string> = {
  ENERGY:          '#F06060',
  SOFTWARE:        '#A06AE8',
  MECHANICAL:      '#E87040',
  USE_ERROR:       '#E8A830',
  ELECTROMAGNETIC: '#4A90E8',
  BIOLOGICAL:      '#36B5E0',
  CHEMICAL:        '#2DD4A8',
  OPERATIONAL:     '#8899AB',
  INFORMATION:     '#E8A830',
  ENVIRONMENTAL:   '#6ABF69',
  THERMAL:         '#E87040',
  RADIATION:       '#F06060',
};

/* ───── tabs ───── */
type TabKey = 'plans' | 'hazards' | 'traceability' | 'benefit-risk';

/* ───── data mapping helpers ───── */
function mapPlan(p: RiskManagementPlanShort): PlanRow {
  return {
    id: p.id,
    planNumber: p.planNumber,
    title: p.title,
    product: p.productName,
    phase: p.lifecyclePhase,
    status: p.status,
    hazardCount: p.hazards?.length ?? 0,
    version: p.version,
  };
}

function mapHazard(h: HazardShort): HazardRow {
  return {
    id: h.id,
    number: h.hazardNumber,
    category: h.hazardCategory,
    description: h.hazardDescription,
    harm: h.harm,
    p: h.probabilityOfOccurrence,
    s: h.severityOfHarm,
    level: h.riskLevel,
    riskClass: h.riskClass,
    residualClass: h.residualRiskClass,
    status: h.status,
    controlCount: 0,
  };
}

function mapTraceRow(t: TraceabilityMatrixRow): TraceRow[] {
  if (!t.controlMeasures || t.controlMeasures.length === 0) {
    const iRisk = t.initialRisk;
    const rRisk = t.residualRisk;
    return [{
      id: `${t.hazardId}-0`,
      hazardNum: t.hazardNumber,
      hazardDesc: t.hazardDescription,
      initialRisk: `${iRisk.class} (${iRisk.probability}x${iRisk.severity}=${iRisk.level})`,
      controlType: 'INHERENT_SAFETY' as ControlType,
      controlDesc: '-',
      verifResult: '-',
      residualRisk: rRisk.class
        ? `${rRisk.class} (${rRisk.probability ?? '?'}x${rRisk.severity ?? '?'}=${rRisk.level ?? '?'})`
        : '-',
      braResult: t.benefitRiskAnalysis
        ? (t.benefitRiskAnalysis.benefitOutweighsRisk ? "Pol'za > Risk" : "Risk > Pol'za")
        : '-',
    }];
  }

  return t.controlMeasures.map((cm, idx) => {
    const iRisk = t.initialRisk;
    const rRisk = t.residualRisk;
    return {
      id: `${t.hazardId}-${idx}`,
      hazardNum: t.hazardNumber,
      hazardDesc: t.hazardDescription,
      initialRisk: `${iRisk.class} (${iRisk.probability}x${iRisk.severity}=${iRisk.level})`,
      controlType: cm.type,
      controlDesc: cm.description,
      verifResult: cm.verificationResult,
      residualRisk: rRisk.class
        ? `${rRisk.class} (${rRisk.probability ?? '?'}x${rRisk.severity ?? '?'}=${rRisk.level ?? '?'})`
        : '-',
      braResult: t.benefitRiskAnalysis
        ? (t.benefitRiskAnalysis.benefitOutweighsRisk ? "Pol'za > Risk" : "Risk > Pol'za")
        : '-',
    };
  });
}

function mapBenefitRisk(bra: any): BenefitRiskRow {
  return {
    id: bra.id,
    hazard: bra.hazard
      ? `${bra.hazard.hazardNumber ?? 'HAZ-???'} — ${bra.hazard.hazardDescription ?? bra.hazardDescription ?? ''}`
      : `BRA-${bra.id}`,
    residualRisk: bra.residualRiskClass ?? bra.residualRisk ?? 'MEDIUM',
    benefit: bra.intendedBenefit ?? bra.benefit ?? '',
    conclusion: bra.conclusion ?? '',
    outweighs: bra.benefitOutweighsRisk ?? false,
  };
}

/* ───── plan table columns ───── */
const planColumns = [
  {
    key: 'planNumber',
    label: 'Nomer',
    width: '130px',
    render: (r: PlanRow) => <span className="font-mono text-asvo-accent">{r.planNumber}</span>,
  },
  {
    key: 'title',
    label: 'Nazvaniye',
    render: (r: PlanRow) => <span className="text-asvo-text">{r.title}</span>,
  },
  {
    key: 'product',
    label: 'Produkt',
    render: (r: PlanRow) => <span className="text-asvo-text-mid">{r.product}</span>,
  },
  {
    key: 'phase',
    label: 'Faza',
    render: (r: PlanRow) => <span className="text-asvo-text-mid">{r.phase}</span>,
  },
  {
    key: 'hazardCount',
    label: 'Opasnostey',
    align: 'center' as const,
    render: (r: PlanRow) => <span className="text-asvo-text font-mono">{r.hazardCount}</span>,
  },
  {
    key: 'version',
    label: 'Versiya',
    align: 'center' as const,
    render: (r: PlanRow) => <span className="text-asvo-text-dim">v{r.version}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center' as const,
    render: (r: PlanRow) => {
      const c = rmpStatusColors[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{rmpStatusLabels[r.status]}</Badge>;
    },
  },
];

/* ───── hazard table columns ───── */
const hazardColumns = [
  {
    key: 'number',
    label: 'ID',
    width: '90px',
    render: (r: HazardRow) => <span className="font-mono text-asvo-accent">{r.number}</span>,
  },
  {
    key: 'category',
    label: 'Kategoriya',
    width: '120px',
    render: (r: HazardRow) => <span className="text-asvo-text-mid text-xs">{r.category}</span>,
  },
  {
    key: 'description',
    label: 'Opasnost\'',
    render: (r: HazardRow) => <span className="text-asvo-text">{r.description}</span>,
  },
  {
    key: 'harm',
    label: 'Vred',
    render: (r: HazardRow) => <span className="text-[#F06060] text-xs">{r.harm}</span>,
  },
  {
    key: 'level',
    label: 'PxS',
    align: 'center' as const,
    width: '70px',
    render: (r: HazardRow) => <span className="font-mono text-xs text-asvo-text">{r.p}&times;{r.s}={r.level}</span>,
  },
  {
    key: 'riskClass',
    label: 'Klass',
    align: 'center' as const,
    width: '80px',
    render: (r: HazardRow) => {
      const c = riskClassColors[r.riskClass];
      return <Badge color={c?.color} bg={c?.bg}>{r.riskClass}</Badge>;
    },
  },
  {
    key: 'residualClass',
    label: 'Rezid.',
    align: 'center' as const,
    width: '80px',
    render: (r: HazardRow) => {
      if (!r.residualClass) return <span className="text-asvo-text-dim text-xs">-</span>;
      const c = riskClassColors[r.residualClass];
      return <Badge color={c?.color} bg={c?.bg}>{r.residualClass}</Badge>;
    },
  },
  {
    key: 'controlCount',
    label: 'Mery',
    align: 'center' as const,
    width: '60px',
    render: (r: HazardRow) => <span className="font-mono text-asvo-text">{r.controlCount}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center' as const,
    width: '120px',
    render: (r: HazardRow) => {
      const c = hazardStatusColors[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{hazardStatusLabels[r.status]}</Badge>;
    },
  },
];

/* ───── traceability matrix columns ───── */
const traceColumns = [
  {
    key: 'hazardNum',
    label: 'Opasnost\'',
    width: '90px',
    render: (r: TraceRow) => <span className="font-mono text-asvo-accent">{r.hazardNum}</span>,
  },
  {
    key: 'hazardDesc',
    label: 'Opisaniye',
    render: (r: TraceRow) => <span className="text-asvo-text text-xs">{r.hazardDesc}</span>,
  },
  {
    key: 'initialRisk',
    label: 'Iskhodnyy risk',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const cls = r.initialRisk.split(' ')[0] as RiskClass;
      const c = riskClassColors[cls];
      return <Badge color={c?.color} bg={c?.bg}>{r.initialRisk}</Badge>;
    },
  },
  {
    key: 'controlType',
    label: 'Tip mery',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const c = controlTypeColors[r.controlType];
      return <Badge color={c?.color} bg={c?.bg}>{controlTypeLabels[r.controlType]}</Badge>;
    },
  },
  {
    key: 'controlDesc',
    label: 'Mera upravleniya',
    render: (r: TraceRow) => <span className="text-asvo-text text-xs">{r.controlDesc}</span>,
  },
  {
    key: 'verifResult',
    label: 'Verifikatsiya',
    align: 'center' as const,
    width: '100px',
    render: (r: TraceRow) => {
      const isPASS = r.verifResult === 'PASS';
      return (
        <Badge
          color={isPASS ? '#2DD4A8' : '#F06060'}
          bg={isPASS ? 'rgba(45,212,168,0.14)' : 'rgba(240,96,96,0.14)'}
        >
          {r.verifResult}
        </Badge>
      );
    },
  },
  {
    key: 'residualRisk',
    label: 'Rezid. risk',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const cls = r.residualRisk.split(' ')[0] as RiskClass;
      const c = riskClassColors[cls];
      return <Badge color={c?.color} bg={c?.bg}>{r.residualRisk}</Badge>;
    },
  },
  {
    key: 'braResult',
    label: 'Pol\'za/Risk',
    align: 'center' as const,
    width: '100px',
    render: (r: TraceRow) => {
      if (r.braResult === '-') return <span className="text-asvo-text-dim">-</span>;
      return <Badge color="#2DD4A8" bg="rgba(45,212,168,0.14)">{r.braResult}</Badge>;
    },
  },
];

/* ════════════════════════════════════════════════════ */

const RiskManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('plans');
  const [search, setSearch] = useState('');

  /* ───── data state ───── */
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [hazards, setHazards] = useState<HazardRow[]>([]);
  const [traceability, setTraceability] = useState<TraceRow[]>([]);
  const [benefitRisk, setBenefitRisk] = useState<BenefitRiskRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ───── fetch stats on mount ───── */
  useEffect(() => {
    riskManagementApi.getStats()
      .then((data) => setStats(data))
      .catch(() => {/* stats are non-critical, silently ignore */});
  }, []);

  /* ───── fetch tab data when activeTab changes ───── */
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

  /* ───── KPI from stats ───── */
  const kpis = [
    { label: 'Plany RMP',              value: stats?.totalPlans ?? 0,        color: '#A06AE8', icon: <FileText size={18} /> },
    { label: 'Opasnostey',             value: stats?.totalHazards ?? 0,      color: '#F06060', icon: <AlertTriangle size={18} /> },
    { label: 'Mer upravleniya',        value: stats?.totalControls ?? 0,     color: '#4A90E8', icon: <Shield size={18} /> },
    { label: 'Verifitsirovano',        value: stats?.verifiedControls ?? 0,  color: '#2DD4A8', icon: <CheckCircle size={18} /> },
    { label: 'Benefit-Risk analizov',  value: stats?.totalBenefitRisk ?? 0,  color: '#E8A830', icon: <Scale size={18} /> },
  ];

  /* ───── hazard category summary derived from hazards data ───── */
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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'plans',        label: 'Plany RMP',             icon: <FileText size={15} /> },
    { key: 'hazards',      label: 'Analiz opasnostey',     icon: <AlertTriangle size={15} /> },
    { key: 'traceability', label: 'Matritsa proslezh.',    icon: <Link2 size={15} /> },
    { key: 'benefit-risk', label: 'Pol\'za / Risk',        icon: <Scale size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* -- Header -- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(160,106,232,0.12)' }}>
            <ClipboardList className="text-[#A06AE8]" size={24} />
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

      {/* -- KPI Row -- */}
      <KpiRow items={kpis} />

      {/* -- Tabs -- */}
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

      {/* -- Search -- */}
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

      {/* -- Error state -- */}
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

      {/* -- Loading state -- */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-asvo-accent" size={32} />
          <span className="ml-3 text-asvo-text-dim text-sm">Zagruzka...</span>
        </div>
      )}

      {/* -- Content by tab -- */}
      {!loading && activeTab === 'plans' && (
        <>
          <SectionTitle>Plany menedzhmenta riskov (ISO 14971 &sect;4.4)</SectionTitle>
          <DataTable columns={planColumns} data={plans} />
        </>
      )}

      {!loading && activeTab === 'hazards' && (
        <>
          <SectionTitle>Analiz opasnostey (ISO 14971 &sect;5)</SectionTitle>
          <DataTable columns={hazardColumns} data={hazards} />

          {/* Hazard category summary */}
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

      {!loading && activeTab === 'traceability' && (
        <>
          <SectionTitle>Matritsa proslezhivayemosti mer upravleniya (ISO 14971 &sect;7-8)</SectionTitle>
          <p className="text-asvo-text-dim text-xs mb-3">
            Polnaya tsepochka: Opasnost' &rarr; Iskhodnyy risk &rarr; Mera upravleniya &rarr; Verifikatsiya &rarr; Rezidual'nyy risk &rarr; Benefit/Risk
          </p>
          <DataTable columns={traceColumns} data={traceability} />

          {/* Control type priority legend */}
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

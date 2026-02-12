import React, { useState } from 'react';
import {
  FileText, Plus, Shield, AlertTriangle, CheckCircle,
  Search, Eye, ChevronRight, Activity, ClipboardList,
  Scale, Link2,
} from 'lucide-react';
import KpiRow from '../../components/qms/KpiRow';
import ActionBtn from '../../components/qms/ActionBtn';
import Badge from '../../components/qms/Badge';
import DataTable from '../../components/qms/DataTable';
import SectionTitle from '../../components/qms/SectionTitle';

/* ───── types ───── */
type RmpStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'EFFECTIVE' | 'REVISION' | 'ARCHIVED';
type HazardStatus = 'IDENTIFIED' | 'ANALYZED' | 'CONTROLLED' | 'VERIFIED' | 'ACCEPTED' | 'MONITORING';
type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ControlType = 'INHERENT_SAFETY' | 'PROTECTIVE' | 'INFORMATION';

interface PlanRow {
  id: string;
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
  id: string;
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

const TRACE_MATRIX: TraceRow[] = [
  { id: '1', hazardNum: 'HAZ-001', hazardDesc: 'Elektricheskiy udar', initialRisk: 'HIGH (2x5=10)', controlType: 'INHERENT_SAFETY', controlDesc: 'Dvoinaya izolyatsiya IEC 60601-1', verifResult: 'PASS', residualRisk: 'LOW (1x5=5)', braResult: '-' },
  { id: '2', hazardNum: 'HAZ-002', hazardDesc: 'Oshibka SpO2', initialRisk: 'HIGH (3x4=12)', controlType: 'PROTECTIVE', controlDesc: 'Alarmy pri otkloneniyakh > 3%', verifResult: 'PASS', residualRisk: 'MEDIUM (2x4=8)', braResult: 'Pol\'za > Risk' },
  { id: '3', hazardNum: 'HAZ-004', hazardDesc: 'Oshibka podklyucheniya', initialRisk: 'CRITICAL (4x4=16)', controlType: 'INFORMATION', controlDesc: 'Tsvetovaya markirovka + IFU', verifResult: 'PASS', residualRisk: 'MEDIUM (2x4=8)', braResult: 'Pol\'za > Risk' },
  { id: '4', hazardNum: 'HAZ-004', hazardDesc: 'Oshibka podklyucheniya', initialRisk: 'CRITICAL (4x4=16)', controlType: 'INHERENT_SAFETY', controlDesc: 'Assimetrichniy raz\'yom', verifResult: 'PASS', residualRisk: 'MEDIUM (2x4=8)', braResult: '-' },
];

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

/* ───── tabs ───── */
type TabKey = 'plans' | 'hazards' | 'traceability' | 'benefit-risk';

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

  /* ───── KPI ───── */
  const kpis = [
    { label: 'Plany RMP',              value: 3,  color: '#A06AE8', icon: <FileText size={18} /> },
    { label: 'Opasnostey',             value: 49, color: '#F06060', icon: <AlertTriangle size={18} /> },
    { label: 'Mer upravleniya',        value: 87, color: '#4A90E8', icon: <Shield size={18} /> },
    { label: 'Verifitsirovano',        value: 64, color: '#2DD4A8', icon: <CheckCircle size={18} /> },
    { label: 'Benefit-Risk analizov',  value: 12, color: '#E8A830', icon: <Scale size={18} /> },
  ];

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'plans',        label: 'Plany RMP',             icon: <FileText size={15} /> },
    { key: 'hazards',      label: 'Analiz opasnostey',     icon: <AlertTriangle size={15} /> },
    { key: 'traceability', label: 'Matritsa proslezh.',    icon: <Link2 size={15} /> },
    { key: 'benefit-risk', label: 'Pol\'za / Risk',        icon: <Scale size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ── */}
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

      {/* ── KPI Row ── */}
      <KpiRow items={kpis} />

      {/* ── Tabs ── */}
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

      {/* ── Search ── */}
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

      {/* ── Content by tab ── */}
      {activeTab === 'plans' && (
        <>
          <SectionTitle>Plany menedzhmenta riskov (ISO 14971 &sect;4.4)</SectionTitle>
          <DataTable columns={planColumns} data={PLANS} />
        </>
      )}

      {activeTab === 'hazards' && (
        <>
          <SectionTitle>Analiz opasnostey (ISO 14971 &sect;5)</SectionTitle>
          <DataTable columns={hazardColumns} data={HAZARDS} />

          {/* Hazard category summary */}
          <SectionTitle>Opasnosti po kategoriyam</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { cat: 'ENERGY', count: 4, color: '#F06060' },
              { cat: 'SOFTWARE', count: 6, color: '#A06AE8' },
              { cat: 'MECHANICAL', count: 3, color: '#E87040' },
              { cat: 'USE_ERROR', count: 8, color: '#E8A830' },
              { cat: 'ELECTROMAGNETIC', count: 3, color: '#4A90E8' },
              { cat: 'BIOLOGICAL', count: 2, color: '#36B5E0' },
            ].map(item => (
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

      {activeTab === 'traceability' && (
        <>
          <SectionTitle>Matritsa proslezhivayemosti mer upravleniya (ISO 14971 &sect;7-8)</SectionTitle>
          <p className="text-asvo-text-dim text-xs mb-3">
            Polnaya tsepochka: Opasnost' &rarr; Iskhodnyy risk &rarr; Mera upravleniya &rarr; Verifikatsiya &rarr; Rezidual'nyy risk &rarr; Benefit/Risk
          </p>
          <DataTable columns={traceColumns} data={TRACE_MATRIX} />

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

      {activeTab === 'benefit-risk' && (
        <>
          <SectionTitle>Analiz pol'zy/riska (ISO 14971 &sect;6.5)</SectionTitle>
          <p className="text-asvo-text-dim text-xs mb-3">
            Otsenka obosnovannosti ostatochnogo riska s tochki zreniya klinicheskoy pol'zy
          </p>

          <div className="space-y-3">
            {[
              {
                id: 'BRA-001',
                hazard: 'HAZ-002 — Oshibka SpO2',
                residualRisk: 'MEDIUM',
                benefit: 'Nepreryvnyy monitoring SpO2 dlya rannego obnaruzheniya gipoksii',
                conclusion: 'Klinicheskaya pol\'za (ranneye obnaruzheniye gipoksii) znachitel\'no prevyshayet rezidual\'nyy risk oshibki +/- 3%',
                outweighs: true,
              },
              {
                id: 'BRA-002',
                hazard: 'HAZ-004 — Nepravil\'noye podklyucheniye',
                residualRisk: 'MEDIUM',
                benefit: 'Nepreryvnyy monitoring EKG dlya diagnostiki aritmiy',
                conclusion: 'Pol\'za EKG-monitoringa kriticheskikh patsiyentov prevyshayet risk pri uslovii informirovaniya',
                outweighs: true,
              },
              {
                id: 'BRA-003',
                hazard: 'HAZ-007 — Peregrev termoprintera',
                residualRisk: 'HIGH',
                benefit: 'Pechat\' EKG na meste',
                conclusion: 'Pol\'za pechati ne pereveshivayet risk ozhoga — trebuyetsya dopolnitel\'naya mera',
                outweighs: false,
              },
            ].map(bra => (
              <div
                key={bra.id}
                className="bg-asvo-surface border border-asvo-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-asvo-accent text-sm">{bra.id}</span>
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

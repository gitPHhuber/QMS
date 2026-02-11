import React from 'react';
import {
  Truck, Plus, Search, Award, ShieldCheck, FileText,
  Clock, Headphones, BadgeCheck, Package,
} from 'lucide-react';
import KpiRow from '../../components/qms/KpiRow';
import ActionBtn from '../../components/qms/ActionBtn';
import Badge from '../../components/qms/Badge';
import DataTable from '../../components/qms/DataTable';
import SectionTitle from '../../components/qms/SectionTitle';
import ProgressBar from '../../components/qms/ProgressBar';

/* ───── types ───── */
interface SupplierRow {
  id: string;
  name: string;
  category: string;
  rating: number;
  status: string;
  lastAudit: string;
  certs: string;
  [key: string]: unknown;
}

/* ───── mock data ───── */
const SUPPLIERS: SupplierRow[] = [
  { id: 'SUP-001', name: 'ООО "Резонанс"',         category: 'Компоненты',  rating: 92, status: 'Одобрен',       lastAudit: '15.01.2026', certs: 'ISO 9001' },
  { id: 'SUP-003', name: 'АО "ПКБ Электро"',       category: 'PCB',         rating: 85, status: 'Одобрен',       lastAudit: '20.12.2025', certs: 'ISO 9001, IPC' },
  { id: 'SUP-005', name: 'ИП Волков',               category: 'Крепёж',      rating: 67, status: 'Условный',      lastAudit: '10.11.2025', certs: '\u2014' },
  { id: 'SUP-007', name: 'ООО "МетаПласт"',         category: 'Корпуса',     rating: 78, status: 'Одобрен',       lastAudit: '05.01.2026', certs: 'ISO 9001' },
  { id: 'SUP-012', name: 'Shenzhen Sensors Co.',     category: 'Датчики',     rating: 45, status: 'Заблокирован', lastAudit: '01.09.2025', certs: '\u2014' },
  { id: 'SUP-015', name: 'ООО "КалибрПро"',         category: 'Калибровка',  rating: 91, status: 'Одобрен',       lastAudit: '20.01.2026', certs: 'ISO 17025' },
];

/* ───── badge helpers ───── */
const statusMap: Record<string, { color: string; bg: string }> = {
  'Одобрен':       { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  'Условный':      { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  'Заблокирован':  { color: '#F06060', bg: 'rgba(240,96,96,0.14)' },
  'Новый':         { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
};

const categoryMap: Record<string, { color: string; bg: string }> = {
  'Компоненты':  { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  'PCB':         { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  'Крепёж':      { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  'Корпуса':     { color: '#E87040', bg: 'rgba(232,112,64,0.14)' },
  'Датчики':     { color: '#F06060', bg: 'rgba(240,96,96,0.14)' },
  'Калибровка':  { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
};

/** ProgressBar color based on rating */
const barColor = (v: number) => {
  if (v >= 80) return 'green' as const;
  if (v >= 60) return 'amber' as const;
  return 'red' as const;
};

/* ───── table columns ───── */
const columns = [
  {
    key: 'id',
    label: 'ID',
    width: '90px',
    render: (r: SupplierRow) => <span className="font-mono text-asvo-accent">{r.id}</span>,
  },
  {
    key: 'name',
    label: 'Название',
    render: (r: SupplierRow) => <span className="text-asvo-text">{r.name}</span>,
  },
  {
    key: 'category',
    label: 'Категория',
    align: 'center' as const,
    render: (r: SupplierRow) => {
      const c = categoryMap[r.category];
      return <Badge color={c?.color} bg={c?.bg}>{r.category}</Badge>;
    },
  },
  {
    key: 'rating',
    label: 'Рейтинг',
    width: '140px',
    render: (r: SupplierRow) => (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <ProgressBar value={r.rating} color={barColor(r.rating)} />
          <span className="ml-2 text-asvo-text font-semibold whitespace-nowrap">{r.rating}%</span>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Статус',
    align: 'center' as const,
    render: (r: SupplierRow) => {
      const c = statusMap[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{r.status}</Badge>;
    },
  },
  {
    key: 'lastAudit',
    label: 'Последний аудит',
    render: (r: SupplierRow) => <span className="text-asvo-text-mid">{r.lastAudit}</span>,
  },
  {
    key: 'certs',
    label: 'Сертификаты',
    render: (r: SupplierRow) => <span className="text-asvo-text-mid">{r.certs}</span>,
  },
];

/* ───── evaluation criteria ───── */
interface Criterion {
  label: string;
  weight: string;
  color: string;
  icon: React.ReactNode;
}

const CRITERIA: Criterion[] = [
  { label: 'Качество продукции', weight: '30%', color: '#2DD4A8', icon: <Award size={18} /> },
  { label: 'Сроки поставки',    weight: '20%', color: '#4A90E8', icon: <Clock size={18} /> },
  { label: 'Цена',              weight: '15%', color: '#E8A830', icon: <Package size={18} /> },
  { label: 'Документация',      weight: '15%', color: '#A06AE8', icon: <FileText size={18} /> },
  { label: 'Сервис',            weight: '10%', color: '#E87040', icon: <Headphones size={18} /> },
  { label: 'Сертификация',      weight: '10%', color: '#2DD4A8', icon: <BadgeCheck size={18} /> },
];

/* ════════════════════════════════════════════════════ */

const SuppliersPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  const filtered = SUPPLIERS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()),
  );

  /* ───── KPI ───── */
  const kpis = [
    { label: 'Всего поставщиков', value: 28,     color: '#4A90E8', icon: <Truck size={18} /> },
    { label: 'Одобренных',        value: 22,     color: '#2DD4A8', icon: <ShieldCheck size={18} /> },
    { label: 'На аудите',         value: 3,      color: '#E8A830', icon: <Search size={18} /> },
    { label: 'Заблокированных',   value: 2,      color: '#F06060', icon: <Package size={18} /> },
    { label: 'Средний рейтинг',   value: '78%',  color: '#2DD4A8', icon: <Award size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(74,144,232,0.12)' }}>
            <Truck className="text-[#4A90E8]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Поставщики</h1>
            <p className="text-asvo-text-dim text-sm">ISO 13485 &sect;7.4 &mdash; Управление поставщиками</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn icon={<Plus size={15} />}>Новый поставщик</ActionBtn>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <KpiRow items={kpis} />

      {/* ── Search ── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ID или названию..."
            className="w-full pl-10 pr-4 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable columns={columns} data={filtered} />

      {/* ── Evaluation Criteria ── */}
      <SectionTitle>Критерии оценки поставщиков</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CRITERIA.map((c) => (
          <div
            key={c.label}
            className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-3 flex items-center gap-3"
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: `${c.color}18` }}
            >
              <span style={{ color: c.color }}>{c.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-asvo-text font-medium truncate">{c.label}</div>
            </div>
            <div className="text-sm font-bold" style={{ color: c.color }}>{c.weight}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuppliersPage;

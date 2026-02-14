import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Award, ShieldCheck, FileText,
  Clock, Headphones, BadgeCheck, Package, Loader2, AlertCircle,
} from 'lucide-react';
import KpiRow from '../../components/qms/KpiRow';
import ActionBtn from '../../components/qms/ActionBtn';
import Badge from '../../components/qms/Badge';
import DataTable from '../../components/qms/DataTable';
import SectionTitle from '../../components/qms/SectionTitle';
import ProgressBar from '../../components/qms/ProgressBar';
import { suppliersApi } from '../../api/qmsApi';
import CreateSupplierModal from './CreateSupplierModal';
import SupplierDetailModal from './SupplierDetailModal';

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
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailSupplierId, setDetailSupplierId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [suppliersRes, statsRes] = await Promise.all([
        suppliersApi.getAll(),
        suppliersApi.getStats(),
      ]);

      setSuppliers(suppliersRes.rows ?? []);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = suppliers.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).toLowerCase().includes(search.toLowerCase()),
  );

  /* ───── KPI ───── */
  const kpis = [
    { label: 'Всего поставщиков', value: stats?.totalSuppliers ?? 0,    color: '#4A90E8', icon: <Truck size={18} /> },
    { label: 'Одобренных',        value: stats?.approved ?? 0,          color: '#2DD4A8', icon: <ShieldCheck size={18} /> },
    { label: 'На аудите',         value: stats?.onAudit ?? 0,           color: '#E8A830', icon: <Search size={18} /> },
    { label: 'Заблокированных',   value: stats?.blocked ?? 0,           color: '#F06060', icon: <Package size={18} /> },
    { label: 'Средний рейтинг',   value: stats?.averageRating != null ? `${stats.averageRating}%` : '—', color: '#2DD4A8', icon: <Award size={18} /> },
  ];

  /* ───── loading state ───── */
  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-asvo-accent" size={36} />
          <span className="text-asvo-text-mid text-sm">Загрузка данных поставщиков...</span>
        </div>
      </div>
    );
  }

  /* ───── error state ───── */
  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="p-3 rounded-full bg-[rgba(240,96,96,0.14)]">
            <AlertCircle className="text-[#F06060]" size={32} />
          </div>
          <h2 className="text-lg font-semibold text-asvo-text">Ошибка загрузки</h2>
          <p className="text-asvo-text-mid text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-asvo-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

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
          <ActionBtn icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>Новый поставщик</ActionBtn>
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
      <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetailSupplierId(Number(row.id))} />

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

      {/* ── Modals ── */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchData()}
      />

      {detailSupplierId !== null && (
        <SupplierDetailModal
          supplierId={detailSupplierId}
          isOpen={detailSupplierId !== null}
          onClose={() => setDetailSupplierId(null)}
          onAction={() => fetchData()}
        />
      )}
    </div>
  );
};

export default SuppliersPage;

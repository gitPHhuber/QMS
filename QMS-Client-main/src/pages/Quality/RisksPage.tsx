import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Grid3X3, Download, AlertTriangle,
  Search, TrendingUp, Loader2,
} from 'lucide-react';
import KpiRow from '../../components/qms/KpiRow';
import ActionBtn from '../../components/qms/ActionBtn';
import Badge from '../../components/qms/Badge';
import DataTable from '../../components/qms/DataTable';
import SectionTitle from '../../components/qms/SectionTitle';
import { risksApi } from '../../api/qmsApi';
import CreateRiskModal from './CreateRiskModal';
import RiskDetailModal from './RiskDetailModal';

/* ───── types ───── */
interface RiskRow {
  id: string;
  title: string;
  category: string;
  p: number;
  s: number;
  level: number;
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner: string;
  status: string;
  [key: string]: unknown;
}

const severityLabels = ['1-Незначит.', '2-Малая', '3-Средняя', '4-Значит.', '5-Катастроф.'];

/** color of a cell based on P×S value */
const cellColor = (val: number): string => {
  if (val <= 4)  return 'bg-[#2DD4A8]/20 text-[#2DD4A8]';
  if (val <= 9)  return 'bg-[#E8A830]/20 text-[#E8A830]';
  if (val <= 16) return 'bg-[#E87040]/20 text-[#E87040]';
  return 'bg-[#F06060]/20 text-[#F06060]';
};

/* ───── risk class badge colors ───── */
const classColors: Record<string, { color: string; bg: string }> = {
  LOW:      { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  MEDIUM:   { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  HIGH:     { color: '#E87040', bg: 'rgba(232,112,64,0.14)' },
  CRITICAL: { color: '#F06060', bg: 'rgba(240,96,96,0.14)' },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  'Оценка':     { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  'Мониторинг': { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  'Обработка':  { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  'Снижен':     { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  'Принят':     { color: '#3A4E62', bg: 'rgba(58,78,98,0.15)' },
};

/* ───── table columns ───── */
const columns = [
  {
    key: 'id',
    label: 'ID',
    width: '80px',
    render: (r: RiskRow) => <span className="font-mono text-asvo-accent">{r.id}</span>,
  },
  {
    key: 'title',
    label: 'Название',
    render: (r: RiskRow) => <span className="text-asvo-text">{r.title}</span>,
  },
  {
    key: 'category',
    label: 'Категория',
    render: (r: RiskRow) => <span className="text-asvo-text-mid">{r.category}</span>,
  },
  {
    key: 'level',
    label: 'P\u00d7S=\u0423\u0440\u043e\u0432\u0435\u043d\u044c',
    align: 'center' as const,
    render: (r: RiskRow) => (
      <span className="text-asvo-text font-mono text-xs">{r.p}&times;{r.s}={r.level}</span>
    ),
  },
  {
    key: 'riskClass',
    label: 'Класс риска',
    align: 'center' as const,
    render: (r: RiskRow) => {
      const c = classColors[r.riskClass];
      return <Badge color={c?.color} bg={c?.bg}>{r.riskClass}</Badge>;
    },
  },
  {
    key: 'owner',
    label: 'Владелец',
    render: (r: RiskRow) => <span className="text-asvo-text-mid">{r.owner}</span>,
  },
  {
    key: 'status',
    label: 'Статус',
    align: 'center' as const,
    render: (r: RiskRow) => {
      const c = statusColors[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{r.status}</Badge>;
    },
  },
];

/* ════════════════════════════════════════════════════ */

const RisksPage: React.FC = () => {
  const [showMatrix, setShowMatrix] = useState(true);
  const [search, setSearch] = useState('');

  /* ───── API state ───── */
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [matrixCounts, setMatrixCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ───── Modal state ───── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailRiskId, setDetailRiskId] = useState<number | null>(null);

  /* ───── Fetch data on mount ───── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [risksRes, statsRes, matrixRes] = await Promise.all([
        risksApi.getAll(),
        risksApi.getStats(),
        risksApi.getMatrix(),
      ]);
      setRisks(risksRes.rows ?? []);
      setStats(statsRes);
      setMatrixCounts(matrixRes.cellCounts ?? {});
    } catch (e: any) {
      console.error('RisksPage fetch error:', e);
      setError(e?.response?.data?.message || 'Ошибка загрузки реестра рисков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = risks.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toString().toLowerCase().includes(search.toLowerCase()),
  );

  /* ───── KPI from stats ───── */
  const kpis = [
    { label: 'Всего рисков',         value: stats?.total       ?? 0, color: '#A06AE8', icon: <Shield size={18} /> },
    { label: 'Критических',           value: stats?.byClass?.CRITICAL ?? 0, color: '#F06060', icon: <AlertTriangle size={18} /> },
    { label: 'Высоких',               value: stats?.byClass?.HIGH     ?? 0, color: '#E87040', icon: <TrendingUp size={18} /> },
    { label: 'Низких / Приемлемых',   value: (stats?.byClass?.LOW ?? 0) + (stats?.byClass?.MEDIUM ?? 0), color: '#2DD4A8', icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(160,106,232,0.12)' }}>
            <Shield className="text-[#A06AE8]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Реестр рисков</h1>
            <p className="text-asvo-text-dim text-sm">ISO 14971 / ISO 13485 &sect;7.1 &mdash; Управление рисками</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>Новый риск</ActionBtn>
          <ActionBtn variant="secondary" color="#A06AE8" icon={<Grid3X3 size={15} />} onClick={() => setShowMatrix((v) => !v)}>
            Матрица рисков
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />} disabled title="Будет доступно в следующем спринте">Экспорт</ActionBtn>
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

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-asvo-accent" size={32} />
          <span className="ml-3 text-asvo-text-dim text-sm">Загрузка рисков...</span>
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="bg-[#F06060]/10 border border-[#F06060]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-[#F06060] shrink-0" size={20} />
          <span className="text-[#F06060] text-sm">{error}</span>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetailRiskId(Number(row.id))} />
      )}

      {/* ── 5×5 Risk Matrix ── */}
      {showMatrix && (
        <>
          <SectionTitle>Матрица рисков 5 &times; 5</SectionTitle>

          <div className="bg-asvo-surface border border-asvo-border rounded-xl p-4 overflow-x-auto">
            <div className="grid grid-cols-6 gap-1.5 min-w-[480px]">
              {/* header row */}
              <div className="min-h-[40px] rounded flex items-center justify-center text-[10px] font-bold text-asvo-text-dim uppercase">
                P \ S
              </div>
              {severityLabels.map((lbl) => (
                <div
                  key={lbl}
                  className="min-h-[40px] rounded flex items-center justify-center text-[10px] font-bold text-asvo-text-mid"
                >
                  {lbl}
                </div>
              ))}

              {/* rows 5→1 */}
              {[5, 4, 3, 2, 1].map((p) => (
                <React.Fragment key={p}>
                  {/* probability label */}
                  <div className="min-h-[40px] rounded flex items-center justify-center text-xs font-bold text-asvo-text-mid">
                    {p}
                  </div>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const val = p * s;
                    const cnt = matrixCounts[`${p}-${s}`] ?? 0;
                    return (
                      <div
                        key={`${p}-${s}`}
                        className={`min-h-[40px] rounded flex items-center justify-center text-xs font-bold ${cellColor(val)}`}
                      >
                        {cnt > 0 ? cnt : val}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Modals */}
      <CreateRiskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />

      {detailRiskId !== null && (
        <RiskDetailModal
          riskId={detailRiskId}
          isOpen={true}
          onClose={() => setDetailRiskId(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
};

export default RisksPage;

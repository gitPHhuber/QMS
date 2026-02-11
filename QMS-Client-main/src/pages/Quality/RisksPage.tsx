import React, { useEffect, useState } from 'react';
import { Shield, Plus, Search, AlertTriangle } from 'lucide-react';
import { risksApi } from '../../api/qmsApi';

interface RiskItem {
  id: number;
  riskNumber: string;
  title: string;
  category: string;
  initialProbability: number;
  initialSeverity: number;
  initialRiskLevel: number;
  initialRiskClass: string;
  residualRiskClass: string | null;
  status: string;
  owner?: { id: number; name: string; surname: string };
}

const riskClassColor: Record<string, string> = {
  LOW: 'bg-green-900/40 text-green-400 border-green-700/50',
  MEDIUM: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50',
  HIGH: 'bg-orange-900/40 text-orange-400 border-orange-700/50',
  CRITICAL: 'bg-red-900/40 text-red-400 border-red-700/50',
};

const statusColor: Record<string, string> = {
  IDENTIFIED: 'bg-blue-900/40 text-blue-400',
  ASSESSED: 'bg-purple-900/40 text-purple-400',
  MITIGATED: 'bg-teal-900/40 text-teal-400',
  ACCEPTED: 'bg-green-900/40 text-green-400',
  CLOSED: 'bg-slate-700/40 text-slate-400',
  MONITORING: 'bg-yellow-900/40 text-yellow-400',
};

const RisksPage: React.FC = () => {
  const [items, setItems] = useState<RiskItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'PROCESS', initialProbability: 3, initialSeverity: 3 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        risksApi.getAll(),
        risksApi.getStats(),
      ]);
      setItems(itemsData.rows || []);
      setStats(statsData);
    } catch (e) {
      console.error('RisksPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await risksApi.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'PROCESS', initialProbability: 3, initialSeverity: 3 });
      await loadData();
    } catch (e) {
      console.error('Create risk error:', e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.riskNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Shield className="text-red-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Реестр рисков</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;7.1 &mdash; Управление рисками</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Новый риск
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
            <div className="text-xs text-slate-400">Всего рисков</div>
          </div>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(cls => (
            <div key={cls} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-100">{stats.byClass?.[cls] || 0}</div>
              <div className="text-xs text-slate-400">{cls}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру или названию..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">&#8470;</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Название</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Категория</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">P&times;S</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Класс</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Владелец</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Нет данных</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-teal-400">{item.riskNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{item.title}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.category}</td>
                <td className="px-4 py-3 text-sm text-center text-slate-200">{item.initialProbability}&times;{item.initialSeverity}={item.initialRiskLevel}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${riskClassColor[item.initialRiskClass] || 'text-slate-400'}`}>
                    {item.initialRiskClass}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.owner ? `${item.owner.surname} ${item.owner.name}` : '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[item.status] || 'text-slate-400'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Новый риск</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Название риска" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <textarea placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none h-20 resize-none" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                {['PRODUCT', 'PROCESS', 'SUPPLIER', 'REGULATORY', 'INFRASTRUCTURE', 'HUMAN', 'CYBER'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Вероятность (1-5)</label>
                  <input type="number" min={1} max={5} value={form.initialProbability} onChange={e => setForm({ ...form, initialProbability: +e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Серьезность (1-5)</label>
                  <input type="number" min={1} max={5} value={form.initialSeverity} onChange={e => setForm({ ...form, initialSeverity: +e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !form.title} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RisksPage;

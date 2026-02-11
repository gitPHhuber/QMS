import React, { useEffect, useState } from 'react';
import { Truck, Plus, Search, Star, AlertTriangle } from 'lucide-react';
import { suppliersApi } from '../../api/qmsApi';

interface Supplier {
  id: number;
  code: string;
  name: string;
  category: string;
  criticality: string;
  qualificationStatus: string;
  overallScore: number | null;
  nextEvaluationDate: string | null;
  evaluations?: Array<{ evaluationDate: string; totalScore: number }>;
}

const criticalityColor: Record<string, string> = {
  CRITICAL: 'bg-red-900/40 text-red-400 border-red-700/50',
  MAJOR: 'bg-orange-900/40 text-orange-400 border-orange-700/50',
  MINOR: 'bg-green-900/40 text-green-400 border-green-700/50',
};

const qualStatusColor: Record<string, string> = {
  QUALIFIED: 'bg-green-900/40 text-green-400',
  PENDING: 'bg-yellow-900/40 text-yellow-400',
  CONDITIONAL: 'bg-orange-900/40 text-orange-400',
  SUSPENDED: 'bg-red-900/40 text-red-400',
  DISQUALIFIED: 'bg-slate-700/40 text-slate-400',
};

const SuppliersPage: React.FC = () => {
  const [items, setItems] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', legalName: '', category: 'COMPONENT', criticality: 'MAJOR', contactPerson: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        suppliersApi.getAll(),
        suppliersApi.getStats(),
      ]);
      setItems(itemsData.rows || []);
      setStats(statsData);
    } catch (e) {
      console.error('SuppliersPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await suppliersApi.create(form);
      setShowCreate(false);
      setForm({ name: '', legalName: '', category: 'COMPONENT', criticality: 'MAJOR', contactPerson: '', email: '', phone: '' });
      await loadData();
    } catch (e) {
      console.error('Create supplier error:', e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Truck className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Поставщики</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;7.4 &mdash; Управление поставщиками</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Новый поставщик
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Всего', value: stats.total, color: 'text-slate-100' },
            { label: 'Квалифицированы', value: stats.qualified, color: 'text-green-400' },
            { label: 'На рассмотрении', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Приостановлены', value: stats.suspended, color: 'text-red-400' },
            { label: 'Критичные', value: stats.critical, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по коду или названию..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Код</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Название</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Категория</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Критичность</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Квалификация</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Скор</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Оценка</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Нет данных</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-teal-400">{item.code}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{item.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${criticalityColor[item.criticality] || 'text-slate-400'}`}>
                    {item.criticality}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${qualStatusColor[item.qualificationStatus] || 'text-slate-400'}`}>
                    {item.qualificationStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {item.overallScore != null ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star size={12} className={item.overallScore >= 80 ? 'text-green-400' : item.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'} />
                      <span className="text-slate-200">{item.overallScore}</span>
                    </div>
                  ) : <span className="text-slate-500">-</span>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {item.evaluations?.[0]?.evaluationDate ? new Date(item.evaluations[0].evaluationDate).toLocaleDateString('ru') : '-'}
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
            <h2 className="text-lg font-bold text-slate-100">Новый поставщик</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Наименование" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <input type="text" placeholder="Юридическое название" value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                  {['RAW_MATERIAL', 'COMPONENT', 'SERVICE', 'EQUIPMENT', 'PACKAGING', 'SOFTWARE', 'SUBCONTRACTOR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                  {['CRITICAL', 'MAJOR', 'MINOR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input type="text" placeholder="Контактное лицо" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                <input type="text" placeholder="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !form.name} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;

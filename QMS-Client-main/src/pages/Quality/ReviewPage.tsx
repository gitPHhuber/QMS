import React, { useEffect, useState } from 'react';
import { BarChart3, Plus, Search, Calendar, CheckCircle2 } from 'lucide-react';
import { reviewsApi } from '../../api/qmsApi';

interface ReviewItem {
  id: number;
  reviewNumber: string;
  title: string;
  reviewDate: string;
  periodFrom: string;
  periodTo: string;
  status: string;
  qmsEffectiveness: string | null;
  actions?: Array<any>;
}

const statusColor: Record<string, string> = {
  PLANNED: 'bg-blue-900/40 text-blue-400',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-400',
  COMPLETED: 'bg-green-900/40 text-green-400',
  APPROVED: 'bg-teal-900/40 text-teal-400',
};

const effectivenessColor: Record<string, string> = {
  EFFECTIVE: 'text-green-400',
  PARTIALLY_EFFECTIVE: 'text-yellow-400',
  INEFFECTIVE: 'text-red-400',
};

const ReviewPage: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', reviewDate: '', periodFrom: '', periodTo: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        reviewsApi.getAll(),
        reviewsApi.getStats(),
      ]);
      setItems(itemsData.rows || []);
      setStats(statsData);
    } catch (e) {
      console.error('ReviewPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await reviewsApi.create(form);
      setShowCreate(false);
      setForm({ title: '', reviewDate: '', periodFrom: '', periodTo: '' });
      await loadData();
    } catch (e) {
      console.error('Create review error:', e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.reviewNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <BarChart3 className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Анализ со стороны руководства</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;5.6 &mdash; Management Review</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Новое совещание
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всего совещаний', value: stats.totalReviews, color: 'text-slate-100' },
            { label: 'Завершено', value: stats.completed, color: 'text-green-400' },
            { label: 'Всего решений', value: stats.totalActions, color: 'text-blue-400' },
            { label: 'Просроч. решений', value: stats.overdueActions, color: 'text-red-400' },
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру или теме..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">&#8470;</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Тема</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Дата</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Период</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Эффективность</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Решений</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Нет данных</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-teal-400">{item.reviewNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{item.title}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    {item.reviewDate ? new Date(item.reviewDate).toLocaleDateString('ru') : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {item.periodFrom && item.periodTo
                    ? `${new Date(item.periodFrom).toLocaleDateString('ru')} - ${new Date(item.periodTo).toLocaleDateString('ru')}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[item.status] || 'text-slate-400'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.qmsEffectiveness ? (
                    <span className={`text-sm font-medium ${effectivenessColor[item.qmsEffectiveness] || 'text-slate-400'}`}>
                      {item.qmsEffectiveness}
                    </span>
                  ) : <span className="text-slate-500">-</span>}
                </td>
                <td className="px-4 py-3 text-sm text-center text-slate-300">{item.actions?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Новое совещание руководства</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Тема совещания" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Дата совещания</label>
                  <input type="date" value={form.reviewDate} onChange={e => setForm({ ...form, reviewDate: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Период с</label>
                  <input type="date" value={form.periodFrom} onChange={e => setForm({ ...form, periodFrom: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Период по</label>
                  <input type="date" value={form.periodTo} onChange={e => setForm({ ...form, periodTo: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
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

export default ReviewPage;

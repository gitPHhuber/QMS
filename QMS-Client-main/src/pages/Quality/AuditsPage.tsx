import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, Search, Calendar } from 'lucide-react';
import { internalAuditsApi } from '../../api/qmsApi';

interface AuditScheduleItem {
  id: number;
  auditNumber: string;
  title: string;
  scope: string;
  isoClause: string;
  plannedDate: string;
  actualDate: string | null;
  status: string;
  findings?: Array<any>;
  auditPlan?: { id: number; title: string; year: number };
}

const statusColor: Record<string, string> = {
  PLANNED: 'bg-blue-900/40 text-blue-400',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-400',
  COMPLETED: 'bg-green-900/40 text-green-400',
  CANCELLED: 'bg-slate-700/40 text-slate-400',
  OVERDUE: 'bg-red-900/40 text-red-400',
};

interface AuditPlanItem {
  id: number;
  title: string;
  year: number;
  status: string;
}

const AuditsPage: React.FC = () => {
  const [schedules, setSchedules] = useState<AuditScheduleItem[]>([]);
  const [plans, setPlans] = useState<AuditPlanItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', scope: '', isoClause: '', plannedDate: '', auditPlanId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, statsData, plansData] = await Promise.all([
        internalAuditsApi.getSchedules(),
        internalAuditsApi.getStats(),
        internalAuditsApi.getPlans(),
      ]);
      setSchedules(schedulesData.rows || []);
      setStats(statsData);
      setPlans(plansData.rows || []);
    } catch (e) {
      console.error('AuditsPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.auditPlanId) return;
    try {
      setCreating(true);
      const data: any = {
        title: form.title,
        scope: form.scope,
        isoClause: form.isoClause,
        plannedDate: form.plannedDate,
        auditPlanId: parseInt(form.auditPlanId),
      };
      await internalAuditsApi.createSchedule(data);
      setShowCreate(false);
      setForm({ title: '', scope: '', isoClause: '', plannedDate: '', auditPlanId: '' });
      await loadData();
    } catch (e) {
      console.error('Create audit error:', e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = schedules.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.auditNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.scope?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <ClipboardCheck className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Внутренние аудиты</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;8.2.4 &mdash; Программа аудитов</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Новый аудит
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всего аудитов', value: stats.totalAudits, color: 'text-slate-100' },
            { label: 'Завершено', value: stats.completedAudits, color: 'text-green-400' },
            { label: 'Просрочено', value: stats.overdueAudits, color: 'text-red-400' },
            { label: 'Открытых замечаний', value: stats.openFindings, color: 'text-yellow-400' },
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру, теме или области..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">&#8470; аудита</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Тема</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Область</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">ISO</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Дата</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Замечаний</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Нет данных</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-teal-400">{item.auditNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{item.title}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.scope}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{item.isoClause}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    {item.plannedDate ? new Date(item.plannedDate).toLocaleDateString('ru') : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[item.status] || 'text-slate-400'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center text-slate-300">{item.findings?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Новый аудит</h2>
            <div className="space-y-3">
              <select value={form.auditPlanId} onChange={e => setForm({ ...form, auditPlanId: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                <option value="">Выберите план аудита</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.title} ({p.year})</option>)}
              </select>
              <input type="text" placeholder="Тема аудита" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <input type="text" placeholder="Область аудита" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="ISO пункт (напр. 7.4)" value={form.isoClause} onChange={e => setForm({ ...form, isoClause: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                <input type="date" value={form.plannedDate} onChange={e => setForm({ ...form, plannedDate: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !form.title || !form.auditPlanId} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditsPage;

import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { trainingApi } from '../../api/qmsApi';

interface TrainingRecord {
  id: number;
  title: string;
  type: string;
  trainingDate: string;
  assessmentScore: number | null;
  passed: boolean | null;
  status: string;
  trainee?: { id: number; name: string; surname: string };
  trainingPlan?: { id: number; title: string; year: number };
}

const statusColor: Record<string, string> = {
  PLANNED: 'bg-blue-900/40 text-blue-400',
  COMPLETED: 'bg-green-900/40 text-green-400',
  FAILED: 'bg-red-900/40 text-red-400',
  EXPIRED: 'bg-orange-900/40 text-orange-400',
};

const typeLabels: Record<string, string> = {
  ONBOARDING: 'Адаптация',
  PROCEDURE: 'Процедуры',
  EQUIPMENT: 'Оборудование',
  GMP: 'GMP',
  SAFETY: 'Безопасность',
  REGULATORY: 'Регуляторные',
  SOFTWARE: 'ПО',
  RETRAINING: 'Переподготовка',
};

const TrainingPage: React.FC = () => {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'PROCEDURE', trainingDate: '', userId: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsData, statsData] = await Promise.all([
        trainingApi.getRecords(),
        trainingApi.getStats(),
      ]);
      setRecords(recordsData.rows || []);
      setStats(statsData);
    } catch (e) {
      console.error('TrainingPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const data: any = { ...form };
      if (data.userId) data.userId = parseInt(data.userId);
      await trainingApi.createRecord(data);
      setShowCreate(false);
      setForm({ title: '', type: 'PROCEDURE', trainingDate: '', userId: '', description: '' });
      await loadData();
    } catch (e) {
      console.error('Create training error:', e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = records.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.trainee?.surname?.toLowerCase().includes(search.toLowerCase()) ||
    i.trainee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <GraduationCap className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Обучение персонала</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;6.2 &mdash; Компетентность и обучение</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Новая запись
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всего записей', value: stats.totalRecords, color: 'text-slate-100' },
            { label: 'Завершено', value: stats.completed, color: 'text-green-400' },
            { label: 'Запланировано', value: stats.planned, color: 'text-blue-400' },
            { label: 'Не пройдено', value: stats.failed, color: 'text-red-400' },
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по теме или сотруднику..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Сотрудник</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Тема</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Тип</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Дата</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Оценка</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Нет данных</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-200">
                  {item.trainee ? `${item.trainee.surname} ${item.trainee.name}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">{item.title}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{typeLabels[item.type] || item.type}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {item.trainingDate ? new Date(item.trainingDate).toLocaleDateString('ru') : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.assessmentScore != null ? (
                    <div className="flex items-center justify-center gap-1">
                      {item.passed ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                      <span className="text-sm text-slate-200">{item.assessmentScore}</span>
                    </div>
                  ) : <span className="text-slate-500">-</span>}
                </td>
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
            <h2 className="text-lg font-bold text-slate-100">Новая запись обучения</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Тема обучения" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <textarea placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none h-20 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input type="date" value={form.trainingDate} onChange={e => setForm({ ...form, trainingDate: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              </div>
              <input type="number" placeholder="ID сотрудника" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
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

export default TrainingPage;

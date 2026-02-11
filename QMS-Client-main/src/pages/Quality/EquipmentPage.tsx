import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Search, AlertTriangle, Calendar } from 'lucide-react';
import { equipmentApi } from '../../api/qmsApi';

interface EquipmentItem {
  id: number;
  inventoryNumber: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  location: string;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  status: string;
  responsible?: { id: number; name: string; surname: string };
  calibrations?: Array<any>;
}

const statusColor: Record<string, string> = {
  IN_SERVICE: 'bg-green-900/40 text-green-400',
  OUT_OF_SERVICE: 'bg-red-900/40 text-red-400',
  IN_CALIBRATION: 'bg-blue-900/40 text-blue-400',
  OVERDUE: 'bg-orange-900/40 text-orange-400',
  DECOMMISSIONED: 'bg-slate-700/40 text-slate-400',
};

const typeLabels: Record<string, string> = {
  MEASURING: 'Измерительное',
  TEST: 'Испытательное',
  PRODUCTION: 'Производственное',
  MONITORING: 'Мониторинг',
  IT: 'ИТ',
};

const EquipmentPage: React.FC = () => {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', manufacturer: '', model: '', type: 'MEASURING', location: '', calibrationType: 'CALIBRATION', calibrationInterval: 12 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        equipmentApi.getAll(),
        equipmentApi.getStats(),
      ]);
      setItems(itemsData.rows || []);
      setStats(statsData);
    } catch (e) {
      console.error('EquipmentPage loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await equipmentApi.create(form);
      setShowCreate(false);
      setForm({ name: '', manufacturer: '', model: '', type: 'MEASURING', location: '', calibrationType: 'CALIBRATION', calibrationInterval: 12 });
      await loadData();
    } catch (e) {
      console.error('Create equipment error:', e);
    } finally {
      setCreating(false);
    }
  };

  const isOverdue = (nextDate: string | null) => {
    if (!nextDate) return false;
    return new Date(nextDate) < new Date();
  };

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.inventoryNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Wrench className="text-amber-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Оборудование и калибровка</h1>
            <p className="text-slate-400 text-sm">ISO 13485 &sect;7.6 &mdash; Управление оборудованием</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всего', value: stats.total, color: 'text-slate-100' },
            { label: 'В эксплуатации', value: stats.inService, color: 'text-green-400' },
            { label: 'Просрочено', value: stats.overdue, color: 'text-red-400' },
            { label: 'На калибровке', value: stats.inCalibration, color: 'text-blue-400' },
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по инв.номеру, названию или расположению..." className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Инв. &#8470;</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Название</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Тип</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Расположение</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Калибровка</th>
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
                <td className="px-4 py-3 text-sm font-mono text-teal-400">{item.inventoryNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  <div>{item.name}</div>
                  {item.manufacturer && <div className="text-xs text-slate-500">{item.manufacturer} {item.model}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{typeLabels[item.type] || item.type}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.location || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    {isOverdue(item.nextCalibrationDate) && <AlertTriangle size={12} className="text-red-400" />}
                    <Calendar size={12} className="text-slate-500" />
                    <span className={isOverdue(item.nextCalibrationDate) ? 'text-red-400' : 'text-slate-300'}>
                      {item.nextCalibrationDate ? new Date(item.nextCalibrationDate).toLocaleDateString('ru') : '-'}
                    </span>
                  </div>
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
            <h2 className="text-lg font-bold text-slate-100">Новое оборудование</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Наименование" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Производитель" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                <input type="text" placeholder="Модель" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input type="text" placeholder="Расположение" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.calibrationType} onChange={e => setForm({ ...form, calibrationType: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none">
                  <option value="VERIFICATION">Поверка</option>
                  <option value="CALIBRATION">Калибровка</option>
                  <option value="VALIDATION">Валидация</option>
                  <option value="NONE">Не требуется</option>
                </select>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Интервал (мес.)</label>
                  <input type="number" min={1} value={form.calibrationInterval} onChange={e => setForm({ ...form, calibrationInterval: +e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-sm focus:border-teal-500/50 focus:outline-none" />
                </div>
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

export default EquipmentPage;

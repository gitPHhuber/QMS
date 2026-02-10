/**
 * CapaPage.tsx — Реестр CAPA
 * НОВЫЙ ФАЙЛ: src/pages/CAPA/CapaPage.tsx
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2, Plus, Search, Loader2, ChevronRight, X,
  Clock, Zap
} from "lucide-react";
import { capaApi } from "src/api/qmsApi";
import type { CapaShort, CapaStatus } from "src/api/qmsApi";

const STATUS_FLOW: { key: CapaStatus; label: string; cls: string }[] = [
  { key: "INITIATED", label: "Инициировано", cls: "bg-gray-100 text-gray-700" },
  { key: "INVESTIGATING", label: "Расследование", cls: "bg-blue-100 text-blue-700" },
  { key: "PLANNING", label: "Планирование", cls: "bg-indigo-100 text-indigo-700" },
  { key: "PLAN_APPROVED", label: "План утверждён", cls: "bg-purple-100 text-purple-700" },
  { key: "IMPLEMENTING", label: "Выполнение", cls: "bg-cyan-100 text-cyan-700" },
  { key: "VERIFYING", label: "Проверка", cls: "bg-amber-100 text-amber-700" },
  { key: "EFFECTIVE", label: "Эффективно", cls: "bg-emerald-100 text-emerald-700" },
  { key: "INEFFECTIVE", label: "Неэффективно", cls: "bg-red-100 text-red-700" },
  { key: "CLOSED", label: "Закрыто", cls: "bg-gray-100 text-gray-500" },
];

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Срочно", cls: "bg-red-600 text-white" },
  HIGH: { label: "Высокий", cls: "bg-orange-500 text-white" },
  MEDIUM: { label: "Средний", cls: "bg-blue-100 text-blue-700" },
  LOW: { label: "Низкий", cls: "bg-gray-100 text-gray-600" },
};

const TYPE_LABEL: Record<string, string> = {
  CORRECTIVE: "Корректирующее",
  PREVENTIVE: "Предупреждающее",
};

export const CapaPage: React.FC = () => {
  const [capas, setCapas] = useState<CapaShort[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", type: "CORRECTIVE", priority: "MEDIUM", description: "",
    nonconformityId: "", dueDate: "", effectivenessCheckDays: "90",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await capaApi.getAll({
        page, limit: 20, search: search || undefined,
        status: statusFilter || undefined, type: typeFilter || undefined,
      });
      setCapas(r.rows);
      setCount(r.count);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title) return;
    setCreating(true);
    try {
      await capaApi.create({
        ...form,
        nonconformityId: form.nonconformityId ? Number(form.nonconformityId) : undefined,
        effectivenessCheckDays: Number(form.effectivenessCheckDays) || 90,
      });
      setShowCreate(false);
      setForm({ title: "", type: "CORRECTIVE", priority: "MEDIUM", description: "", nonconformityId: "", dueDate: "", effectivenessCheckDays: "90" });
      load();
    } finally { setCreating(false); }
  };

  const getStatusStep = (status: CapaStatus) => STATUS_FLOW.findIndex(s => s.key === status);
  const totalPages = Math.max(1, Math.ceil(count / 20));

  return (
    <div className="px-4 py-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">CAPA</h1>
            <p className="text-sm text-gray-500">ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl shadow hover:shadow-lg transition text-sm font-medium">
          <Plus size={16} /> Создать CAPA
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по номеру, названию..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все статусы</option>
          {STATUS_FLOW.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все типы</option>
          <option value="CORRECTIVE">Корректирующее</option>
          <option value="PREVENTIVE">Предупреждающее</option>
        </select>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
        ) : capas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">CAPA не найдены</div>
        ) : capas.map(capa => {
          const st = STATUS_FLOW.find(s => s.key === capa.status) || STATUS_FLOW[0];
          const pr = PRIORITY_BADGE[capa.priority] || PRIORITY_BADGE.MEDIUM;
          const step = getStatusStep(capa.status);
          const overdue = capa.dueDate && new Date(capa.dueDate) < new Date() && !["CLOSED", "EFFECTIVE"].includes(capa.status);
          return (
            <div key={capa.id} onClick={() => window.location.href = `/capa/${capa.id}`}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition ${
                overdue ? "border-red-300" : "border-gray-200"
              }`}>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-700">{capa.number}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${pr.cls}`}>{pr.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border">
                      {TYPE_LABEL[capa.type] || capa.type}
                    </span>
                    {overdue && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <Clock size={10} /> Просрочено
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{capa.title}</div>
                  {capa.nonconformity && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Zap size={10} className="text-red-400" />
                      {capa.nonconformity.number}: {capa.nonconformity.title}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex-shrink-0 w-32 hidden md:block">
                  <div className="flex gap-0.5">
                    {STATUS_FLOW.slice(0, 7).map((s, i) => (
                      <div key={s.key} className={`h-1.5 flex-1 rounded-full ${
                        i <= step ? (capa.status === "INEFFECTIVE" ? "bg-red-400" : "bg-emerald-400") : "bg-gray-200"
                      }`} />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {step + 1} / {STATUS_FLOW.length - 2}
                  </div>
                </div>

                {capa.assignedTo && (
                  <div className="text-xs text-gray-500 text-right flex-shrink-0 hidden lg:block">
                    <div className="text-gray-400">Ответственный</div>
                    <div>{capa.assignedTo.name} {capa.assignedTo.surname}</div>
                  </div>
                )}
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Всего: {count}</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${p === page ? "bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Создание CAPA</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Название *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Тип</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="CORRECTIVE">Корректирующее</option>
                    <option value="PREVENTIVE">Предупреждающее</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Приоритет</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                    {Object.entries(PRIORITY_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Срок</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">NC номер (если есть)</label>
                <input value={form.nonconformityId} onChange={e => setForm(f => ({ ...f, nonconformityId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="ID несоответствия" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Описание</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows={3} />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Проверка эффективности через (дней)</label>
                <input type="number" value={form.effectivenessCheckDays} onChange={e => setForm(f => ({ ...f, effectivenessCheckDays: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !form.title}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1">
                {creating && <Loader2 size={14} className="animate-spin" />} Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

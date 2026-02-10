/**
 * NonconformityPage.tsx — Реестр несоответствий
 * НОВЫЙ ФАЙЛ: src/pages/Nonconformity/NonconformityPage.tsx
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Plus, Search, Loader2, ChevronRight, X,
  AlertCircle, Clock
} from "lucide-react";
import { ncApi } from "src/api/qmsApi";
import type { NcShort, NcClassification } from "src/api/qmsApi";

const CLS_BADGE: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "Критическое", cls: "bg-red-100 text-red-700 border-red-200" },
  MAJOR: { label: "Серьёзное", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  MINOR: { label: "Незначительное", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Открыто", cls: "bg-red-100 text-red-700" },
  INVESTIGATING: { label: "Расследование", cls: "bg-blue-100 text-blue-700" },
  DISPOSITION: { label: "Решение", cls: "bg-purple-100 text-purple-700" },
  IMPLEMENTING: { label: "Выполнение", cls: "bg-indigo-100 text-indigo-700" },
  VERIFICATION: { label: "Проверка", cls: "bg-amber-100 text-amber-700" },
  CLOSED: { label: "Закрыто", cls: "bg-emerald-100 text-emerald-700" },
  REOPENED: { label: "Переоткрыто", cls: "bg-orange-100 text-orange-700" },
};

const SOURCE_LABELS: Record<string, string> = {
  INCOMING_INSPECTION: "Входной контроль",
  IN_PROCESS: "В процессе",
  FINAL_INSPECTION: "Выходной контроль",
  CUSTOMER_COMPLAINT: "Жалоба потребителя",
  INTERNAL_AUDIT: "Внутренний аудит",
  EXTERNAL_AUDIT: "Внешний аудит",
  SUPPLIER: "Поставщик",
  FIELD_RETURN: "Возврат",
  OTHER: "Прочее",
};

export const NonconformityPage: React.FC = () => {
  const [ncs, setNcs] = useState<NcShort[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", source: "IN_PROCESS",
    classification: "MINOR" as NcClassification,
    productType: "", lotNumber: "", immediateAction: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await ncApi.getAll({
        page, limit: 20, search: search || undefined,
        status: statusFilter || undefined, classification: classFilter || undefined,
      });
      setNcs(r.rows);
      setCount(r.count);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, classFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setCreating(true);
    try {
      await ncApi.create(form);
      setShowCreate(false);
      setForm({ title: "", description: "", source: "IN_PROCESS", classification: "MINOR", productType: "", lotNumber: "", immediateAction: "" });
      load();
    } finally { setCreating(false); }
  };

  const totalPages = Math.max(1, Math.ceil(count / 20));

  return (
    <div className="px-4 py-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Несоответствия</h1>
            <p className="text-sm text-gray-500">ISO 13485 §8.3 — Управление несоответствующей продукцией</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow hover:shadow-lg transition text-sm font-medium">
          <Plus size={16} /> Зарегистрировать NC
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по номеру, названию..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все классы</option>
          {Object.entries(CLS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
        ) : ncs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Несоответствия не найдены</div>
        ) : ncs.map(nc => {
          const cls = CLS_BADGE[nc.classification] || CLS_BADGE.MINOR;
          const st = STATUS_BADGE[nc.status] || STATUS_BADGE.OPEN;
          const overdue = nc.dueDate && new Date(nc.dueDate) < new Date() && nc.status !== "CLOSED";
          return (
            <div key={nc.id} onClick={() => window.location.href = `/nonconformity/${nc.id}`}
              className={`bg-white border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition ${
                overdue ? "border-red-300 bg-red-50/30" : "border-gray-200"
              }`}>
              <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                nc.classification === "CRITICAL" ? "bg-red-500" : nc.classification === "MAJOR" ? "bg-amber-400" : "bg-gray-300"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-red-600">{nc.number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls.cls}`}>{cls.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                  {overdue && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <Clock size={10} /> Просрочено
                    </span>
                  )}
                </div>
                <div className="font-medium text-gray-800 text-sm truncate">{nc.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {SOURCE_LABELS[nc.source] || nc.source} •{" "}
                  {new Date(nc.detectedAt).toLocaleDateString("ru-RU")} •{" "}
                  {nc.reportedBy ? `${nc.reportedBy.name} ${nc.reportedBy.surname}` : ""}
                </div>
              </div>
              {nc.assignedTo && (
                <div className="text-xs text-gray-500 text-right flex-shrink-0">
                  <div className="text-gray-400">Ответственный</div>
                  <div>{nc.assignedTo.name} {nc.assignedTo.surname}</div>
                </div>
              )}
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
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
                className={`px-3 py-1 rounded ${p === page ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Регистрация несоответствия</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Название *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Краткое описание NC" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Подробное описание *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Что обнаружено, где, при каких обстоятельствах..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Источник</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Классификация</label>
                  <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value as NcClassification }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                    {Object.entries(CLS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Тип продукции</label>
                  <input value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Номер партии</label>
                  <input value={form.lotNumber} onChange={e => setForm(f => ({ ...f, lotNumber: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Немедленное действие</label>
                <textarea value={form.immediateAction} onChange={e => setForm(f => ({ ...f, immediateAction: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Что сделано сразу (изоляция, остановка и т.д.)" />
              </div>
              {form.classification === "CRITICAL" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle size={14} />
                  Для критических NC автоматически требуется CAPA
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !form.title || !form.description}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
                {creating && <Loader2 size={14} className="animate-spin" />} Зарегистрировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

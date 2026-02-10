/**
 * DocumentsPage.tsx — Реестр документов СМК
 * НОВЫЙ ФАЙЛ: src/pages/Documents/DocumentsPage.tsx
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  FileText, Plus, Search, Filter, ChevronRight, Clock,
  CheckCircle2, AlertTriangle, Loader2, X
} from "lucide-react";
import { documentsApi } from "src/api/qmsApi";
import type { DocumentShort, DocType, DocStatus } from "src/api/qmsApi";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Черновик", cls: "bg-gray-100 text-gray-700" },
  REVIEW: { label: "Согласование", cls: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Утверждён", cls: "bg-purple-100 text-purple-700" },
  EFFECTIVE: { label: "Действующий", cls: "bg-emerald-100 text-emerald-700" },
  REVISION: { label: "Пересмотр", cls: "bg-amber-100 text-amber-700" },
  OBSOLETE: { label: "Устарел", cls: "bg-gray-100 text-gray-500" },
  CANCELLED: { label: "Отменён", cls: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  POLICY: "Политика", MANUAL: "Руководство", PROCEDURE: "СТО",
  WORK_INSTRUCTION: "Рабочая инструкция", FORM: "Форма", RECORD: "Запись",
  SPECIFICATION: "Спецификация", PLAN: "План", EXTERNAL: "Внешний", OTHER: "Прочее",
};

export const DocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState<DocumentShort[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: "", type: "PROCEDURE" as DocType, category: "", description: "" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await documentsApi.getAll({
        page, limit: 20, search: search || undefined,
        status: statusFilter || undefined, type: typeFilter || undefined,
      });
      setDocs(r.rows);
      setCount(r.count);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!createData.title) return;
    setCreating(true);
    try {
      await documentsApi.create(createData);
      setShowCreate(false);
      setCreateData({ title: "", type: "PROCEDURE", category: "", description: "" });
      load();
    } finally { setCreating(false); }
  };

  const totalPages = Math.max(1, Math.ceil(count / 20));

  return (
    <div className="px-4 py-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Документы СМК</h1>
            <p className="text-sm text-gray-500">ISO 13485 §4.2.4 — Управление документацией</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow hover:shadow-lg transition text-sm font-medium">
          <Plus size={16} /> Создать документ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по коду, названию..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Код</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Версия</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Владелец</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Пересмотр</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Документы не найдены</td></tr>
            ) : docs.map(doc => {
              const sb = STATUS_BADGE[doc.status] || STATUS_BADGE.DRAFT;
              const overdue = doc.nextReviewDate && new Date(doc.nextReviewDate) < new Date();
              return (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/documents/${doc.id}`}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{doc.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{doc.title}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[doc.type] || doc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sb.cls}`}>{sb.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doc.currentVersion?.version || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {doc.owner ? `${doc.owner.name} ${doc.owner.surname}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {doc.nextReviewDate ? (
                      <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-bold" : "text-gray-500"}`}>
                        {overdue && <AlertTriangle size={12} />}
                        {new Date(doc.nextReviewDate).toLocaleDateString("ru-RU")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Всего: {count}</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Новый документ</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Название *</label>
                <input value={createData.title} onChange={e => setCreateData(d => ({ ...d, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Руководство по качеству" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Тип *</label>
                  <select value={createData.type} onChange={e => setCreateData(d => ({ ...d, type: e.target.value as DocType }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Категория</label>
                  <input value={createData.category} onChange={e => setCreateData(d => ({ ...d, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Производство" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Описание</label>
                <textarea value={createData.description} onChange={e => setCreateData(d => ({ ...d, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Отмена</button>
              <button onClick={handleCreate} disabled={creating || !createData.title}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                {creating && <Loader2 size={14} className="animate-spin" />} Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

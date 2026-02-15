import React, { useEffect, useState, useCallback } from "react";
import {
  ClipboardCheck, Plus, Search, RefreshCw, ChevronLeft,
  CheckCircle2, XCircle, AlertTriangle, Eye, Send
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchInspections, createInspection, updateInspection,
  completeInspection, fetchInspectionTemplates, fetchSupplies
} from "src/api/warehouseApi";
import {
  IncomingInspectionModel, InspectionTemplateModel,
  InspectionChecklistItemModel, SupplyModel
} from "src/types/WarehouseModels";
import { QuarantinePanel } from "../components/QuarantinePanel";
import { formatDateTime } from "../utils";

const STATUS_OPTIONS = ["", "PENDING", "IN_PROGRESS", "PASSED", "FAILED", "CONDITIONAL"] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает",
  IN_PROGRESS: "В процессе",
  PASSED: "Принято",
  FAILED: "Забраковано",
  CONDITIONAL: "Условно",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-asvo-surface-2 text-asvo-text-mid",
  IN_PROGRESS: "bg-asvo-blue-dim text-asvo-blue",
  PASSED: "bg-asvo-green-dim text-asvo-green",
  FAILED: "bg-asvo-red-dim text-asvo-red",
  CONDITIONAL: "bg-asvo-amber-dim text-asvo-amber",
};

const RESULT_OPTIONS = ["OK", "NOK", "NA", "CONDITIONAL"] as const;

const RESULT_STYLES: Record<string, string> = {
  OK: "bg-asvo-green text-white",
  NOK: "bg-asvo-red text-white",
  NA: "bg-asvo-surface-2 text-asvo-text-mid",
  CONDITIONAL: "bg-asvo-amber text-white",
};

export const WarehouseInspection: React.FC = () => {
  const [inspections, setInspections] = useState<IncomingInspectionModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const [supplies, setSupplies] = useState<SupplyModel[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplateModel[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    supplyId: "" as number | "",
    templateId: "" as number | "",
    notes: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [selected, setSelected] = useState<IncomingInspectionModel | null>(null);
  const [checklist, setChecklist] = useState<InspectionChecklistItemModel[]>([]);
  const [completeResult, setCompleteResult] = useState("PASSED");
  const [savingChecklist, setSavingChecklist] = useState(false);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInspections({
        page,
        limit,
        status: statusFilter || undefined,
      });
      setInspections(res.rows);
      setTotal(res.count);
    } catch {
      toast.error("Ошибка загрузки инспекций");
    }
    setLoading(false);
  }, [page, statusFilter]);

  const loadRefs = async () => {
    try {
      const [s, t] = await Promise.all([fetchSupplies(), fetchInspectionTemplates()]);
      setSupplies(s);
      setTemplates(t);
    } catch {
      /* silent — refs are optional */
    }
  };

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  useEffect(() => {
    loadRefs();
  }, []);

  const handleCreate = async () => {
    if (!createForm.supplyId) return toast.error("Выберите поставку");
    setCreateLoading(true);
    try {
      await createInspection({
        supplyId: Number(createForm.supplyId),
        templateId: createForm.templateId ? Number(createForm.templateId) : undefined,
        notes: createForm.notes || undefined,
      });
      toast.success("Инспекция создана");
      setIsCreateOpen(false);
      setCreateForm({ supplyId: "", templateId: "", notes: "" });
      loadInspections();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка создания");
    }
    setCreateLoading(false);
  };

  const openDetail = (insp: IncomingInspectionModel) => {
    setSelected(insp);
    setChecklist(insp.checklistItems ? [...insp.checklistItems] : []);
    setCompleteResult("PASSED");
  };

  const closeDetail = () => {
    setSelected(null);
    setChecklist([]);
  };

  const updateChecklistItem = (
    index: number,
    field: keyof InspectionChecklistItemModel,
    value: string | null
  ) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveChecklist = async () => {
    if (!selected) return;
    setSavingChecklist(true);
    try {
      const updated = await updateInspection(selected.id, {
        checklistItems: checklist,
      });
      toast.success("Чек-лист сохранён");
      setSelected(updated);
      setChecklist(updated.checklistItems ? [...updated.checklistItems] : []);
      loadInspections();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка сохранения");
    }
    setSavingChecklist(false);
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      await completeInspection(selected.id, {
        status: completeResult,
        overallResult: completeResult,
      });
      toast.success("Инспекция завершена");
      closeDetail();
      loadInspections();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка завершения");
    }
  };

  const totalPages = Math.ceil(total / limit);

  // ──── Detail view ────
  if (selected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={closeDetail}
            className="p-2 bg-asvo-surface-2 rounded-lg hover:bg-asvo-surface-3 transition"
          >
            <ChevronLeft size={20} className="text-asvo-text-mid" />
          </button>
          <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
            <ClipboardCheck className="text-asvo-accent" />
            Инспекция #{selected.id}
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              STATUS_STYLES[selected.status] || ""
            }`}
          >
            {STATUS_LABELS[selected.status] || selected.status}
          </span>
        </div>

        {/* Summary card */}
        <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-asvo-text-dim text-xs uppercase block">Поставка</span>
            <span className="font-bold text-asvo-text">
              {selected.supply?.docNumber || `#${selected.supplyId}`}
            </span>
          </div>
          <div>
            <span className="text-asvo-text-dim text-xs uppercase block">Поставщик</span>
            <span className="font-medium text-asvo-text-mid">
              {selected.supply?.supplier || "—"}
            </span>
          </div>
          <div>
            <span className="text-asvo-text-dim text-xs uppercase block">Инспектор</span>
            <span className="font-medium text-asvo-text-mid">
              {selected.inspector
                ? `${selected.inspector.name} ${selected.inspector.surname}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-asvo-text-dim text-xs uppercase block">Дата</span>
            <span className="font-medium text-asvo-text-mid">
              {formatDateTime(selected.date)}
            </span>
          </div>
        </div>

        {selected.notes && (
          <div className="bg-asvo-accent-dim p-3 rounded-lg text-sm text-asvo-accent border border-asvo-accent/20">
            {selected.notes}
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 ? (
          <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
            <div className="px-6 py-3 font-bold text-asvo-text bg-asvo-surface-2 border-b border-asvo-border">
              Чек-лист ({checklist.length} пунктов)
            </div>
            <table className="w-full text-left">
              <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
                <tr>
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Проверка</th>
                  <th className="px-4 py-3 w-40">Результат</th>
                  <th className="px-4 py-3 w-32">Значение</th>
                  <th className="px-4 py-3">Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-asvo-border text-sm">
                {checklist.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-asvo-surface-2 transition">
                    <td className="px-4 py-2 text-asvo-text-dim text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-asvo-text">{item.checkItem}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {RESULT_OPTIONS.map((r) => (
                          <button
                            key={r}
                            onClick={() => updateChecklistItem(idx, "result", r)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              item.result === r
                                ? RESULT_STYLES[r]
                                : "bg-asvo-surface-2 text-asvo-text-dim hover:bg-asvo-surface-3"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={item.value ?? ""}
                        onChange={(e) =>
                          updateChecklistItem(idx, "value", e.target.value || null)
                        }
                        className="w-full p-1.5 border border-asvo-border rounded bg-asvo-surface-2 text-asvo-text text-xs outline-none"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={item.comment ?? ""}
                        onChange={(e) =>
                          updateChecklistItem(idx, "comment", e.target.value || null)
                        }
                        className="w-full p-1.5 border border-asvo-border rounded bg-asvo-surface-2 text-asvo-text text-xs outline-none"
                        placeholder="Комментарий"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 py-3 border-t border-asvo-border flex justify-end">
              <button
                onClick={handleSaveChecklist}
                disabled={savingChecklist}
                className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition text-sm"
              >
                {savingChecklist ? "Сохранение..." : "Сохранить чек-лист"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-asvo-surface rounded-xl border-2 border-dashed border-asvo-border text-asvo-text-dim text-sm">
            Чек-лист пуст. Создайте инспекцию с шаблоном для автозаполнения.
          </div>
        )}

        {/* Complete action */}
        {(selected.status === "PENDING" || selected.status === "IN_PROGRESS") && (
          <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border flex flex-col md:flex-row items-center gap-4">
            <span className="text-sm font-bold text-asvo-text">Завершить инспекцию:</span>
            <select
              value={completeResult}
              onChange={(e) => setCompleteResult(e.target.value)}
              className="p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
            >
              <option value="PASSED">Принято (PASSED)</option>
              <option value="FAILED">Забраковано (FAILED)</option>
              <option value="CONDITIONAL">Условно (CONDITIONAL)</option>
            </select>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 bg-asvo-green text-white px-4 py-2 rounded-lg font-bold hover:bg-asvo-green/80 transition text-sm"
            >
              <Send size={16} /> Завершить
            </button>
          </div>
        )}

        {/* Quarantine panel */}
        <div className="bg-asvo-surface p-5 rounded-xl border border-asvo-border">
          <QuarantinePanel />
        </div>
      </div>
    );
  }

  // ──── List view ────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
          <ClipboardCheck className="text-asvo-accent" /> Входной контроль
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadInspections}
            className="p-2 bg-asvo-surface-2 rounded-full hover:bg-asvo-surface-3 transition"
          >
            <RefreshCw size={18} className="text-asvo-text-mid" />
          </button>
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition"
          >
            <Plus size={18} /> Новая инспекция
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s || "ALL"}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-asvo-accent text-asvo-bg"
                  : "bg-asvo-surface-2 text-asvo-text-mid hover:bg-asvo-surface-3"
              }`}
            >
              {s ? STATUS_LABELS[s] || s : "Все"}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-asvo-text-dim">
          Всего: {total}
        </span>
      </div>

      {/* Create form */}
      {isCreateOpen && (
        <div className="bg-asvo-accent-dim p-4 rounded-xl border border-asvo-accent/20 animate-fade-in space-y-3">
          <h3 className="font-bold text-asvo-accent text-sm">Создание инспекции</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Поставка *
              </label>
              <select
                value={createForm.supplyId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    supplyId: e.target.value ? Number(e.target.value) : "",
                  })
                }
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
              >
                <option value="">-- Выберите поставку --</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.docNumber || `#${s.id}`} — {s.supplier || "Без поставщика"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Шаблон (опционально)
              </label>
              <select
                value={createForm.templateId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    templateId: e.target.value ? Number(e.target.value) : "",
                  })
                }
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
              >
                <option value="">-- Без шаблона --</option>
                {templates
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Примечание
              </label>
              <input
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Комментарий к инспекции"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-asvo-surface-2 text-asvo-text-mid rounded-lg text-sm font-bold hover:bg-asvo-surface-3 transition"
            >
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition text-sm"
            >
              {createLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Inspections table */}
      {loading ? (
        <div className="text-center py-20 text-asvo-text-dim">Загрузка данных...</div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-20 bg-asvo-surface rounded-xl border-2 border-dashed border-asvo-border">
          <ClipboardCheck size={48} className="mx-auto text-asvo-text-dim mb-4" />
          <p className="text-asvo-text-mid">Инспекции не найдены</p>
        </div>
      ) : (
        <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Поставка</th>
                <th className="px-6 py-3">Поставщик</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Инспектор</th>
                <th className="px-6 py-3">Дата</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asvo-border text-sm">
              {inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-asvo-surface-2 transition group">
                  <td className="px-6 py-3 font-mono text-asvo-accent font-bold">#{insp.id}</td>
                  <td className="px-6 py-3 font-medium text-asvo-text">
                    {insp.supply?.docNumber || `Поставка #${insp.supplyId}`}
                  </td>
                  <td className="px-6 py-3 text-asvo-text-mid">
                    {insp.supply?.supplier || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        STATUS_STYLES[insp.status] || ""
                      }`}
                    >
                      {STATUS_LABELS[insp.status] || insp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-asvo-text-mid text-xs">
                    {insp.inspector
                      ? `${insp.inspector.name} ${insp.inspector.surname}`
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-asvo-text-mid text-xs">
                    {formatDateTime(insp.date)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openDetail(insp)}
                      className="p-2 text-asvo-text-dim hover:text-asvo-accent hover:bg-asvo-accent-dim rounded-lg transition"
                      title="Открыть"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                page === p
                  ? "bg-asvo-accent text-asvo-bg"
                  : "bg-asvo-surface-2 text-asvo-text-mid hover:bg-asvo-surface-3"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Quarantine panel */}
      <div className="bg-asvo-surface p-5 rounded-xl border border-asvo-border">
        <QuarantinePanel />
      </div>
    </div>
  );
};

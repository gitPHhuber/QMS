import React, { useCallback, useEffect, useState } from "react";
import {
  RotateCcw, Plus, Filter, ChevronLeft,
  Search, ClipboardCheck, Gavel, Package,
  Calendar, X, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchReturns,
  createReturn,
  inspectReturn,
  decideReturn,
} from "src/api/warehouseApi";
import { ReturnModel, ReturnItemModel } from "src/types/WarehouseModels";
import { formatDateTime } from "../utils";

const STATUSES = ["", "RECEIVED", "INSPECTING", "DECIDED", "CLOSED"] as const;

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Получен",
  INSPECTING: "Осмотр",
  DECIDED: "Решение принято",
  CLOSED: "Закрыт",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "RECEIVED":
      return "bg-asvo-blue-dim text-asvo-blue border-asvo-border";
    case "INSPECTING":
      return "bg-asvo-amber-dim text-asvo-amber border-asvo-border";
    case "DECIDED":
      return "bg-asvo-green-dim text-asvo-green border-asvo-border";
    case "CLOSED":
      return "bg-asvo-grey-dim text-asvo-text-mid border-asvo-border";
    default:
      return "bg-asvo-grey-dim text-asvo-text-mid border-asvo-border";
  }
};

const DISPOSITION_LABELS: Record<string, string> = {
  RESTOCK: "Возврат на склад",
  REWORK: "Переработка",
  SCRAP: "Утилизация",
  DESTROY: "Уничтожение",
};

const LIMIT = 20;

export const WarehouseReturns: React.FC = () => {
  /* ─── registry state ─── */
  const [rows, setRows] = useState<ReturnModel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  /* ─── create form ─── */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    number: "",
    customerId: "",
    shipmentId: "",
    reason: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  /* ─── detail view ─── */
  const [selected, setSelected] = useState<ReturnModel | null>(null);

  /* ─── inspect modal ─── */
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectItems, setInspectItems] = useState<
    { itemId: number; condition: string; disposition: string }[]
  >([]);
  const [inspectSubmitting, setInspectSubmitting] = useState(false);

  /* ─── decide confirm ─── */
  const [decideConfirmOpen, setDecideConfirmOpen] = useState(false);
  const [decideSubmitting, setDecideSubmitting] = useState(false);

  /* ═══════════════════ data loading ═══════════════════ */

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReturns({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
      });
      setRows(res.rows);
      setTotalCount(res.count);
    } catch {
      toast.error("Ошибка загрузки возвратов");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadReturns, 300);
    return () => clearTimeout(timer);
  }, [loadReturns]);

  const openDetail = (ret: ReturnModel) => {
    setSelected(ret);
  };

  /* ═══════════════════ create ═══════════════════ */

  const handleCreate = async () => {
    if (!newReturn.number.trim()) return toast.error("Введите номер возврата!");
    setCreating(true);
    try {
      await createReturn({
        number: newReturn.number,
        customerId: newReturn.customerId ? Number(newReturn.customerId) : undefined,
        shipmentId: newReturn.shipmentId ? Number(newReturn.shipmentId) : undefined,
        reason: newReturn.reason || undefined,
        notes: newReturn.notes || undefined,
      });
      toast.success("Возврат создан");
      setIsCreateOpen(false);
      setNewReturn({ number: "", customerId: "", shipmentId: "", reason: "", notes: "" });
      loadReturns();
    } catch {
      toast.error("Ошибка создания возврата");
    } finally {
      setCreating(false);
    }
  };

  /* ═══════════════════ inspect ═══════════════════ */

  const openInspectForm = () => {
    if (!selected?.items?.length) return toast.error("Нет позиций для осмотра");
    setInspectItems(
      selected.items.map((item) => ({
        itemId: item.id,
        condition: item.condition || "",
        disposition: item.disposition || "RESTOCK",
      }))
    );
    setInspectOpen(true);
  };

  const handleInspectSubmit = async () => {
    if (!selected) return;
    const hasEmpty = inspectItems.some((i) => !i.condition);
    if (hasEmpty) return toast.error("Укажите состояние для всех позиций!");
    setInspectSubmitting(true);
    try {
      await inspectReturn(selected.id, inspectItems);
      toast.success("Осмотр завершён");
      setInspectOpen(false);
      // reload the list and update the selected item
      loadReturns();
      // find the updated return
      const res = await fetchReturns({ page: 1, limit: 1, status: undefined });
      const updated = res.rows.find((r) => r.id === selected.id);
      if (updated) setSelected(updated);
      else setSelected(null);
    } catch {
      toast.error("Ошибка осмотра");
    } finally {
      setInspectSubmitting(false);
    }
  };

  /* ═══════════════════ decide ═══════════════════ */

  const handleDecideConfirm = async () => {
    if (!selected) return;
    setDecideSubmitting(true);
    try {
      await decideReturn(selected.id);
      toast.success("Решение принято");
      setDecideConfirmOpen(false);
      loadReturns();
      setSelected(null);
    } catch {
      toast.error("Ошибка принятия решения");
    } finally {
      setDecideSubmitting(false);
    }
  };

  /* ═══════════════════ detail view ═══════════════════ */

  if (selected) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelected(null)}
            className="p-2 bg-asvo-surface-2 rounded-lg hover:bg-asvo-surface-3 transition"
          >
            <ChevronLeft size={20} className="text-asvo-text-mid" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
              <RotateCcw className="text-asvo-accent" /> Возврат {selected.number}
            </h2>
            <p className="text-sm text-asvo-text-dim">ID: {selected.id}</p>
          </div>
          <span
            className={`ml-auto px-3 py-1 rounded-md text-xs font-bold border ${getStatusBadge(selected.status)}`}
          >
            {STATUS_LABELS[selected.status] || selected.status}
          </span>
        </div>

        {/* info card */}
        <div className="bg-asvo-surface rounded-xl border border-asvo-border p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Дата</span>
            <span className="text-asvo-text font-medium">{selected.date || "—"}</span>
          </div>
          <div>
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Клиент ID</span>
            <span className="text-asvo-text font-medium">{selected.customerId ?? "—"}</span>
          </div>
          <div>
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Отгрузка ID</span>
            <span className="text-asvo-text font-medium">{selected.shipmentId ?? "—"}</span>
          </div>
          <div>
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Примечание</span>
            <span className="text-asvo-text font-medium">{selected.notes || "—"}</span>
          </div>
          {selected.reason && (
            <div className="md:col-span-4">
              <span className="text-asvo-text-dim block text-xs uppercase font-bold">Причина</span>
              <span className="text-asvo-text font-medium">{selected.reason}</span>
            </div>
          )}
        </div>

        {/* workflow actions */}
        <div className="flex gap-3">
          {selected.status === "RECEIVED" && (
            <button
              onClick={openInspectForm}
              className="flex items-center gap-2 bg-asvo-amber text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-amber/80 transition"
            >
              <ClipboardCheck size={18} /> Начать осмотр
            </button>
          )}
          {selected.status === "INSPECTING" && (
            <button
              onClick={() => setDecideConfirmOpen(true)}
              className="flex items-center gap-2 bg-asvo-green text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-green/80 transition"
            >
              <Gavel size={18} /> Принять решение
            </button>
          )}
        </div>

        {/* items table */}
        <div className="bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
          <div className="px-6 py-3 font-bold text-asvo-text bg-asvo-surface-2 border-b border-asvo-border flex items-center gap-2">
            <Package size={16} className="text-asvo-accent" /> Позиции возврата
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Box ID</th>
                <th className="px-6 py-3">Серийный №</th>
                <th className="px-6 py-3 text-right">Кол-во</th>
                <th className="px-6 py-3">Состояние</th>
                <th className="px-6 py-3">Решение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asvo-border text-sm">
              {!selected.items || selected.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-asvo-text-dim">
                    Нет позиций
                  </td>
                </tr>
              ) : (
                selected.items.map((item: ReturnItemModel) => (
                  <tr key={item.id} className="hover:bg-asvo-surface-2 transition">
                    <td className="px-6 py-3 text-asvo-text-mid">{item.id}</td>
                    <td className="px-6 py-3 font-medium text-asvo-text">
                      {item.boxId ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-asvo-text-mid">
                      {item.serialNumber || "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-asvo-accent">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-3 text-asvo-text-mid">
                      {item.condition || "—"}
                    </td>
                    <td className="px-6 py-3">
                      {item.disposition ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            item.disposition === "RESTOCK"
                              ? "bg-asvo-green-dim text-asvo-green border-asvo-border"
                              : item.disposition === "REWORK"
                              ? "bg-asvo-blue-dim text-asvo-blue border-asvo-border"
                              : item.disposition === "SCRAP"
                              ? "bg-asvo-amber-dim text-asvo-amber border-asvo-border"
                              : "bg-asvo-red-dim text-asvo-red border-asvo-border"
                          }`}
                        >
                          {DISPOSITION_LABELS[item.disposition] || item.disposition}
                        </span>
                      ) : (
                        <span className="text-asvo-text-dim">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Inspect modal ─── */}
        {inspectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-asvo-surface rounded-xl border border-asvo-border shadow-xl w-full max-w-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-asvo-text flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-asvo-amber" /> Осмотр позиций
                </h3>
                <button
                  onClick={() => setInspectOpen(false)}
                  className="p-1 hover:bg-asvo-surface-2 rounded-lg transition"
                >
                  <X size={18} className="text-asvo-text-dim" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inspectItems.map((ii, idx) => {
                  const srcItem = selected.items?.find((si) => si.id === ii.itemId);
                  return (
                    <div
                      key={ii.itemId}
                      className="bg-asvo-surface-2 p-3 rounded-lg border border-asvo-border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-asvo-text">
                          Позиция #{ii.itemId}
                        </span>
                        {srcItem && (
                          <span className="text-xs text-asvo-text-dim">
                            {srcItem.boxId ? `Box ${srcItem.boxId}` : srcItem.serialNumber || ""}
                            {srcItem.quantity > 0 && `, qty: ${srcItem.quantity}`}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-asvo-text-dim uppercase">
                            Состояние
                          </label>
                          <input
                            value={ii.condition}
                            onChange={(e) => {
                              const copy = [...inspectItems];
                              copy[idx].condition = e.target.value;
                              setInspectItems(copy);
                            }}
                            className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface text-asvo-text text-sm outline-none"
                            placeholder="Описание состояния..."
                          />
                        </div>
                        <div className="w-44">
                          <label className="text-xs font-bold text-asvo-text-dim uppercase">
                            Решение
                          </label>
                          <select
                            value={ii.disposition}
                            onChange={(e) => {
                              const copy = [...inspectItems];
                              copy[idx].disposition = e.target.value;
                              setInspectItems(copy);
                            }}
                            className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface text-asvo-text text-sm outline-none font-medium"
                          >
                            <option value="RESTOCK">Возврат на склад</option>
                            <option value="REWORK">Переработка</option>
                            <option value="SCRAP">Утилизация</option>
                            <option value="DESTROY">Уничтожение</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setInspectOpen(false)}
                  className="px-4 py-2 border border-asvo-border rounded-lg text-asvo-text-mid font-medium hover:bg-asvo-surface-2 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleInspectSubmit}
                  disabled={inspectSubmitting}
                  className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition disabled:opacity-50"
                >
                  {inspectSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Сохранить осмотр
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Decide confirm dialog ─── */}
        {decideConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-asvo-surface rounded-xl border border-asvo-border shadow-xl w-full max-w-sm p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-asvo-green-dim rounded-full">
                  <Gavel size={20} className="text-asvo-green" />
                </div>
                <h3 className="text-lg font-bold text-asvo-text">Принять решение?</h3>
              </div>
              <p className="text-sm text-asvo-text-mid mb-6">
                Возврат <span className="font-bold text-asvo-text">{selected.number}</span> будет
                переведён в статус &laquo;Решение принято&raquo;. Убедитесь, что осмотр
                всех позиций завершён.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDecideConfirmOpen(false)}
                  className="px-4 py-2 border border-asvo-border rounded-lg text-asvo-text-mid font-medium hover:bg-asvo-surface-2 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDecideConfirm}
                  disabled={decideSubmitting}
                  className="flex items-center gap-2 bg-asvo-green text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-green/80 transition disabled:opacity-50"
                >
                  {decideSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════ registry view ═══════════════════ */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* toolbar */}
      <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 text-asvo-text font-bold text-lg">
            <RotateCcw className="text-asvo-accent" /> Возвраты
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Filter size={14} className="text-asvo-text-dim" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm font-medium outline-none"
            >
              <option value="">Все статусы</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s as string] || s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition shadow-sm"
        >
          <Plus size={18} /> Новый возврат
        </button>
      </div>

      {/* create form */}
      {isCreateOpen && (
        <div className="bg-asvo-accent-dim p-4 rounded-xl border border-asvo-border animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">Номер *</label>
              <input
                value={newReturn.number}
                onChange={(e) => setNewReturn({ ...newReturn, number: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="ВЗВ-001"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">ID клиента</label>
              <input
                type="number"
                value={newReturn.customerId}
                onChange={(e) => setNewReturn({ ...newReturn, customerId: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="123"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">
                ID отгрузки (опц.)
              </label>
              <input
                type="number"
                value={newReturn.shipmentId}
                onChange={(e) => setNewReturn({ ...newReturn, shipmentId: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="456"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-asvo-accent uppercase">Причина</label>
              <textarea
                value={newReturn.reason}
                onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                rows={2}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none resize-none"
                placeholder="Причина возврата..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">Примечание</label>
              <input
                value={newReturn.notes}
                onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Доп. информация..."
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-6 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition disabled:opacity-50"
            >
              {creating && <Loader2 size={16} className="animate-spin" />}
              Создать
            </button>
          </div>
        </div>
      )}

      {/* table */}
      <div className="bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-asvo-surface-2 border-b border-asvo-border text-xs font-semibold text-asvo-text-mid uppercase tracking-wider">
              <th className="px-6 py-4">Возврат</th>
              <th className="px-6 py-4">Дата</th>
              <th className="px-6 py-4">Причина</th>
              <th className="px-6 py-4">Статус</th>
              <th className="px-6 py-4 text-right">Создано</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-asvo-border text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-asvo-text-dim">
                  Загрузка...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-asvo-text-dim">
                  Возвраты не найдены
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className="hover:bg-asvo-surface-2 transition cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-asvo-surface-2 rounded-lg text-asvo-text-mid">
                        <RotateCcw size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-asvo-text">{r.number}</div>
                        <div className="text-xs text-asvo-text-dim">ID: {r.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-asvo-text flex items-center gap-1.5">
                      <Calendar size={14} className="text-asvo-text-dim" />
                      {r.date || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-asvo-text-mid truncate" title={r.reason || ""}>
                      {r.reason || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadge(r.status)}`}
                    >
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-asvo-text-mid text-xs">
                    {formatDateTime(r.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* pagination */}
        <div className="p-4 border-t border-asvo-border bg-asvo-surface-2 flex justify-between items-center text-xs text-asvo-text-mid">
          <span>Всего: {totalCount}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-asvo-surface border border-asvo-border rounded hover:bg-asvo-surface-3 disabled:opacity-50 transition"
            >
              Назад
            </button>
            <span className="py-1 px-2">Стр. {page}</span>
            <button
              disabled={rows.length < LIMIT}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-asvo-surface border border-asvo-border rounded hover:bg-asvo-surface-3 disabled:opacity-50 transition"
            >
              Вперед
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

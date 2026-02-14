import React, { useCallback, useEffect, useState } from "react";
import {
  Truck, Plus, Search, Filter, ChevronLeft,
  Package, CheckCircle2, PackageCheck, Send,
  Calendar, Hash, X, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchShipments,
  createShipment,
  fetchShipmentById,
  shipmentPick,
  shipmentVerify,
  shipmentShip,
} from "src/api/warehouseApi";
import { ShipmentModel, ShipmentItemModel } from "src/types/WarehouseModels";
import { formatDateTime } from "../utils";

const STATUSES = ["", "DRAFT", "PICKING", "PACKED", "SHIPPED", "DELIVERED"] as const;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PICKING: "Комплектация",
  PACKED: "Упаковано",
  SHIPPED: "Отгружено",
  DELIVERED: "Доставлено",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-asvo-grey-dim text-asvo-text-mid border-asvo-border";
    case "PICKING":
      return "bg-asvo-blue-dim text-asvo-blue border-asvo-border";
    case "PACKED":
      return "bg-asvo-amber-dim text-asvo-amber border-asvo-border";
    case "SHIPPED":
      return "bg-asvo-green-dim text-asvo-green border-asvo-border";
    case "DELIVERED":
      return "bg-asvo-purple-dim text-asvo-purple border-asvo-border";
    default:
      return "bg-asvo-grey-dim text-asvo-text-mid border-asvo-border";
  }
};

const LIMIT = 20;

export const WarehouseShipments: React.FC = () => {
  /* ─── registry state ─── */
  const [rows, setRows] = useState<ShipmentModel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  /* ─── create form ─── */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    number: "",
    date: "",
    customerId: "",
    contractNumber: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  /* ─── detail view ─── */
  const [selected, setSelected] = useState<ShipmentModel | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ─── pick modal ─── */
  const [pickOpen, setPickOpen] = useState(false);
  const [pickItems, setPickItems] = useState<{ boxId: string; quantity: string }[]>([
    { boxId: "", quantity: "1" },
  ]);
  const [pickSubmitting, setPickSubmitting] = useState(false);

  /* ─── verify modal ─── */
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyItems, setVerifyItems] = useState<
    { itemId: number; packageCondition: "OK" | "DAMAGED" }[]
  >([]);
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  /* ─── ship confirm ─── */
  const [shipConfirmOpen, setShipConfirmOpen] = useState(false);
  const [shipSubmitting, setShipSubmitting] = useState(false);

  /* ═══════════════════ data loading ═══════════════════ */

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchShipments({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
      });
      setRows(res.rows);
      setTotalCount(res.count);
    } catch {
      toast.error("Ошибка загрузки отгрузок");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadShipments, 300);
    return () => clearTimeout(timer);
  }, [loadShipments]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const shipment = await fetchShipmentById(id);
      setSelected(shipment);
    } catch {
      toast.error("Ошибка загрузки отгрузки");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selected) return;
    await openDetail(selected.id);
  };

  /* ═══════════════════ create ═══════════════════ */

  const handleCreate = async () => {
    if (!newShipment.number.trim()) return toast.error("Введите номер отгрузки!");
    setCreating(true);
    try {
      await createShipment({
        number: newShipment.number,
        date: newShipment.date || undefined,
        customerId: newShipment.customerId ? Number(newShipment.customerId) : undefined,
        contractNumber: newShipment.contractNumber || undefined,
        notes: newShipment.notes || undefined,
      });
      toast.success("Отгрузка создана");
      setIsCreateOpen(false);
      setNewShipment({ number: "", date: "", customerId: "", contractNumber: "", notes: "" });
      loadShipments();
    } catch {
      toast.error("Ошибка создания отгрузки");
    } finally {
      setCreating(false);
    }
  };

  /* ═══════════════════ pick ═══════════════════ */

  const openPickForm = () => {
    setPickItems([{ boxId: "", quantity: "1" }]);
    setPickOpen(true);
  };

  const handlePickSubmit = async () => {
    if (!selected) return;
    const items = pickItems
      .filter((i) => i.boxId)
      .map((i) => ({ boxId: Number(i.boxId), quantity: Number(i.quantity) || 1 }));
    if (items.length === 0) return toast.error("Добавьте хотя бы одну позицию!");
    setPickSubmitting(true);
    try {
      await shipmentPick(selected.id, items);
      toast.success("Комплектация выполнена");
      setPickOpen(false);
      await refreshDetail();
      loadShipments();
    } catch {
      toast.error("Ошибка комплектации");
    } finally {
      setPickSubmitting(false);
    }
  };

  /* ═══════════════════ verify ═══════════════════ */

  const openVerifyForm = () => {
    if (!selected?.items?.length) return toast.error("Нет позиций для проверки");
    setVerifyItems(
      selected.items.map((item) => ({
        itemId: item.id,
        packageCondition: (item.packageCondition as "OK" | "DAMAGED") || "OK",
      }))
    );
    setVerifyOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selected) return;
    setVerifySubmitting(true);
    try {
      await shipmentVerify(selected.id, verifyItems);
      toast.success("Проверка упаковки завершена");
      setVerifyOpen(false);
      await refreshDetail();
      loadShipments();
    } catch {
      toast.error("Ошибка проверки");
    } finally {
      setVerifySubmitting(false);
    }
  };

  /* ═══════════════════ ship ═══════════════════ */

  const handleShipConfirm = async () => {
    if (!selected) return;
    setShipSubmitting(true);
    try {
      await shipmentShip(selected.id);
      toast.success("Отгрузка подтверждена");
      setShipConfirmOpen(false);
      await refreshDetail();
      loadShipments();
    } catch {
      toast.error("Ошибка отгрузки");
    } finally {
      setShipSubmitting(false);
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
              <Truck className="text-asvo-accent" /> Отгрузка {selected.number}
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
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Договор</span>
            <span className="text-asvo-text font-medium">{selected.contractNumber || "—"}</span>
          </div>
          <div>
            <span className="text-asvo-text-dim block text-xs uppercase font-bold">Примечание</span>
            <span className="text-asvo-text font-medium">{selected.notes || "—"}</span>
          </div>
        </div>

        {/* workflow actions */}
        <div className="flex gap-3">
          {selected.status === "DRAFT" && (
            <button
              onClick={openPickForm}
              className="flex items-center gap-2 bg-asvo-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-asvo-blue/80 transition"
            >
              <Package size={18} /> Комплектация
            </button>
          )}
          {selected.status === "PICKING" && (
            <button
              onClick={openVerifyForm}
              className="flex items-center gap-2 bg-asvo-amber text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-amber/80 transition"
            >
              <CheckCircle2 size={18} /> Проверка упаковки
            </button>
          )}
          {selected.status === "PACKED" && (
            <button
              onClick={() => setShipConfirmOpen(true)}
              className="flex items-center gap-2 bg-asvo-green text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-green/80 transition"
            >
              <Send size={18} /> Подтвердить отгрузку
            </button>
          )}
        </div>

        {/* items table */}
        <div className="bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
          <div className="px-6 py-3 font-bold text-asvo-text bg-asvo-surface-2 border-b border-asvo-border flex items-center gap-2">
            <PackageCheck size={16} className="text-asvo-accent" /> Позиции отгрузки
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Box ID</th>
                <th className="px-6 py-3 text-right">Кол-во</th>
                <th className="px-6 py-3">Упаковка</th>
                <th className="px-6 py-3">Проверено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asvo-border text-sm">
              {!selected.items || selected.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-asvo-text-dim">
                    Нет позиций
                  </td>
                </tr>
              ) : (
                selected.items.map((item: ShipmentItemModel) => (
                  <tr key={item.id} className="hover:bg-asvo-surface-2 transition">
                    <td className="px-6 py-3 text-asvo-text-mid">{item.id}</td>
                    <td className="px-6 py-3 font-medium text-asvo-text">{item.boxId}</td>
                    <td className="px-6 py-3 text-right font-bold text-asvo-accent">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-3">
                      {item.packageCondition ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            item.packageCondition === "OK"
                              ? "bg-asvo-green-dim text-asvo-green border-asvo-border"
                              : "bg-asvo-red-dim text-asvo-red border-asvo-border"
                          }`}
                        >
                          {item.packageCondition}
                        </span>
                      ) : (
                        <span className="text-asvo-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-asvo-text-mid text-xs">
                      {item.verifiedAt ? formatDateTime(item.verifiedAt) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pick modal ─── */}
        {pickOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-asvo-surface rounded-xl border border-asvo-border shadow-xl w-full max-w-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-asvo-text flex items-center gap-2">
                  <Package size={20} className="text-asvo-blue" /> Комплектация
                </h3>
                <button onClick={() => setPickOpen(false)} className="p-1 hover:bg-asvo-surface-2 rounded-lg transition">
                  <X size={18} className="text-asvo-text-dim" />
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pickItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-asvo-text-dim uppercase">Box ID</label>
                      <input
                        type="number"
                        value={item.boxId}
                        onChange={(e) => {
                          const copy = [...pickItems];
                          copy[idx].boxId = e.target.value;
                          setPickItems(copy);
                        }}
                        className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                        placeholder="ID коробки"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-bold text-asvo-text-dim uppercase">Кол-во</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const copy = [...pickItems];
                          copy[idx].quantity = e.target.value;
                          setPickItems(copy);
                        }}
                        className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                      />
                    </div>
                    {pickItems.length > 1 && (
                      <button
                        onClick={() => setPickItems(pickItems.filter((_, i) => i !== idx))}
                        className="mt-4 p-1 text-asvo-red hover:bg-asvo-red-dim rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPickItems([...pickItems, { boxId: "", quantity: "1" }])}
                className="mt-3 text-sm text-asvo-accent hover:underline font-medium"
              >
                + Добавить позицию
              </button>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setPickOpen(false)}
                  className="px-4 py-2 border border-asvo-border rounded-lg text-asvo-text-mid font-medium hover:bg-asvo-surface-2 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handlePickSubmit}
                  disabled={pickSubmitting}
                  className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition disabled:opacity-50"
                >
                  {pickSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Verify modal ─── */}
        {verifyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-asvo-surface rounded-xl border border-asvo-border shadow-xl w-full max-w-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-asvo-text flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-asvo-amber" /> Проверка упаковки
                </h3>
                <button onClick={() => setVerifyOpen(false)} className="p-1 hover:bg-asvo-surface-2 rounded-lg transition">
                  <X size={18} className="text-asvo-text-dim" />
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {verifyItems.map((vi, idx) => {
                  const srcItem = selected.items?.find((si) => si.id === vi.itemId);
                  return (
                    <div key={vi.itemId} className="flex items-center gap-4 bg-asvo-surface-2 p-3 rounded-lg border border-asvo-border">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-asvo-text">
                          Позиция #{vi.itemId}
                        </span>
                        {srcItem && (
                          <span className="text-xs text-asvo-text-dim ml-2">
                            (Box {srcItem.boxId}, qty: {srcItem.quantity})
                          </span>
                        )}
                      </div>
                      <select
                        value={vi.packageCondition}
                        onChange={(e) => {
                          const copy = [...verifyItems];
                          copy[idx].packageCondition = e.target.value as "OK" | "DAMAGED";
                          setVerifyItems(copy);
                        }}
                        className="p-2 border border-asvo-border rounded-lg bg-asvo-surface text-asvo-text text-sm outline-none font-medium"
                      >
                        <option value="OK">OK</option>
                        <option value="DAMAGED">DAMAGED</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setVerifyOpen(false)}
                  className="px-4 py-2 border border-asvo-border rounded-lg text-asvo-text-mid font-medium hover:bg-asvo-surface-2 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleVerifySubmit}
                  disabled={verifySubmitting}
                  className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition disabled:opacity-50"
                >
                  {verifySubmitting && <Loader2 size={16} className="animate-spin" />}
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Ship confirm dialog ─── */}
        {shipConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-asvo-surface rounded-xl border border-asvo-border shadow-xl w-full max-w-sm p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-asvo-green-dim rounded-full">
                  <Send size={20} className="text-asvo-green" />
                </div>
                <h3 className="text-lg font-bold text-asvo-text">Подтвердить отгрузку?</h3>
              </div>
              <p className="text-sm text-asvo-text-mid mb-6">
                Отгрузка <span className="font-bold text-asvo-text">{selected.number}</span> будет
                переведена в статус &laquo;Отгружено&raquo;. Это действие нельзя отменить.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShipConfirmOpen(false)}
                  className="px-4 py-2 border border-asvo-border rounded-lg text-asvo-text-mid font-medium hover:bg-asvo-surface-2 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleShipConfirm}
                  disabled={shipSubmitting}
                  className="flex items-center gap-2 bg-asvo-green text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-green/80 transition disabled:opacity-50"
                >
                  {shipSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Отгрузить
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
            <Truck className="text-asvo-accent" /> Отгрузки
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
          <Plus size={18} /> Новая отгрузка
        </button>
      </div>

      {/* create form */}
      {isCreateOpen && (
        <div className="bg-asvo-accent-dim p-4 rounded-xl border border-asvo-border animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">Номер *</label>
              <input
                value={newShipment.number}
                onChange={(e) => setNewShipment({ ...newShipment, number: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="ОТГ-001"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">Дата</label>
              <input
                type="date"
                value={newShipment.date}
                onChange={(e) => setNewShipment({ ...newShipment, date: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">ID клиента</label>
              <input
                type="number"
                value={newShipment.customerId}
                onChange={(e) => setNewShipment({ ...newShipment, customerId: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="123"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-asvo-accent uppercase">Номер договора</label>
              <input
                value={newShipment.contractNumber}
                onChange={(e) => setNewShipment({ ...newShipment, contractNumber: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="ДГ-2025-001"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-asvo-accent uppercase">Примечание</label>
              <input
                value={newShipment.notes}
                onChange={(e) => setNewShipment({ ...newShipment, notes: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Комментарий к отгрузке..."
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
              <th className="px-6 py-4">Отгрузка</th>
              <th className="px-6 py-4">Дата</th>
              <th className="px-6 py-4">Договор</th>
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
                  Отгрузки не найдены
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openDetail(s.id)}
                  className="hover:bg-asvo-surface-2 transition cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-asvo-surface-2 rounded-lg text-asvo-text-mid">
                        <Truck size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-asvo-text">{s.number}</div>
                        <div className="text-xs text-asvo-text-dim">ID: {s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-asvo-text flex items-center gap-1.5">
                      <Calendar size={14} className="text-asvo-text-dim" />
                      {s.date || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-asvo-text-mid flex items-center gap-1.5">
                      <Hash size={14} className="text-asvo-text-dim" />
                      {s.contractNumber || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadge(s.status)}`}
                    >
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-asvo-text-mid text-xs">
                    {formatDateTime(s.createdAt)}
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

      {/* detail loading overlay */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-asvo-surface p-6 rounded-xl border border-asvo-border shadow-xl flex items-center gap-3">
            <Loader2 size={24} className="animate-spin text-asvo-accent" />
            <span className="text-asvo-text font-medium">Загрузка...</span>
          </div>
        </div>
      )}
    </div>
  );
};

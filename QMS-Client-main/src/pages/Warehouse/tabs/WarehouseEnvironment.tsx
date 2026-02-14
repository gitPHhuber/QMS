import React, { useEffect, useState, useCallback } from "react";
import {
  Thermometer, Droplets, RefreshCw, Plus, Bell, BellOff,
  CheckCircle2, AlertTriangle, Send
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchEnvironmentReadings, createEnvironmentReading,
  fetchEnvironmentAlerts, acknowledgeEnvironmentAlert, fetchZones
} from "src/api/warehouseApi";
import {
  EnvironmentReadingModel, EnvironmentAlertModel, StorageZoneModel
} from "src/types/WarehouseModels";
import { formatDateTime } from "../utils";

const ALERT_LABELS: Record<string, string> = {
  TEMP_HIGH: "Высокая температура",
  TEMP_LOW: "Низкая температура",
  HUMIDITY_HIGH: "Высокая влажность",
  HUMIDITY_LOW: "Низкая влажность",
};

const ALERT_STYLES: Record<string, string> = {
  TEMP_HIGH: "bg-asvo-red-dim text-asvo-red",
  TEMP_LOW: "bg-asvo-blue-dim text-asvo-blue",
  HUMIDITY_HIGH: "bg-asvo-amber-dim text-asvo-amber",
  HUMIDITY_LOW: "bg-asvo-purple-dim text-asvo-purple",
};

export const WarehouseEnvironment: React.FC = () => {
  const [readings, setReadings] = useState<EnvironmentReadingModel[]>([]);
  const [readingsTotal, setReadingsTotal] = useState(0);
  const [alerts, setAlerts] = useState<EnvironmentAlertModel[]>([]);
  const [zones, setZones] = useState<StorageZoneModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 25;
  const [zoneFilter, setZoneFilter] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [inputForm, setInputForm] = useState({
    zoneId: "" as number | "",
    temperature: "",
    humidity: "",
    notes: "",
  });
  const [inputLoading, setInputLoading] = useState(false);

  const [ackId, setAckId] = useState<number | null>(null);
  const [ackAction, setAckAction] = useState("");

  const loadZones = async () => {
    try {
      const data = await fetchZones();
      setZones(data);
    } catch {
      /* silent */
    }
  };

  const loadReadings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEnvironmentReadings({
        page,
        limit,
        zoneId: zoneFilter || undefined,
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
      });
      setReadings(res.rows);
      setReadingsTotal(res.count);
    } catch {
      toast.error("Ошибка загрузки замеров");
    }
    setLoading(false);
  }, [page, zoneFilter, dateFrom, dateTo]);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchEnvironmentAlerts({
        zoneId: zoneFilter || undefined,
      });
      setAlerts(data);
    } catch {
      /* silent */
    }
  }, [zoneFilter]);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    loadReadings();
    loadAlerts();
  }, [loadReadings, loadAlerts]);

  const handleCreateReading = async () => {
    if (!inputForm.zoneId) return toast.error("Выберите зону");
    if (!inputForm.temperature && !inputForm.humidity)
      return toast.error("Введите температуру или влажность");

    setInputLoading(true);
    try {
      const res = await createEnvironmentReading({
        zoneId: Number(inputForm.zoneId),
        temperature: inputForm.temperature ? Number(inputForm.temperature) : undefined,
        humidity: inputForm.humidity ? Number(inputForm.humidity) : undefined,
        notes: inputForm.notes || undefined,
      });

      toast.success("Замер сохранён");

      if (res.alerts && res.alerts.length > 0) {
        res.alerts.forEach((a) =>
          toast.error(
            `Отклонение: ${ALERT_LABELS[a.alertType] || a.alertType}`,
            { duration: 5000 }
          )
        );
      }

      setInputForm({ zoneId: inputForm.zoneId, temperature: "", humidity: "", notes: "" });
      loadReadings();
      loadAlerts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка сохранения");
    }
    setInputLoading(false);
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeEnvironmentAlert(id, ackAction || undefined);
      toast.success("Отклонение подтверждено");
      setAckId(null);
      setAckAction("");
      loadAlerts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка");
    }
  };

  const reload = () => {
    loadReadings();
    loadAlerts();
  };

  const totalPages = Math.ceil(readingsTotal / limit);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledgedAt);
  const getZoneName = (zoneId: number) => zones.find((z) => z.id === zoneId)?.name || `#${zoneId}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
          <Thermometer className="text-asvo-accent" /> Мониторинг среды
        </h2>
        <div className="flex items-center gap-3">
          {unacknowledgedAlerts.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-asvo-red-dim text-asvo-red rounded-lg text-xs font-bold">
              <Bell size={14} /> {unacknowledgedAlerts.length} отклонений
            </span>
          )}
          <button
            onClick={reload}
            className="p-2 bg-asvo-surface-2 rounded-full hover:bg-asvo-surface-3 transition"
          >
            <RefreshCw size={18} className="text-asvo-text-mid" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Зона</label>
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value ? Number(e.target.value) : "");
              setPage(1);
            }}
            className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
          >
            <option value="">Все зоны</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Дата с</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Дата по</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
          />
        </div>
      </div>

      {/* Main layout: 7 cols journal + 5 cols input/alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Readings journal (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <h3 className="font-bold text-asvo-text flex items-center gap-2">
            <Thermometer size={16} className="text-asvo-accent" />
            Журнал замеров
            <span className="ml-auto text-xs text-asvo-text-dim">
              Всего: {readingsTotal}
            </span>
          </h3>

          {loading ? (
            <div className="text-center py-20 text-asvo-text-dim">Загрузка данных...</div>
          ) : readings.length === 0 ? (
            <div className="text-center py-16 bg-asvo-surface rounded-xl border-2 border-dashed border-asvo-border">
              <Thermometer size={40} className="mx-auto text-asvo-text-dim mb-3" />
              <p className="text-asvo-text-mid text-sm">Замеры не найдены</p>
            </div>
          ) : (
            <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
                  <tr>
                    <th className="px-4 py-3">Зона</th>
                    <th className="px-4 py-3 text-right">Темп. (°C)</th>
                    <th className="px-4 py-3 text-right">Влажн. (%)</th>
                    <th className="px-4 py-3">Дата/Время</th>
                    <th className="px-4 py-3 text-center">Норма</th>
                    <th className="px-4 py-3">Измерил</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-asvo-border text-sm">
                  {readings.map((r) => (
                    <tr key={r.id} className="hover:bg-asvo-surface-2 transition">
                      <td className="px-4 py-2 font-medium text-asvo-text">
                        {r.zone?.name || getZoneName(r.zoneId)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-asvo-text">
                        {r.temperature != null ? `${r.temperature}°` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-asvo-text">
                        {r.humidity != null ? `${r.humidity}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-asvo-text-mid text-xs">
                        {formatDateTime(r.measuredAt)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {r.isWithinLimits === true && (
                          <CheckCircle2 size={16} className="text-asvo-green mx-auto" />
                        )}
                        {r.isWithinLimits === false && (
                          <AlertTriangle size={16} className="text-asvo-red mx-auto" />
                        )}
                        {r.isWithinLimits == null && (
                          <span className="text-asvo-text-dim text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-asvo-text-mid text-xs">
                        {r.measuredBy
                          ? `${r.measuredBy.name} ${r.measuredBy.surname}`
                          : "—"}
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
        </div>

        {/* Right: Quick input + Alerts (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Quick input form */}
          <div className="bg-asvo-surface p-5 rounded-xl border border-asvo-border space-y-4">
            <h3 className="font-bold text-asvo-text flex items-center gap-2">
              <Plus size={16} className="text-asvo-accent" /> Быстрый ввод замера
            </h3>

            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Зона *
              </label>
              <select
                value={inputForm.zoneId}
                onChange={(e) =>
                  setInputForm({
                    ...inputForm,
                    zoneId: e.target.value ? Number(e.target.value) : "",
                  })
                }
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
              >
                <option value="">-- Выберите зону --</option>
                {zones
                  .filter((z) => z.isActive)
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                  <Thermometer size={12} className="inline mr-1" />
                  Температура (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputForm.temperature}
                  onChange={(e) =>
                    setInputForm({ ...inputForm, temperature: e.target.value })
                  }
                  className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                  placeholder="22.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                  <Droplets size={12} className="inline mr-1" />
                  Влажность (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputForm.humidity}
                  onChange={(e) =>
                    setInputForm({ ...inputForm, humidity: e.target.value })
                  }
                  className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                  placeholder="45.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Примечание
              </label>
              <input
                value={inputForm.notes}
                onChange={(e) => setInputForm({ ...inputForm, notes: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Дополнительная информация"
              />
            </div>

            <button
              onClick={handleCreateReading}
              disabled={inputLoading}
              className="w-full flex items-center justify-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition"
            >
              <Send size={16} /> {inputLoading ? "Сохранение..." : "Записать замер"}
            </button>
          </div>

          {/* Active alerts */}
          <div className="bg-asvo-surface p-5 rounded-xl border border-asvo-border space-y-4">
            <h3 className="font-bold text-asvo-text flex items-center gap-2">
              <Bell size={16} className="text-asvo-red" /> Активные отклонения
              {unacknowledgedAlerts.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-asvo-red-dim text-asvo-red rounded text-xs font-bold">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </h3>

            {unacknowledgedAlerts.length === 0 ? (
              <div className="text-center py-6 text-asvo-text-dim text-sm flex flex-col items-center gap-2">
                <BellOff size={24} />
                Нет активных отклонений
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {unacknowledgedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-asvo-surface-2 p-3 rounded-lg border border-asvo-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ALERT_STYLES[alert.alertType] || "bg-asvo-surface-2 text-asvo-text-mid"
                        }`}
                      >
                        {ALERT_LABELS[alert.alertType] || alert.alertType}
                      </span>
                      <span className="text-[10px] text-asvo-text-dim">ID: {alert.id}</span>
                    </div>
                    <div className="text-xs text-asvo-text-mid">
                      Зона: <span className="font-bold text-asvo-text">{alert.zone?.name || getZoneName(alert.zoneId)}</span>
                    </div>

                    {ackId === alert.id ? (
                      <div className="space-y-2">
                        <input
                          value={ackAction}
                          onChange={(e) => setAckAction(e.target.value)}
                          className="w-full p-1.5 border border-asvo-border rounded bg-asvo-surface text-asvo-text text-xs outline-none"
                          placeholder="Принятые меры..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="flex-1 px-2 py-1 bg-asvo-green text-white rounded text-xs font-bold hover:bg-asvo-green/80 transition"
                          >
                            Подтвердить
                          </button>
                          <button
                            onClick={() => {
                              setAckId(null);
                              setAckAction("");
                            }}
                            className="px-2 py-1 bg-asvo-surface text-asvo-text-mid rounded text-xs hover:bg-asvo-surface-3 transition"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAckId(alert.id)}
                        className="w-full px-2 py-1.5 bg-asvo-amber-dim text-asvo-amber rounded text-xs font-bold hover:bg-asvo-amber/20 transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Подтвердить отклонение
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

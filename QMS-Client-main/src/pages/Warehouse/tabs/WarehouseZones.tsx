import React, { useEffect, useState } from "react";
import {
  MapPin, Plus, Save, X, RefreshCw, ToggleLeft, ToggleRight,
  ArrowRight, ShieldCheck, Pencil
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchZones, createZone, updateZone, fetchTransitionRules
} from "src/api/warehouseApi";
import {
  StorageZoneModel, ZoneTransitionRuleModel
} from "src/types/WarehouseModels";
import { ZoneBadge } from "../components/ZoneBadge";

const ZONE_TYPES = [
  "INCOMING", "QUARANTINE", "MAIN", "FINISHED_GOODS", "DEFECT", "SHIPPING",
] as const;

const ZONE_TYPE_LABELS: Record<string, string> = {
  INCOMING: "Приёмка",
  QUARANTINE: "Карантин",
  MAIN: "Основной",
  FINISHED_GOODS: "Гот. продукция",
  DEFECT: "Брак",
  SHIPPING: "Отгрузка",
};

interface ZoneFormData {
  name: string;
  type: StorageZoneModel["type"];
  temp_min: string;
  temp_max: string;
  humidity_min: string;
  humidity_max: string;
  capacity: string;
  isActive: boolean;
}

const emptyForm: ZoneFormData = {
  name: "",
  type: "MAIN",
  temp_min: "",
  temp_max: "",
  humidity_min: "",
  humidity_max: "",
  capacity: "",
  isActive: true,
};

export const WarehouseZones: React.FC = () => {
  const [zones, setZones] = useState<StorageZoneModel[]>([]);
  const [rules, setRules] = useState<ZoneTransitionRuleModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ZoneFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, rulesData] = await Promise.all([
        fetchZones(),
        fetchTransitionRules(),
      ]);
      setZones(zonesData);
      setRules(rulesData);
    } catch {
      toast.error("Ошибка загрузки зон");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (zone: StorageZoneModel) => {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      type: zone.type,
      temp_min: zone.conditions?.temp_min?.toString() ?? "",
      temp_max: zone.conditions?.temp_max?.toString() ?? "",
      humidity_min: zone.conditions?.humidity_min?.toString() ?? "",
      humidity_max: zone.conditions?.humidity_max?.toString() ?? "",
      capacity: zone.capacity?.toString() ?? "",
      isActive: zone.isActive,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Введите название зоны");
    setSaving(true);
    try {
      const conditions: StorageZoneModel["conditions"] = {};
      if (form.temp_min !== "") conditions.temp_min = Number(form.temp_min);
      if (form.temp_max !== "") conditions.temp_max = Number(form.temp_max);
      if (form.humidity_min !== "") conditions.humidity_min = Number(form.humidity_min);
      if (form.humidity_max !== "") conditions.humidity_max = Number(form.humidity_max);

      const payload: Partial<StorageZoneModel> = {
        name: form.name,
        type: form.type,
        conditions: Object.keys(conditions).length > 0 ? conditions : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateZone(editingId, payload);
        toast.success("Зона обновлена");
      } else {
        await createZone(payload);
        toast.success("Зона создана");
      }
      closeForm();
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ошибка сохранения");
    }
    setSaving(false);
  };

  const handleToggleActive = async (zone: StorageZoneModel) => {
    try {
      await updateZone(zone.id, { isActive: !zone.isActive });
      toast.success(zone.isActive ? "Зона деактивирована" : "Зона активирована");
      loadData();
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  const formatConditions = (c: StorageZoneModel["conditions"]) => {
    if (!c) return "—";
    const parts: string[] = [];
    if (c.temp_min != null || c.temp_max != null) {
      parts.push(`${c.temp_min ?? "…"}°C — ${c.temp_max ?? "…"}°C`);
    }
    if (c.humidity_min != null || c.humidity_max != null) {
      parts.push(`${c.humidity_min ?? "…"}% — ${c.humidity_max ?? "…"}%`);
    }
    return parts.length > 0 ? parts.join(" | ") : "—";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
          <MapPin className="text-asvo-accent" /> Зоны хранения
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-asvo-surface-2 rounded-full hover:bg-asvo-surface-3 transition"
          >
            <RefreshCw size={18} className="text-asvo-text-mid" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition"
          >
            <Plus size={18} /> Новая зона
          </button>
        </div>
      </div>

      {/* Inline form */}
      {isFormOpen && (
        <div className="bg-asvo-surface p-5 rounded-xl border border-asvo-accent/30 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-asvo-text">
              {editingId ? "Редактирование зоны" : "Новая зона"}
            </h3>
            <button onClick={closeForm} className="p-1 hover:bg-asvo-surface-2 rounded transition">
              <X size={18} className="text-asvo-text-mid" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Название
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Зона приёмки"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Тип зоны
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as StorageZoneModel["type"] })
                }
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
              >
                {ZONE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ZONE_TYPE_LABELS[t]} ({t})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Вместимость
              </label>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="Макс. кол-во мест"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Темп. мин (°C)
              </label>
              <input
                type="number"
                value={form.temp_min}
                onChange={(e) => setForm({ ...form, temp_min: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Темп. макс (°C)
              </label>
              <input
                type="number"
                value={form.temp_max}
                onChange={(e) => setForm({ ...form, temp_max: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Влажн. мин (%)
              </label>
              <input
                type="number"
                value={form.humidity_min}
                onChange={(e) => setForm({ ...form, humidity_min: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">
                Влажн. макс (%)
              </label>
              <input
                type="number"
                value={form.humidity_max}
                onChange={(e) => setForm({ ...form, humidity_max: e.target.value })}
                className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                placeholder="60"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
              >
                {form.isActive ? (
                  <ToggleRight size={28} className="text-asvo-green" />
                ) : (
                  <ToggleLeft size={28} className="text-asvo-text-dim" />
                )}
              </button>
              <span className="text-sm text-asvo-text-mid font-medium">
                {form.isActive ? "Активна" : "Неактивна"}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 bg-asvo-surface-2 text-asvo-text-mid rounded-lg text-sm font-bold hover:bg-asvo-surface-3 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition"
              >
                <Save size={16} /> {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zones table */}
      {loading ? (
        <div className="text-center py-20 text-asvo-text-dim">Загрузка данных...</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20 bg-asvo-surface rounded-xl border-2 border-dashed border-asvo-border">
          <MapPin size={48} className="mx-auto text-asvo-text-dim mb-4" />
          <p className="text-asvo-text-mid">Зоны хранения не созданы</p>
        </div>
      ) : (
        <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
              <tr>
                <th className="px-6 py-3">Название</th>
                <th className="px-6 py-3">Тип</th>
                <th className="px-6 py-3">Условия хранения</th>
                <th className="px-6 py-3 text-right">Вместимость</th>
                <th className="px-6 py-3 text-center">Статус</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asvo-border text-sm">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-asvo-surface-2 transition">
                  <td className="px-6 py-3">
                    <div className="font-bold text-asvo-text">{zone.name}</div>
                    <div className="text-xs text-asvo-text-dim">ID: {zone.id}</div>
                  </td>
                  <td className="px-6 py-3">
                    <ZoneBadge type={zone.type} size="md" />
                  </td>
                  <td className="px-6 py-3 text-asvo-text-mid text-xs">
                    {formatConditions(zone.conditions)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {zone.capacity != null ? (
                      <span className="font-bold text-asvo-text">
                        {zone.boxCount ?? 0}{" "}
                        <span className="text-asvo-text-dim font-normal">/ {zone.capacity}</span>
                      </span>
                    ) : (
                      <span className="text-asvo-text-dim">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => handleToggleActive(zone)}>
                      {zone.isActive ? (
                        <ToggleRight size={24} className="text-asvo-green" />
                      ) : (
                        <ToggleLeft size={24} className="text-asvo-text-dim" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(zone)}
                      className="p-2 text-asvo-text-dim hover:text-asvo-accent hover:bg-asvo-accent-dim rounded-lg transition"
                      title="Редактировать"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transition rules */}
      {rules.length > 0 && (
        <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
          <div className="px-6 py-3 font-bold text-asvo-text bg-asvo-surface-2 border-b border-asvo-border flex items-center gap-2">
            <ShieldCheck size={18} className="text-asvo-accent" />
            Правила перемещения между зонами
            <span className="ml-auto text-xs bg-asvo-surface px-2 py-0.5 rounded border border-asvo-border">
              Правил: {rules.length}
            </span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
              <tr>
                <th className="px-6 py-3">Из зоны</th>
                <th className="px-6 py-3 text-center" />
                <th className="px-6 py-3">В зону</th>
                <th className="px-6 py-3 text-center">Требует одобрения</th>
                <th className="px-6 py-3">Необходимая роль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-asvo-border text-sm">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-asvo-surface-2 transition">
                  <td className="px-6 py-3">
                    <ZoneBadge type={rule.fromZoneType} size="md" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <ArrowRight size={16} className="text-asvo-text-dim mx-auto" />
                  </td>
                  <td className="px-6 py-3">
                    <ZoneBadge type={rule.toZoneType} size="md" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    {rule.requiresApproval ? (
                      <span className="px-2 py-0.5 bg-asvo-amber-dim text-asvo-amber rounded text-xs font-bold">
                        Да
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-asvo-green-dim text-asvo-green rounded text-xs font-bold">
                        Нет
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-asvo-text-mid">
                    {rule.requiredRole || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { fetchStockBalance, fetchAllLimits, saveLimit } from "src/api/warehouseApi";
import { InventoryLimitModel, StockBalanceItem } from "src/types/WarehouseModels";
import { Search, AlertTriangle, Settings } from "lucide-react";
import toast from "react-hot-toast";

interface SettingsItem {
    label: string;
    originType: string | null;
    originId: number | null;
    current: number;
    min: number;
}

export const WarehouseSettings: React.FC = () => {
    const [items, setItems] = useState<SettingsItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [balance, limits] = await Promise.all([
                fetchStockBalance(),
                fetchAllLimits()
            ]);


            const limitsMap = new Map();
            limits.forEach(l => limitsMap.set(l.label, l.minQuantity));

            const uniqueItems = new Map();

            balance.forEach(b => {
                uniqueItems.set(b.label, {
                    label: b.label,
                    originType: b.originType,
                    originId: b.originId,
                    current: Number(b.totalQuantity),
                    min: limitsMap.get(b.label) || 0
                });
            });

            limits.forEach(l => {
                if (!uniqueItems.has(l.label)) {
                    uniqueItems.set(l.label, {
                        label: l.label,
                        originType: l.originType,
                        originId: l.originId,
                        current: 0,
                        min: l.minQuantity
                    });
                }
            });

            setItems(Array.from(uniqueItems.values()));

        } catch (e) {
            console.error(e);
            toast.error("Ошибка загрузки настроек");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (item: SettingsItem, newMin: string) => {
        const val = parseInt(newMin);
        if (isNaN(val)) return;
        if (val === item.min) return;

        try {
            await saveLimit({
                label: item.label,
                min: val,
                originType: item.originType ?? undefined,
                originId: item.originId ?? undefined
            });
            toast.success(`Лимит для "${item.label}" обновлен`);
            setItems(prev => prev.map(i => i.label === item.label ? { ...i, min: val } : i));
        } catch (e) {
            toast.error("Не удалось сохранить");
        }
    };

    const filteredItems = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
                        <Settings className="text-asvo-accent"/> Настройки склада
                    </h2>
                    <p className="text-sm text-asvo-text-mid mt-1">Установите минимальные остатки для получения уведомлений</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-asvo-text-dim w-4 h-4"/>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-asvo-accent outline-none"
                        placeholder="Поиск по названию..."
                    />
                </div>
            </div>

            <div className="bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-asvo-surface-2 text-xs text-asvo-text-mid uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Наименование</th>
                            <th className="px-6 py-4 text-center">Текущий остаток</th>
                            <th className="px-6 py-4 text-center w-48">Мин. остаток</th>
                            <th className="px-6 py-4">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-asvo-border">
                        {loading && <tr><td colSpan={4} className="p-8 text-center text-asvo-text-dim">Загрузка...</td></tr>}

                        {!loading && filteredItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-asvo-surface-2 transition">
                                <td className="px-6 py-4 font-medium text-asvo-text">{item.label}</td>
                                <td className="px-6 py-4 text-center text-asvo-text-mid font-mono">{item.current}</td>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="number"
                                        defaultValue={item.min}
                                        onBlur={(e) => handleSave(item, e.target.value)}
                                        className="w-24 p-2 text-center border border-asvo-border-lt rounded-lg focus:border-asvo-accent focus:ring-2 focus:ring-asvo-accent outline-none transition"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    {item.min > 0 && item.current < item.min ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-asvo-red bg-asvo-red-dim px-2 py-1 rounded-full w-max">
                                            <AlertTriangle size={12}/> Дефицит (-{item.min - item.current})
                                        </span>
                                    ) : (
                                        item.min > 0 && <span className="text-xs font-bold text-asvo-green bg-asvo-green-dim px-2 py-1 rounded-full">OK</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredItems.length === 0 && (
                    <div className="p-8 text-center text-asvo-text-dim">Ничего не найдено</div>
                )}
            </div>
        </div>
    );
};

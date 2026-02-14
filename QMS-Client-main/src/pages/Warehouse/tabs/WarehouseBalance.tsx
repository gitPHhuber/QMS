import React, { useEffect, useState } from "react";
import { fetchStockBalance, fetchZones } from "src/api/warehouseApi";
import { StockBalanceItem, StorageZoneModel } from "src/types/WarehouseModels";
import { PieChart, RefreshCw, PackageX } from "lucide-react";
import { ZoneBadge } from "../components/ZoneBadge";

export const WarehouseBalance: React.FC = () => {
    const [balance, setBalance] = useState<StockBalanceItem[]>([]);
    const [zones, setZones] = useState<StorageZoneModel[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<number | "">("");
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchStockBalance();
            setBalance(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        fetchZones().then(setZones).catch(console.error);
    }, []);


    const products = balance.filter(i => i.originType === "PRODUCT");
    const components = balance.filter(i => i.originType === "COMPONENT");
    const others = balance.filter(i => i.originType !== "PRODUCT" && i.originType !== "COMPONENT");

    const renderTable = (title: string, items: StockBalanceItem[], colorClass: string) => (
        <div className="mb-8 bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
            <div className={`px-6 py-3 font-bold text-asvo-text bg-asvo-surface-2 border-b border-asvo-border flex justify-between ${colorClass}`}>
                <span>{title}</span>
                <span className="text-xs bg-asvo-surface px-2 py-0.5 rounded border border-asvo-border">Позиций: {items.length}</span>
            </div>
            <table className="w-full text-left">
                <thead className="bg-asvo-surface-2/50 text-xs text-asvo-text-dim uppercase border-b border-asvo-border">
                    <tr>
                        <th className="px-6 py-3">Наименование</th>
                        <th className="px-6 py-3 text-right">Общий остаток</th>
                        <th className="px-6 py-3 text-right">Мест (Коробок)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-asvo-border text-sm">
                    {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-asvo-surface-2 transition">
                            <td className="px-6 py-3 font-medium text-asvo-text">{item.label}</td>
                            <td className="px-6 py-3 text-right font-bold text-asvo-accent">
                                {Number(item.totalQuantity).toLocaleString()} <span className="text-asvo-text-dim font-normal text-xs">{item.unit}</span>
                            </td>
                            <td className="px-6 py-3 text-right text-asvo-text-mid">{item.boxCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-asvo-text flex items-center gap-2">
                    <PieChart className="text-asvo-accent"/> Сводные остатки склада
                </h2>
                <div className="flex items-center gap-3">
                    {zones.length > 0 && (
                        <select
                            value={selectedZoneId}
                            onChange={e => setSelectedZoneId(e.target.value ? Number(e.target.value) : "")}
                            className="p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm outline-none"
                        >
                            <option value="">Все зоны</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.type})</option>)}
                        </select>
                    )}
                    <button onClick={loadData} className="p-2 bg-asvo-surface-2 rounded-full hover:bg-asvo-surface-3 transition"><RefreshCw size={18} className="text-asvo-text-mid"/></button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-asvo-text-dim">Загрузка данных...</div>
            ) : (
                <>
                    {products.length > 0 && renderTable("Готовая продукция", products, "border-l-4 border-l-asvo-purple")}
                    {components.length > 0 && renderTable("Комплектующие и материалы", components, "border-l-4 border-l-asvo-blue")}
                    {others.length > 0 && renderTable("Прочее оборудование", others, "border-l-4 border-l-asvo-grey")}

                    {balance.length === 0 && (
                        <div className="text-center py-20 bg-asvo-surface rounded-xl border-2 border-dashed border-asvo-border">
                            <PackageX size={48} className="mx-auto text-asvo-text-dim mb-4"/>
                            <p className="text-asvo-text-mid">Склад пуст. Примите товар, чтобы увидеть остатки.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

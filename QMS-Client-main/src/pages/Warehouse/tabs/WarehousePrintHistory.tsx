import React, { useEffect, useState } from "react";
import { fetchPrintHistory } from "src/api/warehouseApi";
import {
    Search, Printer, User, History,
    ArrowRight, Tv, Tag, Info, FileText
} from "lucide-react";
import { formatDateTime } from "../utils";
import { Modal } from "src/components/Modal/Modal";
import clsx from "clsx";

export const WarehousePrintHistory: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);


    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [template, setTemplate] = useState("");
    const [dateFrom, setDateFrom] = useState("");


    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchPrintHistory({
                page,
                limit: 20,
                search,
                template,
                dateFrom
            });
            setData(res.rows);
            setTotalCount(res.count);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadData, 500);
        return () => clearTimeout(timer);
    }, [page, search, template, dateFrom]);


    const getTemplateIcon = (type: string) => {
        if (type === "VIDEO_KIT") return <Tv size={16} className="text-asvo-accent"/>;
        return <Tag size={16} className="text-asvo-text-mid"/>;
    };

    return (
        <div className="space-y-6 animate-fade-in">

            <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-3 text-asvo-text font-bold text-lg">
                    <History className="text-asvo-accent" /> История печати
                </div>

                <div className="flex flex-wrap gap-3 flex-1 justify-end">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-asvo-text-dim w-4 h-4" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-asvo-accent outline-none"
                            placeholder="Название, ID или Код..."
                        />
                    </div>

                    <select
                        value={template} onChange={e => setTemplate(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-asvo-surface-2 font-medium"
                    >
                        <option value="">Все шаблоны</option>
                        <option value="VIDEO_KIT">Видеокомплект</option>
                        <option value="SIMPLE">Универсальная</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="p-2 border rounded-lg text-sm text-asvo-text-mid"
                    />
                </div>
            </div>


            <div className="bg-asvo-surface rounded-xl shadow-sm border border-asvo-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-asvo-surface-2 border-b border-asvo-border text-xs font-bold text-asvo-text-mid uppercase">
                        <tr>
                            <th className="px-6 py-4">Дата / Время</th>
                            <th className="px-6 py-4">Сотрудник</th>
                            <th className="px-6 py-4">Шаблон</th>
                            <th className="px-6 py-4">Наименование</th>
                            <th className="px-6 py-4">Диапазон (ID)</th>
                            <th className="px-6 py-4 text-center">Тираж</th>
                            <th className="px-6 py-4 text-right">Инфо</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-asvo-border text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-asvo-text-dim">Загрузка...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-asvo-text-dim">История пуста</td></tr>
                        ) : (
                            data.map(item => (
                                <tr key={item.id} className="hover:bg-asvo-surface-2 transition group">
                                    <td className="px-6 py-4 text-asvo-text-mid whitespace-nowrap">
                                        {formatDateTime(item.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-asvo-surface-2 flex items-center justify-center text-xs font-bold text-asvo-text-dim">
                                                {item.createdBy?.name?.[0] || <User size={12}/>}
                                            </div>
                                            <span className="font-medium text-asvo-text">
                                                {item.createdBy ? `${item.createdBy.surname} ${item.createdBy.name}` : "Система"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getTemplateIcon(item.template)}
                                            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", item.template === "VIDEO_KIT" ? "bg-asvo-accent-dim text-asvo-accent" : "bg-asvo-surface-2 text-asvo-text")}>
                                                {item.template === "VIDEO_KIT" ? "Видео" : "Простая"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-asvo-text max-w-xs truncate" title={item.labelName}>
                                        {item.labelName}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-asvo-text-mid">
                                        {item.quantity > 1 ? (
                                            <div className="flex items-center gap-1">
                                                {item.startCode} <ArrowRight size={10} className="text-asvo-text-dim"/> {item.endCode}
                                            </div>
                                        ) : (
                                            item.startCode
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-lg">{item.quantity}</span>
                                        <span className="text-xs text-asvo-text-dim ml-1">шт</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="p-2 text-asvo-text-dim hover:text-asvo-accent hover:bg-asvo-accent-dim rounded-lg transition"
                                        >
                                            <Info size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>


                <div className="p-4 border-t border-asvo-border bg-asvo-surface-2 flex justify-between items-center text-xs text-asvo-text-mid">
                    <span>Всего записей: {totalCount}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-asvo-surface border rounded hover:bg-asvo-surface-3 disabled:opacity-50">Назад</button>
                        <span className="py-1 px-2">Стр. {page}</span>
                        <button disabled={data.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-asvo-surface border rounded hover:bg-asvo-surface-3 disabled:opacity-50">Вперед</button>
                    </div>
                </div>
            </div>


            <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
                {selectedItem && (
                    <div className="p-6 max-w-lg w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-asvo-accent-dim rounded-full text-asvo-accent">
                                <Printer size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-asvo-text">Детали печати</h3>
                                <p className="text-xs text-asvo-text-mid">ID операции: {selectedItem.id}</p>
                            </div>
                        </div>

                        <div className="space-y-4 bg-asvo-surface-2 p-4 rounded-xl border border-asvo-border text-sm">
                            <div className="flex justify-between">
                                <span className="text-asvo-text-mid">Наименование:</span>
                                <span className="font-bold">{selectedItem.labelName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-asvo-text-mid">Дата печати:</span>
                                <span>{formatDateTime(selectedItem.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-asvo-text-mid">Тираж:</span>
                                <span className="font-bold">{selectedItem.quantity} шт.</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-asvo-text-mid">Размер бумаги:</span>
                                <span>{selectedItem.params?.widthMm} x {selectedItem.params?.heightMm} мм</span>
                            </div>

                            {selectedItem.params?.contract && (
                                <div className="border-t border-asvo-border pt-2 mt-2">
                                    <span className="text-asvo-text-mid block mb-1">Договор:</span>
                                    <p className="bg-asvo-surface p-2 rounded border border-asvo-border text-xs text-asvo-text italic">
                                        {selectedItem.params.contract}
                                    </p>
                                </div>
                            )}


                            <div className="border-t border-asvo-border pt-2 mt-2">
                                <span className="text-asvo-text-mid block mb-1 flex items-center gap-1"><FileText size={12}/> Сырые данные (JSON):</span>
                                <pre className="bg-slate-800 text-green-400 p-2 rounded text-[10px] overflow-auto max-h-32">
                                    {JSON.stringify(selectedItem.params, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedItem(null)}
                            className="w-full mt-6 py-3 bg-asvo-surface-3 text-asvo-text font-bold rounded-xl hover:bg-asvo-surface-3/80 transition"
                        >
                            Закрыть
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

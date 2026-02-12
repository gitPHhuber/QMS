import React, { useEffect, useState } from "react";
import {
    fetchBoxes, updateBoxesBatch, createBoxesBatch,
    printBoxesPdf
} from "src/api/warehouseApi";
import { InventoryBoxModel } from "src/types/WarehouseModels";
import {
    Search, Filter, Printer, Edit,
    Plus, CheckSquare, Square, Tag
} from "lucide-react";
import { Modal } from "src/components/Modal/Modal";
import toast from "react-hot-toast";
import { Preloader } from "src/components/common/Preloader";

export const WarehouseLabels: React.FC = () => {

    const [boxes, setBoxes] = useState<InventoryBoxModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);


    const [search, setSearch] = useState("");
    const [batchFilter, setBatchFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 50;


    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);


    const [createForm, setCreateForm] = useState({
        label: "", quantity: 1, count: 1, batchName: "", projectName: ""
    });


    const [editForm, setEditForm] = useState<Partial<InventoryBoxModel>>({});


    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchBoxes({
                page, limit, search: search || undefined,
                batchName: batchFilter || undefined
            });
            setBoxes(res.rows);
            setTotalCount(res.count);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [page, search, batchFilter]);


    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === boxes.length) setSelectedIds([]);
        else setSelectedIds(boxes.map(b => b.id));
    };

    const handleCreate = async () => {
        if (!createForm.label) return toast.error("Нужно название");
        try {
            await createBoxesBatch({
                label: createForm.label,
                quantity: createForm.count,
                itemsPerBox: createForm.quantity,
                batchName: createForm.batchName,
                projectName: createForm.projectName,
                unit: "шт",
                status: "ON_STOCK"
            });
            toast.success(`Создано ${createForm.count} этикеток`);
            setIsCreateOpen(false);
            loadData();
        } catch (e) { toast.error("Ошибка создания"); }
    };

    const handleBulkEdit = async () => {
        if (selectedIds.length === 0) return;
        try {
            await updateBoxesBatch(selectedIds, editForm);
            toast.success("Обновлено успешно");
            setIsEditOpen(false);
            setEditForm({});
            setSelectedIds([]);
            loadData();
        } catch (e) { toast.error("Ошибка обновления"); }
    };

    const handlePrint = async () => {
        if (selectedIds.length === 0) return toast.error("Выберите этикетки");
        await printBoxesPdf(selectedIds);
    };

    return (
        <div className="space-y-4 animate-fade-in">

            <div className="bg-asvo-surface-2 p-4 rounded-xl shadow-sm border border-asvo-border flex flex-col xl:flex-row justify-between gap-4">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-asvo-text-dim w-5 h-5"/>
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-asvo-accent outline-none"
                            placeholder="Поиск по названию, ID, QR..."
                        />
                    </div>
                    <div className="relative w-64">
                        <Filter className="absolute left-3 top-2.5 text-asvo-text-dim w-5 h-5"/>
                        <input
                            value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-asvo-accent outline-none"
                            placeholder="Фильтр по Партии..."
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 bg-asvo-amber-dim text-asvo-amber px-4 py-2 rounded-lg font-bold hover:bg-asvo-amber/20 transition">
                                <Edit size={18}/> Правка ({selectedIds.length})
                            </button>
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-asvo-accent-dim text-asvo-accent px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/20 transition">
                                <Printer size={18}/> Печать
                            </button>
                        </>
                    )}
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-asvo-accent text-asvo-bg px-4 py-2 rounded-lg font-bold hover:bg-asvo-accent/80 transition shadow-lg">
                        <Plus size={18}/> Создать этикетки
                    </button>
                </div>
            </div>


            <div className="bg-asvo-surface-2 rounded-xl shadow-sm border border-asvo-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-asvo-surface border-b border-asvo-border text-xs font-bold text-asvo-text-mid uppercase">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <button onClick={toggleSelectAll}>
                                        {selectedIds.length > 0 && selectedIds.length === boxes.length
                                            ? <CheckSquare className="text-asvo-accent"/>
                                            : <Square className="text-asvo-text-dim"/>}
                                    </button>
                                </th>
                                <th className="px-4 py-3">ID / Код</th>
                                <th className="px-4 py-3">Наименование (Label)</th>
                                <th className="px-4 py-3">Партия</th>
                                <th className="px-4 py-3">Проект</th>
                                <th className="px-4 py-3">Кол-во</th>
                                <th className="px-4 py-3">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-asvo-border">
                            {loading ? <tr><td colSpan={7} className="p-10"><Preloader/></td></tr> :
                             boxes.map(box => (
                                <tr key={box.id} className={`hover:bg-asvo-accent-dim/50 transition cursor-pointer ${selectedIds.includes(box.id) ? 'bg-asvo-accent-dim' : ''}`} onClick={() => toggleSelect(box.id)}>
                                    <td className="px-4 py-3">
                                        {selectedIds.includes(box.id) ? <CheckSquare className="text-asvo-accent" size={18}/> : <Square className="text-asvo-text-dim" size={18}/>}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-asvo-text-mid">
                                        <div className="font-bold text-asvo-text">#{box.id}</div>
                                        {box.shortCode}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-asvo-text">{box.label}</td>
                                    <td className="px-4 py-3 text-asvo-text-mid">{box.batchName || "—"}</td>
                                    <td className="px-4 py-3 text-asvo-text-mid">{box.projectName || "—"}</td>
                                    <td className="px-4 py-3 font-bold">{box.quantity} {box.unit}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${box.status === 'SCRAP' ? 'bg-asvo-red-dim text-asvo-red' : 'bg-asvo-green-dim text-asvo-green'}`}>
                                            {box.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-asvo-border flex justify-between items-center bg-asvo-surface">
                    <span className="text-xs text-asvo-text-mid">Всего: {totalCount}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded bg-asvo-surface-2 disabled:opacity-50">Назад</button>
                        <button disabled={boxes.length < limit} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded bg-asvo-surface-2 disabled:opacity-50">Вперед</button>
                    </div>
                </div>
            </div>


            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Tag/> Генератор этикеток</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-asvo-text-mid mb-1">Наименование (Что на этикетке)</label>
                            <input className="w-full p-2 border rounded-lg" value={createForm.label} onChange={e => setCreateForm({...createForm, label: e.target.value})} placeholder="Напр. Корпус v1.0" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-asvo-text-mid mb-1">Кол-во в 1 коробке</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={createForm.quantity} onChange={e => setCreateForm({...createForm, quantity: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-asvo-text-mid mb-1">Сколько наклеек создать</label>
                                <input type="number" className="w-full p-2 border rounded-lg bg-asvo-accent-dim font-bold" value={createForm.count} onChange={e => setCreateForm({...createForm, count: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-2 border rounded-lg text-sm" placeholder="Партия (опционально)" value={createForm.batchName} onChange={e => setCreateForm({...createForm, batchName: e.target.value})} />
                            <input className="p-2 border rounded-lg text-sm" placeholder="Проект (опционально)" value={createForm.projectName} onChange={e => setCreateForm({...createForm, projectName: e.target.value})} />
                        </div>
                        <button onClick={handleCreate} className="w-full py-3 bg-asvo-accent text-asvo-bg font-bold rounded-xl hover:bg-asvo-accent/80">Сгенерировать</button>
                    </div>
                </div>
            </Modal>


            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-asvo-amber"><Edit/> Массовая правка ({selectedIds.length})</h2>
                    <p className="text-sm text-asvo-text-mid mb-4">Заполните ТОЛЬКО те поля, которые хотите изменить для всех выбранных коробок.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-asvo-text-mid mb-1">Исправить название</label>
                            <input className="w-full p-2 border rounded-lg" placeholder="Оставьте пустым, чтобы не менять" onChange={e => setEditForm({...editForm, label: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-asvo-text-mid mb-1">Партия</label>
                            <input className="w-full p-2 border rounded-lg" placeholder="Новое название партии" onChange={e => setEditForm({...editForm, batchName: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-asvo-text-mid mb-1">Количество</label>
                                <input type="number" className="w-full p-2 border rounded-lg" placeholder="Не менять" onChange={e => setEditForm({...editForm, quantity: e.target.value ? Number(e.target.value) : undefined})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-asvo-text-mid mb-1">Статус</label>
                                <select className="w-full p-2 border rounded-lg" onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                    <option value="">(Без изменений)</option>
                                    <option value="ON_STOCK">На склад</option>
                                    <option value="SCRAP">БРАК (SCRAP)</option>
                                    <option value="IN_WORK">В работу</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleBulkEdit} className="w-full py-3 bg-asvo-amber text-asvo-bg font-bold rounded-xl hover:bg-asvo-amber/80">Применить изменения</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

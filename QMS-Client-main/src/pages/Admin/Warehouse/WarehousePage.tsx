import React, { useEffect, useState } from "react";
import {
  createSupply,
  fetchSupplies,
  createBox,
  fetchBoxes,
  exportLabelsCsv,
  BoxCreateDto,
  SupplyCreateDto,
} from "src/api/warehouseApi";

import { SupplyModel, InventoryBoxModel } from "src/types/WarehouseModels";
import { fetchStructure } from "src/api/structureApi";

type SectionShort = {
  id: number;
  title: string;
};

export const WarehousePage: React.FC = () => {
  const [supplies, setSupplies] = useState<SupplyModel[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(null);
  const [boxes, setBoxes] = useState<InventoryBoxModel[]>([]);
  const [sections, setSections] = useState<SectionShort[]>([]);


  const [supplier, setSupplier] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [supplyComment, setSupplyComment] = useState("");


  const [sectionId, setSectionId] = useState<number | "">("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("шт");
  const [kitNumber, setKitNumber] = useState("");
  const [boxComment, setBoxComment] = useState("");

  const loadSupplies = async () => {
    const data = await fetchSupplies();
    setSupplies(data);
    if (!selectedSupplyId && data.length > 0) {
      setSelectedSupplyId(data[0].id);
    }
  };

  const loadBoxes = async (supplyId: number) => {
    const data = await fetchBoxes({ supplyId });
    setBoxes(data);
  };

  const loadSections = async () => {
    const structData = await fetchStructure();
    const shorts: SectionShort[] = structData.map((s: any) => ({
      id: s.id,
      title: s.title,
    }));
    setSections(shorts);
  };

  useEffect(() => {
    void loadSupplies();
    void loadSections();
  }, []);

  useEffect(() => {
    if (selectedSupplyId) {
      void loadBoxes(selectedSupplyId);
    } else {
      setBoxes([]);
    }
  }, [selectedSupplyId]);

  const handleCreateSupply = async () => {
    const payload: SupplyCreateDto = {
      supplier: supplier.trim() || undefined,
      docNumber: docNumber.trim() || undefined,
      expectedDate: expectedDate || undefined,
      comment: supplyComment.trim() || undefined,
    };

    const created = await createSupply(payload);
    setSupplier("");
    setDocNumber("");
    setExpectedDate("");
    setSupplyComment("");
    await loadSupplies();
    setSelectedSupplyId(created.id);
  };

  const handleCreateBox = async () => {
    if (!selectedSupplyId) {
      alert("Сначала выберите поставку или создайте новую.");
      return;
    }
    if (!sectionId) {
      alert("Выберите участок.");
      return;
    }
    if (!itemName.trim()) {
      alert("Введите наименование изделия / комплектующего.");
      return;
    }

    const payload: BoxCreateDto = {
      supplyId: selectedSupplyId,
      sectionId: Number(sectionId),
      itemName: itemName.trim(),
      quantity: quantity || 1,
      unit: unit.trim() || "шт",
      kitNumber: kitNumber.trim() || undefined,
      comment: boxComment.trim() || undefined,
    };

    await createBox(payload);
    setItemName("");
    setQuantity(1);
    setUnit("шт");
    setKitNumber("");
    setBoxComment("");
    await loadBoxes(selectedSupplyId);
  };

  const handleExportCsv = async () => {
    if (!selectedSupplyId) {
      alert("Сначала выберите поставку.");
      return;
    }
    const blob = await exportLabelsCsv(selectedSupplyId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asvo_qms_labels_supply_${selectedSupplyId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const currentSupply = supplies.find((s) => s.id === selectedSupplyId);

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-asvo-text mb-4">
        Склад и приёмка
      </h1>
      <p className="text-asvo-text-mid mb-6">
        Здесь принимаем изделия и комплектующие, раскладываем по коробкам и
        генерируем этикетки с префиксом «ASVO-QMS».
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-1 bg-asvo-surface-2 rounded-lg shadow border border-asvo-border p-4">
          <h2 className="text-lg font-semibold text-asvo-text mb-3">Поставки</h2>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {supplies.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSupplyId(s.id)}
                className={`w-full text-left border rounded-md p-3 mb-1 transition ${
                  selectedSupplyId === s.id
                    ? "bg-asvo-accent-dim border-asvo-accent/40"
                    : "bg-asvo-surface hover:bg-asvo-surface-3 border-asvo-border"
                }`}
              >
                <div className="text-sm text-asvo-text-mid">
                  #{s.id} • {new Date(s.createdAt).toLocaleDateString()}
                </div>
                <div className="font-semibold text-asvo-text">
                  {s.supplier || "Без поставщика"}
                </div>
                <div className="text-sm text-asvo-text-mid">
                  Документ: {s.docNumber || "—"}
                </div>
                <div className="text-xs text-asvo-text-dim mt-1">
                  Статус: {s.status}
                </div>
              </button>
            ))}

            {supplies.length === 0 && (
              <div className="text-sm text-asvo-text-dim">
                Поставок пока нет. Создайте первую.
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-asvo-border pt-4">
            <h3 className="text-md font-semibold text-asvo-text mb-2">Новая поставка</h3>
            <div className="space-y-2">
              <input
                className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                placeholder="Поставщик (опционально)"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
              <input
                className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                placeholder="Номер документа"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
              <input
                type="date"
                className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              <textarea
                className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                placeholder="Комментарий"
                value={supplyComment}
                onChange={(e) => setSupplyComment(e.target.value)}
                rows={2}
              />
              <button
                onClick={handleCreateSupply}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded"
              >
                Создать поставку
              </button>
            </div>
          </div>
        </div>


        <div className="xl:col-span-2 space-y-6">
          <div className="bg-asvo-surface-2 rounded-lg shadow border border-asvo-border p-4">
            <h2 className="text-lg font-semibold text-asvo-text mb-3">
              Коробки в поставке{" "}
              {currentSupply
                ? `#${currentSupply.id} (${currentSupply.supplier || "—"})`
                : "—"}
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-asvo-text-mid">
                  Участок, куда пойдёт коробка
                </label>
                <select
                  className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                  value={sectionId}
                  onChange={(e) =>
                    setSectionId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                >
                  <option value="">Не выбрано</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <label className="text-sm text-asvo-text-mid">
                  Наименование (без «ASVO-QMS»)
                </label>
                <input
                  className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                  placeholder="Например: FC 2.4 ГГц, партия 01"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-asvo-text-mid">Количество</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Number(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-sm text-asvo-text-mid">Ед. изм</label>
                    <input
                      className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>

                <label className="text-sm text-asvo-text-mid">
                  Номер комплекта (если нужно)
                </label>
                <input
                  className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                  placeholder="Если пусто — возьмётся номер коробки"
                  value={kitNumber}
                  onChange={(e) => setKitNumber(e.target.value)}
                />

                <label className="text-sm text-asvo-text-mid">Комментарий</label>
                <textarea
                  className="w-full border border-asvo-border bg-asvo-surface rounded px-2 py-1 text-sm text-asvo-text"
                  rows={2}
                  value={boxComment}
                  onChange={(e) => setBoxComment(e.target.value)}
                />
              </div>

              <div className="w-full md:w-52 flex flex-col justify-between">
                <div className="border border-asvo-border rounded-lg p-3 bg-asvo-surface text-sm text-asvo-text-mid mb-3">
                  <div className="font-semibold text-asvo-text mb-1">
                    Предпросмотр этикетки
                  </div>
                  <div className="text-xs text-asvo-text-dim">Имя:</div>
                  <div className="font-medium">
                    {sectionId && itemName
                      ? `ASVO-QMS ${itemName.trim()}${
                          sections.find((s) => s.id === sectionId)
                            ? ` / ${
                                sections.find((s) => s.id === sectionId)?.title
                              }`
                            : ""
                        }`
                      : "Заполните наименование и участок"}
                  </div>
                  <div className="mt-2 text-xs text-asvo-text-dim">
                    Кол-во: {quantity} {unit}
                  </div>
                </div>

                <button
                  onClick={handleCreateBox}
                  className="w-full bg-asvo-accent hover:bg-asvo-accent/80 text-asvo-bg text-sm font-semibold py-2 rounded"
                >
                  Добавить коробку
                </button>

                <button
                  onClick={handleExportCsv}
                  className="w-full mt-2 border border-asvo-green/40 text-asvo-green hover:bg-asvo-green-dim text-sm font-semibold py-2 rounded"
                >
                  Выгрузить этикетки (CSV для Excel)
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="overflow-x-auto max-h-[380px] border border-asvo-border rounded-lg">
                <table className="min-w-full text-sm text-asvo-text">
                  <thead className="bg-asvo-surface sticky top-0">
                    <tr>
                      <th className="px-2 py-1 border-b border-asvo-border">Коробка</th>
                      <th className="px-2 py-1 border-b border-asvo-border">Имя этикетки</th>
                      <th className="px-2 py-1 border-b border-asvo-border">Участок</th>
                      <th className="px-2 py-1 border-b border-asvo-border">Кол-во</th>
                      <th className="px-2 py-1 border-b border-asvo-border">Штрих/QR код</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boxes.map((b) => (
                      <tr key={b.id} className="hover:bg-asvo-surface-3">
                        <td className="px-2 py-1 border-b border-asvo-border">
                          {b.boxNumber || `#${b.id}`}
                        </td>
                        <td className="px-2 py-1 border-b border-asvo-border">{b.displayName}</td>
                        <td className="px-2 py-1 border-b border-asvo-border">
                          {b.section?.title || "—"}
                        </td>
                        <td className="px-2 py-1 border-b border-asvo-border">
                          {b.quantity} {b.unit}
                        </td>
                        <td className="px-2 py-1 border-b border-asvo-border">{b.labelCode}</td>
                      </tr>
                    ))}

                    {boxes.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-3 text-center text-asvo-text-dim"
                        >
                          Для выбранной поставки коробок пока нет.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {boxes.length > 0 && (
                <div className="mt-2 text-xs text-asvo-text-dim">
                  Всего коробок: {boxes.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehousePage;

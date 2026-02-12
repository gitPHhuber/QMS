import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  ClipboardList, AlertCircle, Printer, Copy, Layers, FileSpreadsheet
} from "lucide-react";
import { createBoxesBatch, downloadBoxesExcel, printBoxesPdf } from "src/api/warehouseApi";
import { InventoryBoxModel } from "src/types/WarehouseModels";
import { SectionModel } from "src/store/StructureStore";
import { productModel } from "src/types/ProductModel";
import { LabelPreview } from "../components/LabelPreview";

type WarehouseComponentModel = {
  id: number;
  title: string;
  article?: string | null;
};

interface Props {
  sections: SectionModel[];
  productsList: productModel[];
  componentsList: WarehouseComponentModel[];
}

export const WarehouseIntake: React.FC<Props> = ({ sections, productsList, componentsList }) => {

  const [intakeMode, setIntakeMode] = useState<"PRODUCT" | "COMPONENT" | "OTHER">("PRODUCT");
  const [selectedSkuId, setSelectedSkuId] = useState<number | "">("");
  const [label, setLabel] = useState("");
  const [projectName, setProjectName] = useState("");
  const [batchName, setBatchName] = useState("");


  const [measureType, setMeasureType] = useState<"PCS" | "METERS">("PCS");
  const [unit, setUnit] = useState("шт");
  const [shipmentTotal, setShipmentTotal] = useState<number | "">("");
  const [capacityPerUnit, setCapacityPerUnit] = useState<number>(1);

  const batchCalc = useMemo(() => {
      const total = Number(shipmentTotal) || 0;
      const capacity = Number(capacityPerUnit) || 1;
      if (total === 0) return { fullUnits: 0, remainder: 0, totalUnits: 0 };
      const fullUnits = Math.floor(total / capacity);
      const remainder = total % capacity;
      const totalUnits = fullUnits + (remainder > 0 ? 1 : 0);
      return { fullUnits, remainder, totalUnits };
  }, [shipmentTotal, capacityPerUnit]);

  const [intakeStatus, setIntakeStatus] = useState("QUARANTINE");
  const [intakeSectionId, setIntakeSectionId] = useState<number | "">("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [createdBoxes, setCreatedBoxes] = useState<InventoryBoxModel[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);


  useEffect(() => {
    setUnit(measureType === "PCS" ? "шт" : "м");
  }, [measureType]);


  useEffect(() => {
      if (intakeMode === "PRODUCT" && selectedSkuId) {
          const p = productsList.find(x => x.id === Number(selectedSkuId));
          if(p) setLabel(p.title);
      } else if (intakeMode === "COMPONENT" && selectedSkuId) {
          const c = componentsList.find(x => x.id === Number(selectedSkuId));
          if(c) setLabel(c.title);
      }
  }, [intakeMode, selectedSkuId]);


  const applyTemplate = (type: "CONSUMABLE" | "REAGENT" | "SUBCONTRACT") => {
      if (type === "CONSUMABLE") {
        setLabel("Шприц инъекционный 5 мл (стерильный)");
        setProjectName("Набор процедурный НП-100");
        setBatchName("Партия 2025-01");
        setMeasureType("PCS");
        setShipmentTotal(2000);
        setCapacityPerUnit(100);
        setIntakeNotes("Входной контроль пройден. Сертификат соответствия в комплекте.");
      } else if (type === "REAGENT") {
        setLabel("Реагент диагностический ИФА (набор)");
        setProjectName("Общий запас лаборатории");
        setBatchName("Поставка Янв-25");
        setMeasureType("PCS");
        setShipmentTotal(500);
        setCapacityPerUnit(50);
        setIntakeNotes("Хранение при +2..+8°C. Срок годности 12 мес.");
      } else if (type === "SUBCONTRACT") {
        setLabel("Датчик пульсоксиметра SpO2 (Субподряд)");
        setProjectName("Монитор пациента МП-3");
        setBatchName("От ООО 'МедКомпонент'");
        setMeasureType("PCS");
        setShipmentTotal(1000);
        setCapacityPerUnit(50);
        setIntakeNotes("Компоненты прошли входной контроль, направлены на сборку.");
        setIntakeStatus("IN_WORK");
      }
  };

  const handleCreateBatch = async () => {
    if (!label.trim()) return alert("Введите название!");
    if (batchCalc.totalUnits > 1000) return alert("Слишком много этикеток (>1000).");

    setIntakeLoading(true);
    setIntakeError(null);
    try {
      let autoNote = intakeNotes;
      if (batchCalc.remainder > 0) {
         autoNote += ` | ВНИМАНИЕ: Остаточное место: ${batchCalc.remainder} ${unit}`;
      }

      const res = await createBoxesBatch({
        label, projectName, batchName,
        originType: intakeMode,
        originId: selectedSkuId ? Number(selectedSkuId) : null,
        quantity: batchCalc.totalUnits,
        itemsPerBox: capacityPerUnit,
        unit,
        status: intakeStatus,
        currentSectionId: intakeSectionId ? Number(intakeSectionId) : null,
        notes: autoNote
      });

      setCreatedBoxes(res.boxes);
      setShipmentTotal("");
    } catch (e: any) {
        setIntakeError(e.message || "Ошибка создания");
    }
    finally { setIntakeLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">

        <div className="xl:col-span-8 space-y-6">

            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => applyTemplate("CONSUMABLE")} className="whitespace-nowrap px-4 py-2 bg-asvo-surface border border-asvo-border rounded text-xs font-bold text-asvo-text-mid hover:bg-asvo-blue-dim transition flex gap-2"><Copy size={14}/> Пример: Расходные материалы</button>
                <button onClick={() => applyTemplate("SUBCONTRACT")} className="whitespace-nowrap px-4 py-2 bg-asvo-surface border border-asvo-border rounded text-xs font-bold text-asvo-text-mid hover:bg-asvo-purple-dim transition flex gap-2"><Copy size={14}/> Пример: Субподряд МИ</button>
                <button onClick={() => applyTemplate("REAGENT")} className="whitespace-nowrap px-4 py-2 bg-asvo-surface border border-asvo-border rounded text-xs font-bold text-asvo-text-mid hover:bg-asvo-amber-dim transition flex gap-2"><Copy size={14}/> Пример: Реагенты</button>
            </div>

            <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                <h2 className="text-lg font-bold text-asvo-text mb-6 flex items-center gap-2">
                    <ClipboardList className="text-asvo-accent"/> Новая поставка
                </h2>


                <div className="mb-4">
                    <label className="block text-sm font-semibold text-asvo-text-mid mb-2">Что принимаем?</label>
                    <div className="flex gap-2">
                        {(['PRODUCT', 'COMPONENT', 'OTHER'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => { setIntakeMode(m); setSelectedSkuId(""); setLabel(""); }}
                                className={`flex-1 py-2 rounded-lg border text-sm font-bold transition ${intakeMode === m ? 'bg-asvo-accent text-asvo-bg border-asvo-accent' : 'bg-asvo-surface-2 text-asvo-text-mid border-asvo-border'}`}
                            >
                                {m === 'PRODUCT' ? 'Изделие' : m === 'COMPONENT' ? 'Комплектующее' : 'Прочее'}
                            </button>
                        ))}
                    </div>
                </div>


                {(intakeMode === 'PRODUCT' || intakeMode === 'COMPONENT') && (
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-asvo-text-mid mb-1">Выберите из справочника</label>
                        <select
                            className="w-full p-3 border border-asvo-border rounded-xl bg-asvo-surface-2 text-asvo-text focus:ring-2 focus:ring-asvo-accent"
                            value={selectedSkuId} onChange={e => setSelectedSkuId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">-- Не выбрано --</option>
                            {intakeMode === 'PRODUCT'
                                ? productsList.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                                : componentsList.map(c => <option key={c.id} value={c.id}>{c.title} ({c.article})</option>)
                            }
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Название</label>
                         <input value={label} onChange={e => setLabel(e.target.value)} className="w-full p-3 border border-asvo-border rounded-xl bg-asvo-surface-2 text-asvo-text" placeholder="Например: Контроллер FC v2.4"/>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Партия</label>
                         <input value={batchName} onChange={e => setBatchName(e.target.value)} className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm" placeholder="№ партии" />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-asvo-text-dim uppercase mb-1">Проект</label>
                         <input value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text text-sm" placeholder="Опционально" />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-asvo-text-dim mb-1 uppercase">Куда (Участок)</label>
                         <select value={intakeSectionId} onChange={e => setIntakeSectionId(Number(e.target.value))} className="w-full p-2 border border-asvo-border rounded-lg text-sm bg-asvo-surface-2 text-asvo-text">
                            <option value="">-- Склад Приёмки --</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-asvo-text-dim mb-1 uppercase">Статус</label>
                         <select value={intakeStatus} onChange={e => setIntakeStatus(e.target.value)} className="w-full p-2 border border-asvo-border rounded-lg text-sm bg-asvo-surface-2 text-asvo-text">
                             <option value="QUARANTINE">Карантин (Входной контроль)</option>
                             <option value="ON_STOCK">На складе (Годен)</option>
                             <option value="IN_WORK">Сразу в работу</option>
                             <option value="UNDER_REVIEW">На проверке</option>
                             <option value="REJECTED">Забраковано</option>
                             <option value="RETURN_TO_SUPPLIER">Возврат поставщику</option>
                         </select>
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-xs font-medium text-asvo-text-dim mb-1 uppercase">Примечание</label>
                         <input value={intakeNotes} onChange={e => setIntakeNotes(e.target.value)} className="w-full p-2 border border-asvo-border rounded-lg text-sm bg-asvo-surface-2 text-asvo-text" placeholder="..." />
                     </div>
                </div>


                <div className="bg-asvo-accent-dim p-4 rounded-xl border border-asvo-accent/20 mb-6">
                    <div className="flex justify-between mb-2">
                        <h4 className="text-sm font-bold text-asvo-accent flex items-center gap-2"><Layers size={14}/> Расчет мест</h4>
                        <div className="flex text-[10px] font-bold bg-asvo-surface rounded border border-asvo-border overflow-hidden">
                            <button onClick={() => setMeasureType("PCS")} className={`px-2 py-1 ${measureType === 'PCS' ? 'bg-asvo-accent-dim text-asvo-accent' : 'text-asvo-text-dim'}`}>ШТ</button>
                            <button onClick={() => setMeasureType("METERS")} className={`px-2 py-1 ${measureType === 'METERS' ? 'bg-asvo-accent-dim text-asvo-accent' : 'text-asvo-text-dim'}`}>МЕТРЫ</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                         <div>
                             <label className="text-xs text-asvo-text-mid">Всего пришло ({unit})</label>
                             <input type="number" min={1} value={shipmentTotal} onChange={e => setShipmentTotal(Number(e.target.value))} className="w-full p-2 border border-asvo-border rounded-lg font-bold bg-asvo-surface-2 text-asvo-text" placeholder="0"/>
                         </div>
                         <div>
                             <label className="text-xs text-asvo-text-mid">В одной таре ({unit})</label>
                             <input type="number" min={1} value={capacityPerUnit} onChange={e => setCapacityPerUnit(Number(e.target.value))} className="w-full p-2 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text" placeholder="1"/>
                         </div>
                    </div>

                    <div className="text-sm text-asvo-accent font-medium flex justify-between items-center pt-2 border-t border-asvo-accent/20">
                        <span>Будет создано этикеток:</span>
                        <span className="text-xl font-black">{batchCalc.totalUnits}</span>
                    </div>
                    {batchCalc.remainder > 0 && (
                        <div className="mt-2 text-xs text-asvo-amber font-bold flex items-center gap-1">
                            <AlertCircle size={12}/> {batchCalc.fullUnits} полных + 1 с остатком ({batchCalc.remainder} {unit})
                        </div>
                    )}
                </div>

                {intakeError && <div className="text-sm text-asvo-red mb-4 p-3 bg-asvo-red-dim rounded-lg">{intakeError}</div>}

                <div className="flex justify-end">
                     <button
                        onClick={handleCreateBatch} disabled={intakeLoading || !label}
                        className="bg-asvo-accent hover:bg-asvo-accent/80 text-asvo-bg px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2"
                     >
                        {intakeLoading ? "..." : <Printer size={20}/>} Создать партию
                     </button>
                </div>
            </div>


            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-asvo-text">Результат ({createdBoxes.length})</h3>
                    <div className="flex gap-2">

                        {createdBoxes.length > 0 && (
                            <button
                                onClick={() => printBoxesPdf(createdBoxes.map(b => b.id))}
                                className="flex items-center gap-2 text-sm font-bold text-white bg-asvo-accent px-3 py-2 rounded-lg hover:bg-asvo-accent/80 transition shadow-md"
                            >
                                <Printer size={18}/> PDF
                            </button>
                        )}

                        {createdBoxes.length > 0 && (
                            <button
                                onClick={() => downloadBoxesExcel(createdBoxes.map(b => b.id))}
                                className="flex items-center gap-2 text-sm font-bold text-asvo-green bg-asvo-green-dim px-3 py-2 rounded-lg hover:bg-asvo-green/20 transition"
                            >
                                <FileSpreadsheet size={18}/> Excel
                            </button>
                        )}
                    </div>
                </div>

                {createdBoxes.length === 0 && <div className="text-center py-10 bg-asvo-surface rounded-2xl border-2 border-dashed border-asvo-border text-asvo-text-dim">Здесь появятся этикетки</div>}

                <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {createdBoxes.map(box => (
                        <div key={box.id} className="bg-asvo-surface p-4 rounded-xl border border-asvo-border shadow-sm flex flex-col items-center text-center relative group hover:border-asvo-accent transition">
                            <div className="absolute top-2 left-2 text-[10px] font-mono bg-asvo-surface-2 px-1.5 rounded text-asvo-text-dim font-bold">{box.shortCode}</div>
                            <div className="mb-2 bg-white p-1 rounded"><QRCode value={box.qrCode} size={80} /></div>
                            <div className="text-xs font-bold text-asvo-text w-full truncate">{box.label}</div>
                            <div className="text-[10px] text-asvo-text-dim mt-1">ID: {box.id}</div>
                            <div className="mt-2 bg-asvo-surface-3 text-asvo-text text-xs font-bold px-2 py-0.5 rounded">{box.quantity} {box.unit}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="xl:col-span-4">
            <div className="sticky top-6 flex justify-center">
                <LabelPreview label={label || "Название"} project={projectName} batch={batchName} id="###" qrValue={`BOX-FULL`} qty={capacityPerUnit} unit={unit} />
            </div>
        </div>
    </div>
  );
};

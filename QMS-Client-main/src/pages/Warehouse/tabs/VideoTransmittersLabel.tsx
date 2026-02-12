import React, { useState, useMemo, useEffect } from "react";
import {
    Printer, RefreshCw, ArrowRight,
    Tv, Tag, Ruler, Trash2, FolderOpen, PenTool, LayoutTemplate,

    Wine, Umbrella, ArrowUp, Snowflake, Flame, Package, AlertTriangle
} from "lucide-react";
import { printSpecialLabel } from "src/api/warehouseApi";
import {
    fetchLabelTemplates,
    createLabelTemplate,
    deleteLabelTemplate,
    LabelTemplateModel,
    LabelElement
} from "src/api/labelTemplatesApi";
import { LabelConstructor } from "../components/LabelConstructor";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import clsx from "clsx";

type TemplateType = "VIDEO_KIT" | "SIMPLE" | "CUSTOM";


const LabelPreviewCard: React.FC<{
    data: any,
    title: string,
    template: TemplateType,
    size: { w: number, h: number },
    customLayout?: LabelElement[],
    currentIndex?: number,
    totalCount?: number
}> = ({ data, title, template, size, customLayout, currentIndex = 1, totalCount = 1 }) => {

    const infoString = `${data.productName} - ${data.quantity} ${data.unit} (ID: ${data.code})`;


    const baseWidthPx = 300;
    const cssHeight = size.w > 0 ? (baseWidthPx * (size.h / size.w)) : 190;


    const replaceVars = (text: string) => {
        if (!text) return '';
        return text

            .replace(/\{\{code\}\}/g, data.code || '')
            .replace(/\{\{name\}\}/g, data.productName || '')
            .replace(/\{\{productName\}\}/g, data.productName || '')
            .replace(/\{\{id\}\}/g, data.id || '')
            .replace(/\{\{date\}\}/g, data.date || '')
            .replace(/\{\{serial\}\}/g, data.code || '')
            .replace(/\{\{contract\}\}/g, data.contract || '')
            .replace(/\{\{batch\}\}/g, data.batch || '')
            .replace(/\{\{qty\}\}/g, String(data.quantity || ''))
            .replace(/\{\{quantity\}\}/g, String(data.quantity || ''))
            .replace(/\{\{unit\}\}/g, data.unit || '')
            .replace(/\{\{price\}\}/g, data.price || '')
            .replace(/\{\{weight\}\}/g, data.weight || '')

            .replace(/\{\{url\}\}/g, `https://mes.local/item/${data.code}`)

            .replace(/\{\{full_info\}\}/g, infoString)
            .replace(/\{\{quantity_unit\}\}/g, `${data.quantity} ${data.unit}`)

            .replace(/\{\{current\}\}/g, String(currentIndex))
            .replace(/\{\{total\}\}/g, String(totalCount));
    };

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <div className="text-xs font-bold text-asvo-text-dim uppercase mb-2 bg-asvo-surface-2 px-2 py-1 rounded shadow-sm border border-asvo-border">
                {title}
            </div>

            <div className="bg-white shadow-2xl transition-all duration-300">
                <div
                    className="bg-white relative flex flex-col box-border overflow-hidden"
                    style={{
                        width: `${baseWidthPx}px`,
                        height: `${cssHeight}px`,
                        border: '1px solid #000'
                    }}
                >

                    {template === "VIDEO_KIT" && (
                        <div className="flex flex-row h-full p-2">
                            <div className="w-6 border-r border-black flex items-end justify-center py-2 bg-gray-50">
                                <div className="text-[8px] whitespace-nowrap -rotate-90 origin-bottom-left translate-x-full mb-4 w-40 truncate font-mono">
                                    {data.contract}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col pl-2">
                                <div className="flex justify-between items-start mb-2 shrink-0">
                                    <div className="font-mono text-sm font-bold truncate mt-1">{data.code}</div>
                                    <div><QRCode value={data.code} size={35} /></div>
                                </div>
                                <div className="border-2 border-black text-center text-xs w-full mb-2">
                                    <div className="border-b border-black p-1 font-bold bg-gray-50">{data.productName}</div>
                                    <div className="flex border-b border-black h-10">
                                        <div className="border-r border-black w-1/3 font-bold flex items-center justify-center text-lg">{data.id}</div>
                                        <div className="w-2/3 flex flex-col">
                                            <div className="border-b border-black h-1/2 flex items-center justify-center text-[9px]">{data.date}</div>
                                            <div className="h-1/2 font-bold flex items-center justify-center text-sm">{data.quantity} {data.unit}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto flex justify-center pb-2">
                                    <QRCode value={infoString} size={60} />
                                </div>
                            </div>
                        </div>
                    )}


                    {template === "SIMPLE" && (
                        <div className="h-full flex flex-col justify-center items-center p-2">
                            <div className="text-sm font-bold text-center mb-2 leading-tight">{data.productName}</div>
                            <div className="flex items-center gap-4 w-full justify-center">
                                <QRCode value={infoString} size={70} />
                                <div className="text-left overflow-hidden">
                                    <div className="text-[9px] text-gray-500 uppercase">ID / Партия</div>
                                    <div className="font-mono font-bold text-sm mb-1 truncate">{data.code}</div>
                                    <div className="font-black text-xl">{data.quantity} {data.unit}</div>
                                </div>
                            </div>
                        </div>
                    )}


                    {template === "CUSTOM" && customLayout && customLayout.map(el => {

                        const elStyle: React.CSSProperties = {
                            position: 'absolute',
                            left: `${(el.x / size.w) * 100}%`,
                            top: `${(el.y / size.h) * 100}%`,
                            width: `${(el.width / size.w) * 100}%`,
                            height: ['QR', 'ICON', 'IMAGE', 'RECTANGLE'].includes(el.type)
                                ? `${(el.height / size.h) * 100}%`
                                : 'auto',
                            fontSize: `${(el.fontSize || 10) * (baseWidthPx / size.w) * 0.35}px`,
                            fontWeight: el.isBold ? 'bold' : 'normal',
                            textAlign: el.align || 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
                            overflow: 'hidden',
                        };

                        return (
                            <div key={el.id} style={elStyle}>


                                {el.type === 'TEXT' && (
                                    <span className="whitespace-pre-wrap break-words leading-tight">
                                        {replaceVars(el.content || '')}
                                    </span>
                                )}


                                {el.type === 'QR' && (
                                    <QRCode
                                        value={replaceVars(el.content || '{{code}}')}
                                        style={{ width: '100%', height: '100%' }}
                                        viewBox="0 0 256 256"
                                    />
                                )}


                                {el.type === 'COUNTER' && (
                                    <span
                                        className="whitespace-nowrap font-mono"
                                        style={{ fontWeight: el.isBold ? 'bold' : 'normal' }}
                                    >
                                        {replaceVars(el.counterFormat || '{{current}} / {{total}}')}
                                    </span>
                                )}


                                {el.type === 'IMAGE' && el.imageUrl && (
                                    <img
                                        src={el.imageUrl}
                                        alt={el.imageName || 'Image'}
                                        className="w-full h-full object-contain"
                                    />
                                )}


                                {el.type === 'ICON' && (
                                    <div className="w-full h-full flex items-center justify-center p-0.5">

                                        {el.imageUrl ? (
                                            <img src={el.imageUrl} alt={el.content || 'Icon'} className="w-full h-full object-contain" />
                                        ) : (

                                            <>
                                                {el.iconType === 'fragile' && <Wine className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'keep_dry' && <Umbrella className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'this_side_up' && <ArrowUp className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'keep_frozen' && <Snowflake className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'keep_away_heat' && <Flame className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'do_not_stack' && <Package className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                                {el.iconType === 'warning' && <AlertTriangle className="w-full h-full text-gray-800" strokeWidth={1.5} />}
                                            </>
                                        )}
                                    </div>
                                )}


                                {el.type === 'LINE' && (
                                    <div
                                        className="bg-black"
                                        style={{
                                            width: el.width >= el.height ? '100%' : `${(el.strokeWidth || 0.3) * 3}px`,
                                            height: el.width >= el.height ? `${(el.strokeWidth || 0.3) * 3}px` : '100%',
                                        }}
                                    />
                                )}


                                {el.type === 'RECTANGLE' && (
                                    <div
                                        className="w-full h-full border-black"
                                        style={{ borderWidth: `${(el.strokeWidth || 0.3) * 2}px` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="mt-2 text-[10px] text-asvo-text-dim font-mono">
                {size.w} x {size.h} мм
            </div>
        </div>
    );
};


export const VideoTransmittersLabel: React.FC = () => {
    const [templateType, setTemplateType] = useState<TemplateType>("VIDEO_KIT");


    const [form, setForm] = useState({
        code: "7342511000501",
        productName: "Приемник 2xLR1121",
        id: "734",
        date: new Date().toLocaleString('ru-RU'),
        quantity: "500",
        unit: "шт.",
        contract: "Г.к. № 249/2/ОП/25/1/37 от «05» сентября 2025 г."
    });

    const [printCount, setPrintCount] = useState<number>(1);
    const [labelSize, setLabelSize] = useState({ width: 140, height: 90 });
    const [loading, setLoading] = useState(false);


    const [isConstructorMode, setIsConstructorMode] = useState(false);
    const [customLayout, setCustomLayout] = useState<LabelElement[]>([]);
    const [customTemplateName, setCustomTemplateName] = useState("");


    const [savedTemplates, setSavedTemplates] = useState<LabelTemplateModel[]>([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await fetchLabelTemplates();
            setSavedTemplates(data);
        } catch (e) {
            console.error(e);
        }
    };


    const endCode = useMemo(() => {
        try {
            const cleanCode = form.code.replace(/\D/g, '');
            if(!cleanCode) return form.code;
            const startBig = BigInt(cleanCode);
            const countBig = BigInt(Math.max(1, printCount));
            const endBig = startBig + countBig - 1n;
            return endBig.toString().padStart(cleanCode.length, '0');
        } catch {
            return form.code;
        }
    }, [form.code, printCount]);

    const handlePrint = async () => {
        if (printCount < 1) return toast.error("Количество копий должно быть > 0");
        setLoading(true);
        try {
            await printSpecialLabel({
                ...form,
                template: templateType,

                customLayout: templateType === "CUSTOM" ? customLayout : undefined,
                printCount,
                rotate: false,
                widthMm: labelSize.width,
                heightMm: labelSize.height
            });
            toast.success(`Отправлено ${printCount} этикеток`);
        } catch (e: any) {
            toast.error("Ошибка печати: " + e.message);
        } finally {
            setLoading(false);
        }
    };


    const onSaveConstructor = async (name: string, w: number, h: number, layout: LabelElement[]) => {
        try {
            await createLabelTemplate(name, w, h, layout);
            toast.success("Шаблон сохранен в базу!");
            setIsConstructorMode(false);
            loadTemplates();


            setTemplateType("CUSTOM");
            setCustomLayout(layout);
            setCustomTemplateName(name);
            setLabelSize({ width: w, height: h });
        } catch (e) {
            toast.error("Ошибка сохранения");
        }
    };


    const applySavedTemplate = (t: LabelTemplateModel) => {
        setIsConstructorMode(false);
        setTemplateType("CUSTOM");
        setLabelSize({ width: t.width, height: t.height });
        setCustomLayout(t.layout || []);
        setCustomTemplateName(t.name);
        toast.success(`Загружен макет: ${t.name}`);
    };

    const deleteSavedTemplate = async (id: number) => {
        if(!confirm("Удалить шаблон?")) return;
        await deleteLabelTemplate(id);
        loadTemplates();
        if(customTemplateName && templateType === 'CUSTOM') {
             setTemplateType("VIDEO_KIT");
             setCustomTemplateName("");
        }
    };

    const updateTime = () => {
        setForm(prev => ({...prev, date: new Date().toLocaleString('ru-RU')}));
    };

    const _toggleRotation = () => {
        setLabelSize({ width: labelSize.height, height: labelSize.width });
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-10">


            <div className="mb-6 flex flex-col md:flex-row justify-center items-center gap-4">
                <div className="bg-asvo-surface p-1 rounded-xl border border-asvo-border shadow-sm inline-flex gap-1">
                    <button onClick={() => {setTemplateType("VIDEO_KIT"); setIsConstructorMode(false); setLabelSize({width: 140, height: 90})}} className={clsx("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", templateType === "VIDEO_KIT" && !isConstructorMode ? "bg-asvo-accent text-asvo-bg shadow-md" : "text-asvo-text-mid hover:bg-asvo-surface-2")}>
                        <Tv size={18}/> Стандартный
                    </button>
                    <button onClick={() => {setTemplateType("SIMPLE"); setIsConstructorMode(false); setLabelSize({width: 100, height: 60})}} className={clsx("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", templateType === "SIMPLE" && !isConstructorMode ? "bg-asvo-accent text-asvo-bg shadow-md" : "text-asvo-text-mid hover:bg-asvo-surface-2")}>
                        <Tag size={18}/> Простой
                    </button>

                    <button onClick={() => {setTemplateType("CUSTOM"); setIsConstructorMode(false)}} className={clsx("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", templateType === "CUSTOM" && !isConstructorMode ? "bg-asvo-accent text-asvo-bg shadow-md" : "text-asvo-text-mid hover:bg-asvo-surface-2")}>
                        <LayoutTemplate size={18}/> {customTemplateName || "Мои шаблоны"}
                    </button>
                </div>

                <button
                    onClick={() => setIsConstructorMode(!isConstructorMode)}
                    className={clsx("px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border", isConstructorMode ? "bg-asvo-red-dim text-asvo-red border-asvo-red/30" : "bg-asvo-surface text-asvo-accent border-asvo-accent/30 hover:bg-asvo-accent-dim")}
                >
                    {isConstructorMode ? <Trash2 size={18}/> : <PenTool size={18}/>}
                    {isConstructorMode ? "Закрыть редактор" : "Конструктор"}
                </button>
            </div>


            {isConstructorMode ? (
                <LabelConstructor
                    initialWidth={labelSize.width}
                    initialHeight={labelSize.height}
                    initialLayout={templateType === 'CUSTOM' ? customLayout : []}
                    onSave={onSaveConstructor as any}
                    onClose={() => setIsConstructorMode(false)}
                />
            ) : (
                <div className="flex flex-col xl:flex-row gap-8">


                    <div className="flex-1 space-y-5 bg-asvo-surface p-6 rounded-3xl shadow-xl border border-asvo-border">
                        <div className="flex items-center gap-2 text-asvo-accent border-b border-asvo-border pb-4 mb-2">
                            <Printer className="text-asvo-accent"/>
                            <h2 className="text-xl font-bold">Параметры печати</h2>
                        </div>


                        {savedTemplates.length > 0 && (
                            <div className="bg-asvo-surface-2 p-3 rounded-xl border border-asvo-border">
                                <div className="text-[10px] font-bold text-asvo-text-dim uppercase flex items-center gap-2 mb-2">
                                    <FolderOpen size={12}/> Выберите шаблон:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {savedTemplates.map(t => (
                                        <div key={t.id} className={clsx("group flex items-center bg-asvo-surface border rounded-lg overflow-hidden shadow-sm transition cursor-pointer", customTemplateName === t.name ? "border-asvo-accent ring-1 ring-asvo-accent" : "border-asvo-border-lt hover:border-asvo-accent/50")}>
                                            <div onClick={() => applySavedTemplate(t)} className="px-3 py-1.5 text-xs font-bold text-asvo-text hover:text-asvo-accent">
                                                {t.name} <span className="text-asvo-text-dim font-normal ml-1">{t.width}x{t.height}</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSavedTemplate(t.id); }} className="px-2 py-1.5 hover:bg-asvo-red-dim text-asvo-text-dim hover:text-asvo-red border-l border-asvo-border">
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">Наименование</label>
                                <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg font-bold text-asvo-text bg-asvo-surface-2 focus:border-asvo-accent outline-none" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">ID / Номер</label>
                                <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text focus:border-asvo-accent outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">Дата</label>
                                <div className="flex gap-1">
                                    <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg text-sm bg-asvo-surface-2 text-asvo-text focus:border-asvo-accent outline-none" />
                                    <button onClick={updateTime} className="p-2.5 bg-asvo-surface-2 rounded-lg hover:bg-asvo-surface-3 text-asvo-text-mid"><RefreshCw size={16}/></button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">Кол-во</label>
                                <input value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text focus:border-asvo-accent outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">Ед. изм.</label>
                                <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg bg-asvo-surface-2 text-asvo-text focus:border-asvo-accent outline-none" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-asvo-text-mid uppercase">Договор / Инфо</label>
                                <input value={form.contract} onChange={e => setForm({...form, contract: e.target.value})} className="w-full p-2.5 border border-asvo-border rounded-lg text-sm bg-asvo-surface-2 text-asvo-text focus:border-asvo-accent outline-none" />
                            </div>
                        </div>


                        <div className="bg-asvo-accent-dim p-4 rounded-xl border border-asvo-accent/20 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-asvo-accent uppercase flex justify-between">
                                    <span>Стартовый номер (Для QR)</span>
                                </label>
                                <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-3 border-2 border-asvo-accent/30 rounded-xl font-mono text-xl font-black text-asvo-text bg-asvo-surface focus:border-asvo-accent outline-none shadow-sm" />
                            </div>

                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-asvo-accent uppercase mb-1 block">Тираж</label>
                                    <input type="number" min="1" max="1000" value={printCount} onChange={e => setPrintCount(Number(e.target.value))} className="w-full p-3 border-2 border-asvo-accent/30 rounded-xl font-bold text-lg bg-asvo-surface text-asvo-text" />
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-asvo-surface rounded-xl border border-asvo-accent/20">
                                    <Ruler size={18} className="text-asvo-accent"/>
                                    <div className="text-xs font-bold text-asvo-text">{labelSize.width} x {labelSize.height} мм</div>
                                </div>
                            </div>

                            <div className="text-xs text-asvo-accent flex items-center justify-between">
                                <span>Диапазон:</span>
                                <div className="font-mono font-bold">{form.code} <ArrowRight size={12} className="inline"/> {endCode}</div>
                            </div>

                            <button onClick={handlePrint} disabled={loading} className="w-full py-4 bg-asvo-accent hover:bg-asvo-accent/80 text-asvo-bg font-bold text-xl rounded-xl shadow-lg transition flex justify-center items-center gap-3">
                                {loading ? "Генерация..." : <><Printer /> ПЕЧАТЬ</>}
                            </button>
                        </div>
                    </div>


                    <div className="flex-1 bg-asvo-surface-2 rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-asvo-border min-h-[500px] sticky top-6">
                        <div className="grid grid-cols-1 gap-12 w-full place-items-center max-h-[800px] overflow-y-auto custom-scrollbar">
                            <LabelPreviewCard
                                title="Первая в серии"
                                data={form}
                                template={templateType}
                                size={{ w: labelSize.width, h: labelSize.height }}
                                customLayout={templateType === 'CUSTOM' ? customLayout : undefined}
                                currentIndex={1}
                                totalCount={printCount}
                            />
                            {printCount > 1 && (
                                <>
                                    <div className="text-asvo-text-dim -my-6"><ArrowRight className="rotate-90" size={32}/></div>
                                    <LabelPreviewCard
                                        title={`Последняя (№${printCount})`}
                                        data={{...form, code: endCode}}
                                        template={templateType}
                                        size={{ w: labelSize.width, h: labelSize.height }}
                                        customLayout={templateType === 'CUSTOM' ? customLayout : undefined}
                                        currentIndex={printCount}
                                        totalCount={printCount}
                                    />
                                </>
                            )}
                        </div>
                        <p className="text-xs text-asvo-text-dim mt-6 font-mono text-center">
                            * Визуализация может незначительно отличаться от PDF.<br/>
                            Размер бумаги: {labelSize.width}x{labelSize.height} мм
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

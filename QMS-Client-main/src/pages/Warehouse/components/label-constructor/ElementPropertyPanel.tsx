import React, { useState } from "react";
import clsx from "clsx";
import {
  Type,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Database,
  ImageIcon,
  Hash,
  Info,
  Upload,
  Library,
  Layers,
  Eye,
  Trash2,
} from "lucide-react";
import { LabelElement, CustomFont } from "./types";
import { TEXT_VARIABLES, QR_SOURCES, COUNTER_FORMATS } from "./constants";

interface ElementPropertyPanelProps {
  activeElement: LabelElement;
  updateSelected: (updates: Partial<LabelElement>) => void;
  deleteSelected: () => void;
  customFonts: CustomFont[];
  onFontUploadClick: () => void;
}

export const ElementPropertyPanel: React.FC<ElementPropertyPanelProps> = ({
  activeElement,
  updateSelected,
  deleteSelected,
  customFonts,
  onFontUploadClick,
}) => {
  const [fontSizeInput, setFontSizeInput] = useState<string>('');
  const [isEditingFontSize, setIsEditingFontSize] = useState(false);

  const getQrDisplayInfo = (el: LabelElement) => {
    const source = QR_SOURCES.find(s => s.value === el.qrSource);
    return source || QR_SOURCES[0];
  };

  return (
    <div className="bg-gradient-to-r from-asvo-accent-dim to-asvo-purple-dim border-b border-asvo-border px-4 py-3 shrink-0 z-10">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Element type badge */}
        <div className="flex items-center gap-2 bg-asvo-card px-3 py-1.5 rounded-lg border border-asvo-accent/30 shadow-sm">
          {activeElement.type === "TEXT" && <Type size={16} className="text-indigo-600" />}
          {activeElement.type === "QR" && <QrCode size={16} className="text-indigo-600" />}
          {activeElement.type === "IMAGE" && <ImageIcon size={16} className="text-indigo-600" />}
          {activeElement.type === "COUNTER" && <Hash size={16} className="text-indigo-600" />}
          {activeElement.type === "ICON" && <Library size={16} className="text-indigo-600" />}
          {(activeElement.type === "LINE" || activeElement.type === "RECTANGLE") && <Layers size={16} className="text-indigo-600" />}
          <span className="text-xs font-bold text-indigo-800 uppercase">
            {activeElement.type === "TEXT" && "Текст"}
            {activeElement.type === "QR" && "QR-код"}
            {activeElement.type === "IMAGE" && "Изображение"}
            {activeElement.type === "COUNTER" && "Счётчик"}
            {activeElement.type === "ICON" && "Иконка"}
            {activeElement.type === "LINE" && "Линия"}
            {activeElement.type === "RECTANGLE" && "Рамка"}
          </span>
        </div>

        {/* TEXT properties */}
        {activeElement.type === "TEXT" && (
          <>
            <div className="relative shrink-0" style={{ width: '220px' }}>
              <textarea
                value={activeElement.content || ""}
                onChange={(e) => updateSelected({ content: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-asvo-accent/30 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-asvo-surface shadow-sm resize-none text-asvo-text"
                placeholder="Введите текст..."
                rows={1}
                style={{
                  minHeight: '38px',
                  height: 'auto',
                  maxHeight: '80px',
                  overflow: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '38px';
                  target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="relative shrink-0">
              <select
                className="text-sm pl-3 pr-7 py-2 border border-asvo-accent/30 rounded-lg bg-asvo-surface text-asvo-text cursor-pointer hover:border-indigo-400 outline-none appearance-none"
                style={{ width: '130px' }}
                value=""
                onChange={(e) => {
                  if (e.target.value) updateSelected({ content: (activeElement.content || "") + e.target.value });
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">+ Переменная</option>
                {TEXT_VARIABLES.filter(v => v.value).map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <Database size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <select
                value={activeElement.fontFamily ?? "Arial, sans-serif"}
                onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                className="text-sm px-2 py-2 border border-asvo-accent/30 rounded-lg bg-asvo-surface text-asvo-text cursor-pointer hover:border-indigo-400 outline-none shadow-sm"
                style={{ width: '130px' }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <optgroup label="Стандартные">
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="Tahoma, sans-serif">Tahoma</option>
                </optgroup>
                <optgroup label="ГОСТ">
                  <option value="'GOST type A', sans-serif">GOST type A</option>
                  <option value="'GOST type B', sans-serif">GOST type B</option>
                </optgroup>
                {customFonts.length > 0 && (
                  <optgroup label="Мои шрифты">
                    {customFonts.map((f) => (
                      <option key={f.name} value={f.fontFamily}>{f.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFontUploadClick();
                }}
                className="p-2 text-asvo-text-dim hover:text-indigo-600 hover:bg-asvo-accent-dim rounded-lg transition-colors"
                title="Загрузить свой шрифт (TTF, OTF, WOFF)"
                type="button"
              >
                <Upload size={16} />
              </button>
            </div>

            <div className="flex items-center bg-asvo-surface border border-asvo-accent/30 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => updateSelected({ fontSize: Math.max(6, (activeElement.fontSize || 10) - 1) })}
                className="px-3 py-2 hover:bg-asvo-surface/50 text-sm font-bold text-indigo-600"
                type="button"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={isEditingFontSize ? fontSizeInput : (activeElement.fontSize || 10)}
                onFocus={(e) => {
                  setIsEditingFontSize(true);
                  setFontSizeInput(String(activeElement.fontSize || 10));
                  e.target.select();
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFontSizeInput(value);
                }}
                onBlur={() => {
                  setIsEditingFontSize(false);
                  const val = parseInt(fontSizeInput);
                  if (!isNaN(val) && val >= 6 && val <= 200) {
                    updateSelected({ fontSize: val });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                  if (e.key === 'Escape') {
                    setIsEditingFontSize(false);
                    setFontSizeInput('');
                  }
                }}
                className="w-14 text-sm font-bold text-center tabular-nums border-x border-asvo-accent/20 py-2 outline-none focus:bg-asvo-accent-dim focus:ring-2 focus:ring-indigo-300"
                onPointerDown={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => updateSelected({ fontSize: Math.min(200, (activeElement.fontSize || 10) + 1) })}
                className="px-3 py-2 hover:bg-asvo-surface/50 text-sm font-bold text-indigo-600"
                type="button"
              >
                +
              </button>
            </div>

            <button
              onClick={() => updateSelected({ isBold: !activeElement.isBold })}
              className={clsx(
                "w-9 h-9 border rounded-lg flex items-center justify-center font-bold transition-all shadow-sm",
                activeElement.isBold ? "bg-indigo-600 text-white border-indigo-600" : "bg-asvo-surface border-asvo-accent/30 hover:bg-asvo-surface/50"
              )}
              type="button"
            >
              B
            </button>

            <div className="flex bg-asvo-surface border border-asvo-accent/30 rounded-lg overflow-hidden shadow-sm">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateSelected({ align })}
                  className={clsx("p-2 hover:bg-asvo-surface/50", activeElement.align === align && "bg-asvo-accent-dim text-indigo-700")}
                  type="button"
                >
                  {align === "left" && <AlignLeft size={16} />}
                  {align === "center" && <AlignCenter size={16} />}
                  {align === "right" && <AlignRight size={16} />}
                </button>
              ))}
            </div>
          </>
        )}

        {/* QR properties */}
        {activeElement.type === "QR" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase">Что будет в QR:</label>
              <select
                value={activeElement.qrSource || "code"}
                onChange={(e) => {
                  const source = QR_SOURCES.find(s => s.value === e.target.value);
                  if (source) {
                    updateSelected({
                      qrSource: e.target.value as LabelElement["qrSource"],
                      content: source.template,
                      qrDescription: source.label
                    });
                  }
                }}
                className="text-sm px-3 py-2 border border-asvo-accent/30 rounded-lg bg-asvo-surface text-asvo-text cursor-pointer hover:border-indigo-400 outline-none shadow-sm min-w-[180px]"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {QR_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {activeElement.qrSource === "custom" && (
              <input
                value={activeElement.content || ""}
                onChange={(e) => updateSelected({ content: e.target.value })}
                className="w-48 text-sm px-3 py-2 border border-asvo-accent/30 rounded-lg focus:border-indigo-500 outline-none bg-asvo-surface text-asvo-text shadow-sm"
                placeholder="Введите текст для QR..."
                onPointerDown={(e) => e.stopPropagation()}
              />
            )}

            <div className="flex items-start gap-2 bg-asvo-blue-dim border border-asvo-blue/20 rounded-lg px-3 py-2 max-w-sm">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <div className="font-semibold">{getQrDisplayInfo(activeElement).description}</div>
                <div className="text-blue-500 mt-0.5">Пример: {getQrDisplayInfo(activeElement).example}</div>
              </div>
            </div>
          </div>
        )}

        {/* COUNTER properties */}
        {activeElement.type === "COUNTER" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase">Формат нумерации:</label>
              <select
                value={activeElement.counterFormat || COUNTER_FORMATS[0].value}
                onChange={(e) => updateSelected({ counterFormat: e.target.value, content: e.target.value })}
                className="text-sm px-3 py-2 border border-asvo-accent/30 rounded-lg bg-asvo-surface text-asvo-text cursor-pointer hover:border-indigo-400 outline-none shadow-sm min-w-[200px]"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {COUNTER_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label} — {f.description}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-asvo-surface border border-asvo-accent/30 rounded-lg overflow-hidden shadow-sm">
              <button onClick={() => updateSelected({ fontSize: Math.max(6, (activeElement.fontSize || 14) - 1) })} className="px-3 py-2 hover:bg-asvo-surface/50 text-sm font-bold" type="button">−</button>
              <span className="text-sm font-bold w-8 text-center tabular-nums border-x border-asvo-accent/20">{activeElement.fontSize || 14}</span>
              <button onClick={() => updateSelected({ fontSize: (activeElement.fontSize || 14) + 1 })} className="px-3 py-2 hover:bg-asvo-surface/50 text-sm font-bold" type="button">+</button>
            </div>

            <button
              onClick={() => updateSelected({ isBold: !activeElement.isBold })}
              className={clsx(
                "w-9 h-9 border rounded-lg flex items-center justify-center font-bold transition-all shadow-sm",
                activeElement.isBold ? "bg-indigo-600 text-white border-indigo-600" : "bg-asvo-surface border-asvo-accent/30 hover:bg-asvo-surface/50"
              )}
              type="button"
            >B</button>

            <div className="flex items-center gap-2 bg-asvo-green-dim border border-asvo-green/20 rounded-lg px-3 py-2">
              <Eye size={14} className="text-emerald-600" />
              <span className="text-sm font-mono font-bold text-emerald-800">
                {(activeElement.counterFormat || "{{current}} / {{total}}")
                  .replace("{{current}}", "1")
                  .replace("{{total}}", "100")}
              </span>
            </div>
          </div>
        )}

        {/* IMAGE properties */}
        {activeElement.type === "IMAGE" && activeElement.imageName && (
          <div className="flex items-center gap-2 bg-asvo-surface-2 px-3 py-2 rounded-lg">
            <ImageIcon size={16} className="text-asvo-text-mid" />
            <span className="text-sm text-asvo-text-mid truncate max-w-[200px]">{activeElement.imageName}</span>
          </div>
        )}

        {/* ICON properties */}
        {activeElement.type === "ICON" && (
          <div className="flex items-center gap-2 bg-asvo-surface-2 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-asvo-text-mid">{activeElement.content || "Иконка"}</span>
          </div>
        )}

        {/* LINE / RECTANGLE properties */}
        {(activeElement.type === "LINE" || activeElement.type === "RECTANGLE") && (
          <div className="flex items-center gap-2 bg-asvo-surface px-3 py-2 rounded-lg border border-asvo-accent/30 shadow-sm">
            <span className="text-xs text-indigo-900 font-medium">Толщина:</span>
            <input
              type="number"
              step={0.1}
              min={0.1}
              value={activeElement.strokeWidth}
              onChange={(e) => updateSelected({ strokeWidth: parseFloat(e.target.value) })}
              className="w-14 text-sm border-b border-indigo-300 px-1 py-0.5 text-center focus:outline-none focus:border-indigo-600 bg-transparent"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-asvo-text-dim">мм</span>
          </div>
        )}

        <div className="flex-1"></div>

        <button
          onClick={deleteSelected}
          className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200"
          title="Удалить элемент"
          type="button"
        >
          <Trash2 size={18} />
          <span className="text-sm font-medium">Удалить</span>
        </button>
      </div>
    </div>
  );
};

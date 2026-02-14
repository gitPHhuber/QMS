import React, { useState } from "react";
import { Save, MousePointer2 } from "lucide-react";
import toast from "react-hot-toast";

import { Props } from "./types";
import { useLabelElements } from "./useLabelElements";
import { useLabelDragDrop } from "./useLabelDragDrop";
import { useCustomAssets } from "./useCustomAssets";
import { LabelToolbar } from "./LabelToolbar";
import { ElementPropertyPanel } from "./ElementPropertyPanel";
import { LabelCanvas } from "./LabelCanvas";
import { HelpPanel } from "./HelpPanel";

export const LabelConstructor: React.FC<Props> = ({
  initialName = "Новый шаблон",
  initialWidth = 105,
  initialHeight = 60,
  initialLayout = [],
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [zoom, setZoom] = useState(1.5);
  const [showHelp, setShowHelp] = useState(false);

  const {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    activeElement,
    addElement,
    updateSelected,
    deleteSelected,
  } = useLabelElements(initialLayout);

  const { elementRefs, handleStartDrag } = useLabelDragDrop(
    elements,
    zoom,
    selectedId,
    setSelectedId,
    setElements,
  );

  const {
    customIcons,
    customFonts,
    fileInputRef,
    iconUploadRef,
    fontUploadRef,
    handleImageUpload,
    handleIconUpload,
    handleFontUpload,
    deleteCustomIcon,
  } = useCustomAssets(addElement);

  return (
    <div className="flex flex-col h-[90vh] bg-gradient-to-br from-asvo-surface-2 to-asvo-surface-3 font-sans text-asvo-text rounded-xl overflow-hidden shadow-2xl border border-asvo-border select-none">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={iconUploadRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
      <input ref={fontUploadRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />

      {/* Toolbar */}
      <LabelToolbar
        addElement={addElement}
        zoom={zoom}
        setZoom={setZoom}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        customIcons={customIcons}
        deleteCustomIcon={deleteCustomIcon}
        onImageUploadClick={() => fileInputRef.current?.click()}
        onIconUploadClick={() => iconUploadRef.current?.click()}
        onClose={onClose}
      />

      {/* Property panel or hint */}
      {activeElement ? (
        <ElementPropertyPanel
          activeElement={activeElement}
          updateSelected={updateSelected}
          deleteSelected={deleteSelected}
          customFonts={customFonts}
          onFontUploadClick={() => fontUploadRef.current?.click()}
        />
      ) : (
        <div className="bg-asvo-surface border-b border-asvo-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 text-asvo-text-dim text-sm">
            <MousePointer2 size={16} />
            <span>Выберите элемент на этикетке для редактирования или добавьте новый с панели инструментов</span>
          </div>
        </div>
      )}

      {/* Canvas + Help side panel */}
      <div className="flex-1 flex overflow-hidden">
        <LabelCanvas
          elements={elements}
          selectedId={selectedId}
          size={size}
          zoom={zoom}
          customIcons={customIcons}
          elementRefs={elementRefs}
          onCanvasPointerDown={() => setSelectedId(null)}
          onStartDrag={handleStartDrag}
        />

        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      </div>

      {/* Footer: size controls + save */}
      <div className="bg-asvo-card border-t border-asvo-border px-4 py-3 flex items-center justify-between shrink-0 z-20 gap-4 flex-wrap">
        <div className="flex gap-4 text-sm items-center">
          <label className="flex items-center gap-2 text-asvo-text-mid bg-asvo-surface px-3 py-2 rounded-lg border border-asvo-border">
            <span className="font-bold text-indigo-600">Ш:</span>
            <input
              type="number"
              value={size.w}
              onChange={(e) => setSize({ ...size, w: +e.target.value })}
              className="bg-transparent w-12 text-center outline-none font-medium"
            />
            <span className="text-asvo-text-dim">мм</span>
          </label>
          <label className="flex items-center gap-2 text-asvo-text-mid bg-asvo-surface px-3 py-2 rounded-lg border border-asvo-border">
            <span className="font-bold text-indigo-600">В:</span>
            <input
              type="number"
              value={size.h}
              onChange={(e) => setSize({ ...size, h: +e.target.value })}
              className="bg-transparent w-12 text-center outline-none font-medium"
            />
            <span className="text-asvo-text-dim">мм</span>
          </label>
          <span className="text-asvo-text-dim hidden sm:inline">Shift = привязка к сетке</span>
        </div>

        <div className="flex gap-3 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-asvo-border rounded-lg px-4 py-2 text-sm w-56 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-asvo-surface text-asvo-text"
            placeholder="Название шаблона..."
          />
          <button
            onClick={() => {
              if (!onSave) {
                toast.error("onSave не передан");
                return;
              }
              onSave(name, size.w, size.h, elements);
              toast.success("Шаблон сохранён!");
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            type="button"
          >
            <Save size={18} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelConstructor;

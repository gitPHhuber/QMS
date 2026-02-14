import React from "react";
import clsx from "clsx";
import QRCode from "react-qr-code";
import { Image as ImageIcon, AlertTriangle, GripHorizontal } from "lucide-react";
import { LabelElement, CustomIcon } from "./types";
import { PX_PER_MM, DEFAULT_ICON_LIBRARY, QR_SOURCES } from "./constants";

interface LabelCanvasProps {
  elements: LabelElement[];
  selectedId: string | null;
  size: { w: number; h: number };
  zoom: number;
  customIcons: CustomIcon[];
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onCanvasPointerDown: () => void;
  onStartDrag: (e: React.PointerEvent, id: string, mode: "MOVE" | "RESIZE") => void;
}

export const LabelCanvas: React.FC<LabelCanvasProps> = ({
  elements,
  selectedId,
  size,
  zoom,
  customIcons,
  elementRefs,
  onCanvasPointerDown,
  onStartDrag,
}) => {
  const gridBgSize = PX_PER_MM * zoom * 5;

  return (
    <div
      className="flex-1 overflow-auto bg-asvo-surface-3/50 flex items-center justify-center relative touch-none p-8"
      style={{
        backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      onPointerDown={onCanvasPointerDown}
    >
      <div
        className="bg-white shadow-2xl relative transition-transform duration-75 rounded-sm"
        style={{
          width: size.w * PX_PER_MM * zoom,
          height: size.h * PX_PER_MM * zoom,
          backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
          backgroundSize: `${gridBgSize}px ${gridBgSize}px`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {elements.map((el, idx) => (
          <CanvasElement
            key={el.id}
            el={el}
            idx={idx}
            isSelected={selectedId === el.id}
            zoom={zoom}
            customIcons={customIcons}
            elementRefs={elementRefs}
            onStartDrag={onStartDrag}
          />
        ))}
      </div>
    </div>
  );
};

interface CanvasElementProps {
  el: LabelElement;
  idx: number;
  isSelected: boolean;
  zoom: number;
  customIcons: CustomIcon[];
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onStartDrag: (e: React.PointerEvent, id: string, mode: "MOVE" | "RESIZE") => void;
}

const CanvasElement: React.FC<CanvasElementProps> = ({
  el,
  idx,
  isSelected,
  zoom,
  customIcons,
  elementRefs,
  onStartDrag,
}) => {
  const style: React.CSSProperties = {
    left: `${el.x * PX_PER_MM * zoom}px`,
    top: `${el.y * PX_PER_MM * zoom}px`,
    width: `${el.width * PX_PER_MM * zoom}px`,
    height: `${el.height * PX_PER_MM * zoom}px`,
    zIndex: isSelected ? 9999 : idx + 1,
  };

  const strokePx = (el.strokeWidth || 0.1) * PX_PER_MM * zoom;

  return (
    <div
      ref={(node) => {
        if (node) elementRefs.current.set(el.id, node);
        else elementRefs.current.delete(el.id);
      }}
      className={clsx(
        "absolute box-border transition-shadow",
        isSelected
          ? "outline outline-2 outline-indigo-500 shadow-lg shadow-indigo-200/50"
          : "hover:outline hover:outline-1 hover:outline-indigo-300"
      )}
      style={style}
      onPointerDown={(e) => onStartDrag(e, el.id, "MOVE")}
    >
      {el.type === "TEXT" && (
        <div
          className="w-full h-full whitespace-pre-wrap break-words leading-none pointer-events-none overflow-hidden"
          style={{
            fontSize: `${(el.fontSize || 10) * PX_PER_MM * zoom * 0.35}px`,
            fontWeight: el.isBold ? "bold" : "normal",
            fontFamily: el.fontFamily || "Arial, sans-serif",
            textAlign: el.align,
            color: "#1e293b",
          }}
        >
          {el.content}
        </div>
      )}

      {el.type === "QR" && (
        <div className="w-full h-full p-[2px] pointer-events-none flex items-center justify-center bg-white rounded-sm">
          <QRCode value={el.content || "QR"} style={{ width: "100%", height: "100%" }} viewBox="0 0 256 256" />
        </div>
      )}

      {el.type === "IMAGE" && (
        <div className="w-full h-full pointer-events-none flex items-center justify-center bg-slate-50 rounded-sm overflow-hidden">
          {el.imageUrl ? (
            <img src={el.imageUrl} alt={el.imageName || "Image"} className="w-full h-full object-contain" />
          ) : (
            <ImageIcon size={24} className="text-slate-300" />
          )}
        </div>
      )}

      {el.type === "COUNTER" && (
        <div
          className="w-full h-full whitespace-nowrap pointer-events-none flex items-center justify-center overflow-hidden"
          style={{
            fontSize: `${(el.fontSize || 14) * PX_PER_MM * zoom * 0.35}px`,
            fontWeight: el.isBold ? "bold" : "normal",
            color: "#1e293b",
            fontFamily: "monospace",
          }}
        >
          {(el.counterFormat || "{{current}} / {{total}}")
            .replace("{{current}}", "1")
            .replace("{{total}}", "100")}
        </div>
      )}

      {el.type === "ICON" && (
        <div className="w-full h-full pointer-events-none flex items-center justify-center p-0.5">
          <IconRenderer el={el} customIcons={customIcons} />
        </div>
      )}

      {(el.type === "LINE" || el.type === "RECTANGLE") && (
        <svg className="w-full h-full pointer-events-none overflow-visible" xmlns="http://www.w3.org/2000/svg">
          {el.type === "RECTANGLE" ? (
            <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="black" strokeWidth={strokePx} vectorEffect="non-scaling-stroke" />
          ) : el.width >= el.height ? (
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="black" strokeWidth={strokePx} vectorEffect="non-scaling-stroke" />
          ) : (
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="black" strokeWidth={strokePx} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      )}

      {isSelected && (
        <>
          <div
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full cursor-nwse-resize flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
            onPointerDown={(e) => onStartDrag(e, el.id, "RESIZE")}
          >
            <GripHorizontal size={12} className="text-white -rotate-45" />
          </div>

          <div className="resize-tooltip absolute -top-7 left-0 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-md opacity-90 pointer-events-none whitespace-nowrap shadow-md font-mono">
            {el.width.toFixed(1)} × {el.height.toFixed(1)} мм
          </div>

          <div className="absolute -top-7 right-0 bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded opacity-80 pointer-events-none uppercase font-bold">
            {el.type === "QR" && el.qrSource && `QR: ${QR_SOURCES.find(s => s.value === el.qrSource)?.label || el.qrSource}`}
            {el.type === "COUNTER" && "Счётчик"}
            {el.type === "IMAGE" && "Картинка"}
            {el.type === "ICON" && el.content}
          </div>
        </>
      )}
    </div>
  );
};

function IconRenderer({ el, customIcons }: { el: LabelElement; customIcons: CustomIcon[] }) {
  const iconData = DEFAULT_ICON_LIBRARY.find(i => i.type === el.iconType);
  if (iconData?.svg) {
    return (
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: iconData.svg }}
      />
    );
  }

  if (el.imageUrl) {
    return <img src={el.imageUrl} alt={el.content || 'Icon'} className="w-full h-full object-contain" />;
  }

  const customIcon = customIcons.find(i => i.type === el.iconType);
  if (customIcon) {
    return <img src={customIcon.imageUrl} alt={customIcon.label} className="w-full h-full object-contain" />;
  }

  return <AlertTriangle size={20} className="text-asvo-text-dim" />;
}

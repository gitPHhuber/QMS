import React, { useState } from "react";
import clsx from "clsx";
import {
  Type,
  QrCode,
  Minus,
  Square,
  X,
  ZoomIn,
  ZoomOut,
  Upload,
  Library,
  Hash,
  HelpCircle,
} from "lucide-react";
import { LabelElement, LabelElementType, CustomIcon, IconLibraryItem } from "./types";
import { ToolBtn } from "./ToolBtn";
import { IconPickerPopup } from "./IconPickerPopup";

interface LabelToolbarProps {
  addElement: (type: LabelElementType, extra?: Partial<LabelElement>) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  showHelp: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  customIcons: CustomIcon[];
  deleteCustomIcon: (iconType: string) => void;
  onImageUploadClick: () => void;
  onIconUploadClick: () => void;
  onClose?: () => void;
}

export const LabelToolbar: React.FC<LabelToolbarProps> = ({
  addElement,
  zoom,
  setZoom,
  showHelp,
  setShowHelp,
  customIcons,
  deleteCustomIcon,
  onImageUploadClick,
  onIconUploadClick,
  onClose,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleIconSelect = (iconItem: IconLibraryItem | CustomIcon) => {
    const extra: Partial<LabelElement> = {
      iconType: iconItem.type,
      content: iconItem.label,
      width: 15,
      height: 15,
    };
    if ("imageUrl" in iconItem) {
      extra.imageUrl = iconItem.imageUrl;
    }
    addElement("ICON", extra);
    setShowIconPicker(false);
  };

  return (
    <div className="h-auto min-h-[64px] bg-asvo-card border-b border-asvo-border flex flex-wrap items-center px-4 py-2 justify-between shrink-0 z-20 shadow-sm gap-2">
      <div className="flex gap-1 flex-wrap">
        <ToolBtn icon={<Type />} label="Текст" onClick={() => addElement("TEXT")} />

        <div className="relative">
          <ToolBtn
            icon={<QrCode />}
            label="QR"
            onClick={() => addElement("QR", { width: 20, height: 20 })}
          />
        </div>

        <ToolBtn
          icon={<Hash />}
          label="Счётчик"
          onClick={() => addElement("COUNTER", { width: 25, height: 8 })}
          title="Нумерация этикеток: 1/100, 2/100..."
        />

        <div className="w-px h-8 bg-asvo-surface-3 mx-1 self-center"></div>

        <ToolBtn
          icon={<Upload />}
          label="Картинка"
          onClick={onImageUploadClick}
          title="Загрузить своё изображение"
        />

        <div className="relative">
          <ToolBtn
            icon={<Library />}
            label="Иконки"
            onClick={() => setShowIconPicker(!showIconPicker)}
            title="Стандартные символы для этикеток"
          />

          {showIconPicker && (
            <IconPickerPopup
              customIcons={customIcons}
              onSelect={handleIconSelect}
              onUploadClick={onIconUploadClick}
              onDeleteCustom={deleteCustomIcon}
            />
          )}
        </div>

        <div className="w-px h-8 bg-asvo-surface-3 mx-1 self-center"></div>

        <ToolBtn
          icon={<Minus />}
          label="Линия"
          onClick={() => addElement("LINE", { width: 30, height: 0.5, strokeWidth: 0.3 })}
        />

        <ToolBtn
          icon={<Square />}
          label="Рамка"
          onClick={() => addElement("RECTANGLE", { strokeWidth: 0.3 })}
        />

        <div className="w-px h-8 bg-asvo-surface-3 mx-1 self-center"></div>

        <div className="flex items-center gap-1 bg-asvo-surface rounded-lg px-2 py-1 border border-asvo-border">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="p-1 hover:bg-asvo-surface-3 rounded" type="button">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-medium w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="p-1 hover:bg-asvo-surface-3 rounded" type="button">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            showHelp ? "bg-asvo-amber-dim text-amber-700 border border-amber-300" : "bg-asvo-surface-2 text-asvo-text-mid hover:bg-asvo-surface-3"
          )}
          type="button"
        >
          <HelpCircle size={18} />
          <span className="hidden sm:inline">Справка</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-asvo-text-dim hover:text-asvo-text-mid hover:bg-asvo-surface-2 rounded-lg transition-colors"
            title="Закрыть конструктор"
            type="button"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

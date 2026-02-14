import React from "react";
import { Upload } from "lucide-react";
import { CustomIcon, IconLibraryItem } from "./types";
import { DEFAULT_ICON_LIBRARY } from "./constants";

interface IconPickerPopupProps {
  customIcons: CustomIcon[];
  onSelect: (iconItem: IconLibraryItem | CustomIcon) => void;
  onUploadClick: () => void;
  onDeleteCustom: (iconType: string) => void;
}

export const IconPickerPopup: React.FC<IconPickerPopupProps> = ({
  customIcons,
  onSelect,
  onUploadClick,
  onDeleteCustom,
}) => {
  return (
    <div className="absolute top-full left-0 mt-1 bg-asvo-card rounded-xl shadow-2xl border border-asvo-border p-3 z-50 w-72 max-h-96 overflow-y-auto">
      <div className="text-xs font-bold text-asvo-text-mid mb-2 uppercase">Стандартные символы (ГОСТ 14192)</div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {DEFAULT_ICON_LIBRARY.map((iconItem) => (
          <button
            key={iconItem.type}
            onClick={() => onSelect(iconItem)}
            className="flex flex-col items-center p-2 hover:bg-asvo-accent-dim rounded-lg transition-colors group border border-transparent hover:border-asvo-accent/30"
            title={iconItem.label}
          >
            <div
              className="w-8 h-8"
              dangerouslySetInnerHTML={{ __html: iconItem.svg }}
            />
            <span className="text-[8px] mt-1 text-asvo-text-mid group-hover:text-indigo-600 text-center leading-tight">
              {iconItem.label}
            </span>
          </button>
        ))}
      </div>

      {customIcons.length > 0 && (
        <>
          <div className="text-xs font-bold text-emerald-600 mb-2 uppercase border-t pt-2">Мои иконки</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {customIcons.map((iconItem) => (
              <div key={iconItem.type} className="relative group">
                <button
                  onClick={() => onSelect(iconItem)}
                  className="flex flex-col items-center p-2 hover:bg-asvo-green-dim rounded-lg transition-colors w-full"
                  title={iconItem.label}
                >
                  <img src={iconItem.imageUrl} alt={iconItem.label} className="w-6 h-6 object-contain" />
                  <span className="text-[8px] mt-1 text-asvo-text-mid text-center leading-tight truncate w-full">
                    {iconItem.label}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustom(iconItem.type);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  title="Удалить иконку"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={onUploadClick}
        className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-asvo-border rounded-lg text-asvo-text-mid hover:border-indigo-400 hover:text-indigo-600 hover:bg-asvo-accent-dim transition-colors text-sm"
      >
        <Upload size={16} />
        <span>Загрузить свою иконку</span>
      </button>
      <div className="text-[10px] text-asvo-text-dim text-center mt-1">PNG/SVG, макс. 100KB</div>
    </div>
  );
};

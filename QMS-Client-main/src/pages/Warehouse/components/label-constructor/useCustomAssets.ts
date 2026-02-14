import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { LabelElement, LabelElementType, CustomFont, CustomIcon } from "./types";
import { CUSTOM_FONTS_STORAGE_KEY, CUSTOM_ICONS_STORAGE_KEY } from "./constants";

export function useCustomAssets(addElement: (type: LabelElementType, extra?: Partial<LabelElement>) => void) {
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_ICONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customFonts, setCustomFonts] = useState<CustomFont[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_ICONS_STORAGE_KEY, JSON.stringify(customIcons));
  }, [customIcons]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(customFonts));

    customFonts.forEach((font) => {
      const styleId = `custom-font-${font.name.replace(/\s+/g, '-')}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @font-face {
            font-family: '${font.name}';
            src: url(${font.fontDataUrl});
          }
        `;
        document.head.appendChild(style);
      }
    });
  }, [customFonts]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconUploadRef = useRef<HTMLInputElement>(null);
  const fontUploadRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Выберите файл изображения");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addElement("IMAGE", {
        imageUrl: dataUrl,
        imageName: file.name,
        width: 20,
        height: 20,
      });
      toast.success(`Изображение "${file.name}" добавлено`);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  }, [addElement]);

  const handleIconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Выберите файл изображения");
      return;
    }

    if (file.size > 100 * 1024) {
      toast.error("Иконка слишком большая (макс. 100KB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const iconName = file.name.replace(/\.[^.]+$/, "");
      const iconType = `custom_${Date.now()}`;

      setCustomIcons(prev => [...prev, {
        type: iconType,
        label: iconName,
        imageUrl: dataUrl,
      }]);

      toast.success(`Иконка "${iconName}" добавлена в библиотеку`);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  }, []);

  const deleteCustomIcon = useCallback((iconType: string) => {
    setCustomIcons(prev => prev.filter(i => i.type !== iconType));
    toast.success("Иконка удалена из библиотеки");
  }, []);

  const handleFontUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
      toast.error("Поддерживаются только TTF, OTF, WOFF, WOFF2");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Максимальный размер шрифта 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fontDataUrl = reader.result as string;
      const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');

      setCustomFonts((prev) => {
        if (prev.find(f => f.name === fontName)) {
          toast.error("Шрифт с таким именем уже загружен");
          return prev;
        }
        toast.success(`Шрифт "${fontName}" загружен`);
        return [...prev, {
          name: fontName,
          fontFamily: `'${fontName}', sans-serif`,
          fontDataUrl,
        }];
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const deleteCustomFont = useCallback((fontName: string) => {
    setCustomFonts((prev) => prev.filter((f) => f.name !== fontName));
    const styleEl = document.getElementById(`custom-font-${fontName.replace(/\s+/g, '-')}`);
    if (styleEl) styleEl.remove();
    toast.success("Шрифт удалён");
  }, []);

  return {
    customIcons,
    customFonts,
    fileInputRef,
    iconUploadRef,
    fontUploadRef,
    handleImageUpload,
    handleIconUpload,
    handleFontUpload,
    deleteCustomIcon,
    deleteCustomFont,
  };
}

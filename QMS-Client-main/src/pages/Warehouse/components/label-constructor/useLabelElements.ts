import { useState, useEffect, useMemo, useCallback } from "react";
import { LabelElement, LabelElementType } from "./types";

export function useLabelElements(initialLayout: LabelElement[]) {
  const normalizedLayout = useMemo(() => {
    return initialLayout.map(el => ({
      ...el,
      fontFamily: el.fontFamily || "Arial, sans-serif",
    }));
  }, [initialLayout]);

  const [elements, setElements] = useState<LabelElement[]>(normalizedLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setElements(normalizedLayout);
  }, [normalizedLayout]);

  const activeElement = elements.find((el) => el.id === selectedId) ?? null;

  const addElement = useCallback((type: LabelElementType, extra: Partial<LabelElement> = {}) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);

    const defaultSizes: Record<LabelElementType, { w: number; h: number }> = {
      TEXT: { w: 30, h: 10 },
      QR: { w: 20, h: 20 },
      LINE: { w: 30, h: 2 },
      RECTANGLE: { w: 30, h: 20 },
      IMAGE: { w: 20, h: 20 },
      COUNTER: { w: 25, h: 8 },
      ICON: { w: 15, h: 15 },
    };

    const defaults = defaultSizes[type] || { w: 20, h: 20 };

    const newEl: LabelElement = {
      id,
      type,
      x: 5,
      y: 5,
      width: defaults.w,
      height: defaults.h,
      fontSize: 10,
      fontFamily: "Arial, sans-serif",
      strokeWidth: 0.3,
      align: "left",
      isBold: false,
      content: type === "TEXT" ? "Текст" : type === "QR" ? "{{code}}" : type === "COUNTER" ? "{{current}} / {{total}}" : "",
      qrSource: type === "QR" ? "code" : undefined,
      qrDescription: type === "QR" ? "Код товара" : undefined,
      counterFormat: type === "COUNTER" ? "{{current}} / {{total}}" : undefined,
      ...extra,
    };

    setElements((prev) => {
      if (type === "RECTANGLE" || type === "LINE") return [newEl, ...prev];
      return [...prev, newEl];
    });

    setSelectedId(id);
  }, []);

  const updateSelected = useCallback((updates: Partial<LabelElement>) => {
    setSelectedId((currentId) => {
      if (!currentId) return currentId;
      setElements((prev) => prev.map((el) => (el.id === currentId ? { ...el, ...updates } : el)));
      return currentId;
    });
  }, []);

  const deleteSelected = useCallback(() => {
    setSelectedId((currentId) => {
      if (!currentId) return currentId;
      setElements((prev) => prev.filter((el) => el.id !== currentId));
      return null;
    });
  }, []);

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    activeElement,
    addElement,
    updateSelected,
    deleteSelected,
  };
}

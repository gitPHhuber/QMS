import { useEffect, useRef, useCallback } from "react";
import { LabelElement } from "./types";
import { PX_PER_MM, SNAP_MM, MIN_MM, snap, round2 } from "./constants";

interface DragInfo {
  active: boolean;
  mode: "MOVE" | "RESIZE" | null;
  elId: string | null;
  startX: number;
  startY: number;
  initialItem: LabelElement | null;
}

interface DragState {
  elements: LabelElement[];
  zoom: number;
  selectedId: string | null;
}

/** Intermediate drag position stored per-element to avoid React re-renders during drag. */
interface DragMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useLabelDragDrop(
  elements: LabelElement[],
  zoom: number,
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>,
) {
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragMmRef = useRef<Map<string, DragMm>>(new Map());

  const stateRef = useRef<DragState>({ elements, zoom, selectedId });
  useEffect(() => {
    stateRef.current = { elements, zoom, selectedId };
  }, [elements, zoom, selectedId]);

  const dragInfo = useRef<DragInfo>({
    active: false,
    mode: null,
    elId: null,
    startX: 0,
    startY: 0,
    initialItem: null,
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragInfo.current.active || !dragInfo.current.elId || !dragInfo.current.initialItem) return;

      const { startX, startY, initialItem, mode, elId } = dragInfo.current;
      const currentZoom = stateRef.current.zoom;

      const deltaXMm = (e.clientX - startX) / (PX_PER_MM * currentZoom);
      const deltaYMm = (e.clientY - startY) / (PX_PER_MM * currentZoom);

      const useSnap = e.shiftKey;

      let newX = initialItem.x;
      let newY = initialItem.y;
      let newW = initialItem.width;
      let newH = initialItem.height;

      if (mode === "MOVE") {
        newX = initialItem.x + deltaXMm;
        newY = initialItem.y + deltaYMm;

        if (useSnap) {
          newX = snap(newX);
          newY = snap(newY);
        } else {
          newX = round2(newX);
          newY = round2(newY);
        }

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
      } else if (mode === "RESIZE") {
        newW = initialItem.width + deltaXMm;
        newH = initialItem.height + deltaYMm;

        if (useSnap) {
          newW = snap(newW);
          newH = snap(newH);
        } else {
          newW = round2(newW);
          newH = round2(newH);
        }

        if (newW < MIN_MM) newW = MIN_MM;
        if (newH < MIN_MM) newH = MIN_MM;
      }

      const node = elementRefs.current.get(elId);
      if (node) {
        node.style.left = `${newX * PX_PER_MM * currentZoom}px`;
        node.style.top = `${newY * PX_PER_MM * currentZoom}px`;
        node.style.width = `${newW * PX_PER_MM * currentZoom}px`;
        node.style.height = `${newH * PX_PER_MM * currentZoom}px`;

        const tooltip = node.querySelector(".resize-tooltip") as HTMLElement;
        if (tooltip) {
          tooltip.textContent = `${newW.toFixed(1)} × ${newH.toFixed(1)} мм`;
        }

        dragMmRef.current.set(elId, { x: newX, y: newY, w: newW, h: newH });
      }
    };

    const handlePointerUp = () => {
      if (!dragInfo.current.active) return;

      const { elId, mode, initialItem } = dragInfo.current;

      if (elId) {
        const lastMm = dragMmRef.current.get(elId);
        const finalData = lastMm ?? {
          x: initialItem?.x ?? 0,
          y: initialItem?.y ?? 0,
          w: initialItem?.width ?? 0,
          h: initialItem?.height ?? 0,
        };

        setElements((prev) =>
          prev.map((el) => {
            if (el.id === elId) {
              const updated = { ...el, x: finalData.x, y: finalData.y, width: finalData.w, height: finalData.h };

              if (mode === "RESIZE" && el.type === "TEXT" && initialItem?.height !== finalData.h) {
                updated.fontSize = Math.max(6, Math.round(finalData.h * 2.8));
              }
              return updated;
            }
            return el;
          })
        );

        dragMmRef.current.delete(elId);
      }

      dragInfo.current = {
        active: false,
        mode: null,
        elId: null,
        startX: 0,
        startY: 0,
        initialItem: null,
      };
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [setElements]);

  const handleStartDrag = useCallback((e: React.PointerEvent, id: string, mode: "MOVE" | "RESIZE") => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const el = stateRef.current.elements.find((x) => x.id === id);
    if (!el) return;

    setSelectedId(id);

    dragInfo.current = {
      active: true,
      mode,
      elId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialItem: { ...el },
    };
  }, [setSelectedId]);

  return {
    elementRefs,
    handleStartDrag,
  };
}

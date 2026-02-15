/**
 * Unit-тесты для useExport hook — скачивание Excel-экспортов.
 *
 * Тестирует:
 *   1. Начальное состояние (exporting === false)
 *   2. Успешный экспорт: запрос, создание ссылки, скачивание
 *   3. Ошибка экспорта: alert и сброс состояния
 *   4. Имя файла с датой
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExport } from "../useExport";

// Мокаем $authHost
vi.mock("../../api/index", () => ({
  $authHost: {
    get: vi.fn(),
  },
}));

import { $authHost } from "../../api/index";

describe("useExport", () => {
  let mockClick: ReturnType<typeof vi.fn>;
  let anchorElement: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClick = vi.fn();
    anchorElement = { href: "", download: "", click: mockClick };

    // Мокаем createElement только для "a", пропускаем остальное
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string, options?: any) => {
      if (tag === "a") return anchorElement as any;
      return origCreateElement(tag, options);
    });

    // Мокаем URL API
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/fake");
    window.URL.revokeObjectURL = vi.fn();

    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("начальное состояние: exporting === false", () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.exporting).toBe(false);
    expect(typeof result.current.doExport).toBe("function");
  });

  it("успешный экспорт: запрос API, создание ссылки, клик", async () => {
    const mockBlob = new Blob(["fake-excel"], { type: "application/octet-stream" });
    (($authHost as any).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockBlob,
    });

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.doExport("risks", "Risks_Export");
    });

    // Проверяем вызов API
    expect($authHost.get).toHaveBeenCalledWith("/api/export/risks", {
      responseType: "blob",
    });

    // Проверяем создание blob URL и скачивание
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/fake");

    // exporting возвращается в false
    expect(result.current.exporting).toBe(false);
  });

  it("имя файла содержит endpoint и дату YYYY-MM-DD.xlsx", async () => {
    const mockBlob = new Blob(["data"]);
    (($authHost as any).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockBlob,
    });

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.doExport("equipment", "Equipment_Export");
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    expect(anchorElement.download).toBe(`Equipment_Export_${todayStr}.xlsx`);
  });

  it("ошибка API: показывает alert и сбрасывает exporting", async () => {
    (($authHost as any).get as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.doExport("risks", "Risks");
    });

    expect(window.alert).toHaveBeenCalledWith("Ошибка экспорта");
    expect(result.current.exporting).toBe(false);
  });
});

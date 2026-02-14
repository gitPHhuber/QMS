import { useState } from "react";
import { $authHost } from "../api/index";

/**
 * Hook for downloading Excel exports from /api/export/* endpoints.
 */
export function useExport() {
  const [exporting, setExporting] = useState(false);

  const doExport = async (endpoint: string, filename: string) => {
    setExporting(true);
    try {
      const res = await $authHost.get(`/api/export/${endpoint}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Ошибка экспорта");
    } finally {
      setExporting(false);
    }
  };

  return { exporting, doExport };
}

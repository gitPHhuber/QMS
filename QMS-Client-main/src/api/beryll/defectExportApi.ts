

import { apiClient } from "../apiClient";

export interface DefectExportParams {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    serverId?: number;
    search?: string;
}


export const exportDefectsToExcel = async (params: DefectExportParams = {}): Promise<Blob> => {
    const response = await apiClient.get("/beryll/extended/defects/export", {
        params,
        responseType: "blob"
    });
    return response.data;
};


export const exportDefectStatsToExcel = async (): Promise<Blob> => {
    const response = await apiClient.get("/beryll/extended/defects/export/stats", {
        responseType: "blob"
    });
    return response.data;
};


export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};


export const downloadDefectsExcel = async (params: DefectExportParams = {}): Promise<void> => {
    const blob = await exportDefectsToExcel(params);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadBlob(blob, `Брак_серверов_${date}.xlsx`);
};


export const downloadDefectStatsExcel = async (): Promise<void> => {
    const blob = await exportDefectStatsToExcel();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadBlob(blob, `Статистика_брака_${date}.xlsx`);
};

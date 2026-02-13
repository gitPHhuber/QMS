import { $authHost } from "../index";
import type { DocType, DocumentStats, DocumentApprovalItem } from "./types";

export const documentsApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/documents/", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/documents/${id}`).then(r => r.data),

  getStats: (): Promise<DocumentStats> =>
    $authHost.get("/api/documents/stats").then(r => r.data),

  getPending: (): Promise<DocumentApprovalItem[]> =>
    $authHost.get("/api/documents/pending").then(r => r.data),

  getOverdue: () =>
    $authHost.get("/api/documents/overdue").then(r => r.data),

  create: (data: { title: string; type: DocType; category?: string; description?: string; isoSection?: string }) =>
    $authHost.post("/api/documents/", data).then(r => r.data),

  createVersion: (docId: number, data: { changeDescription?: string }) =>
    $authHost.post(`/api/documents/${docId}/versions`, data).then(r => r.data),

  uploadFile: (versionId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return $authHost.post(`/api/documents/versions/${versionId}/upload`, form).then(r => r.data);
  },

  submitForReview: (versionId: number, approvalChain: Array<{ userId: number; role: string; dueDate?: string }>) =>
    $authHost.post(`/api/documents/versions/${versionId}/submit`, { approvalChain }).then(r => r.data),

  decide: (approvalId: number, data: { decision: string; comment?: string }) =>
    $authHost.post(`/api/documents/approvals/${approvalId}/decide`, data).then(r => r.data),

  makeEffective: (versionId: number) =>
    $authHost.post(`/api/documents/versions/${versionId}/effective`).then(r => r.data),

  distribute: (versionId: number, userIds: number[]) =>
    $authHost.post(`/api/documents/versions/${versionId}/distribute`, { userIds }).then(r => r.data),

  acknowledge: (distributionId: number) =>
    $authHost.post(`/api/documents/distributions/${distributionId}/ack`).then(r => r.data),
};

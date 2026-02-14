import { $authHost } from "./index";

export interface ChecklistItem {
  id: number;
  checklistId: number;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: number;
  taskId: number;
  title: string;
  sortOrder: number;
  createdById: number | null;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export const fetchChecklists = async (taskId: number): Promise<Checklist[]> => {
  const { data } = await $authHost.get(`api/tasks/${taskId}/checklists`);
  return data;
};

export const createChecklist = async (taskId: number, title?: string): Promise<Checklist> => {
  const { data } = await $authHost.post(`api/tasks/${taskId}/checklists`, { title });
  return data;
};

export const updateChecklist = async (
  taskId: number,
  checklistId: number,
  payload: { title: string }
): Promise<Checklist> => {
  const { data } = await $authHost.patch(
    `api/tasks/${taskId}/checklists/${checklistId}`,
    payload
  );
  return data;
};

export const deleteChecklist = async (taskId: number, checklistId: number): Promise<void> => {
  await $authHost.delete(`api/tasks/${taskId}/checklists/${checklistId}`);
};

export const createChecklistItem = async (
  taskId: number,
  checklistId: number,
  title: string
): Promise<ChecklistItem> => {
  const { data } = await $authHost.post(
    `api/tasks/${taskId}/checklists/${checklistId}/items`,
    { title }
  );
  return data;
};

export const updateChecklistItem = async (
  taskId: number,
  checklistId: number,
  itemId: number,
  payload: { title?: string; isCompleted?: boolean }
): Promise<ChecklistItem> => {
  const { data } = await $authHost.patch(
    `api/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`,
    payload
  );
  return data;
};

export const deleteChecklistItem = async (
  taskId: number,
  checklistId: number,
  itemId: number
): Promise<void> => {
  await $authHost.delete(
    `api/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`
  );
};

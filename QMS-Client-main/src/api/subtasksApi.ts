import { $authHost } from "./index";

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdById: number | null;
  createdBy?: { id: number; name: string; surname: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const fetchSubtasks = async (taskId: number): Promise<Subtask[]> => {
  const { data } = await $authHost.get(`api/tasks/${taskId}/subtasks`);
  return data;
};

export const createSubtask = async (taskId: number, title: string): Promise<Subtask> => {
  const { data } = await $authHost.post(`api/tasks/${taskId}/subtasks`, { title });
  return data;
};

export const updateSubtask = async (
  taskId: number,
  id: number,
  payload: { title?: string; isCompleted?: boolean }
): Promise<Subtask> => {
  const { data } = await $authHost.patch(`api/tasks/${taskId}/subtasks/${id}`, payload);
  return data;
};

export const deleteSubtask = async (taskId: number, id: number): Promise<void> => {
  await $authHost.delete(`api/tasks/${taskId}/subtasks/${id}`);
};

export const reorderSubtasks = async (taskId: number, orderedIds: number[]): Promise<void> => {
  await $authHost.patch(`api/tasks/${taskId}/subtasks/reorder`, { orderedIds });
};

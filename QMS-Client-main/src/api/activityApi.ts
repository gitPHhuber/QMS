import { $authHost } from "./index";

export interface TaskActivityEntry {
  id: number;
  taskId: number;
  userId: number;
  user?: { id: number; name: string; surname: string } | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export const fetchActivity = async (taskId: number): Promise<TaskActivityEntry[]> => {
  const { data } = await $authHost.get(`api/tasks/${taskId}/activity`);
  return data;
};

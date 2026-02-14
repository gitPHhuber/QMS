import { $authHost } from "./index";

export interface EpicStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface EpicModel {
  id: number;
  title: string;
  description: string | null;
  color: string;
  status: string;
  createdById: number;
  author?: { id: number; name: string; surname: string } | null;
  stats?: EpicStats;
  createdAt: string;
  updatedAt: string;
}

export const fetchEpics = async (): Promise<EpicModel[]> => {
  const { data } = await $authHost.get("api/epics");
  return data;
};

export const fetchEpicById = async (id: number): Promise<EpicModel> => {
  const { data } = await $authHost.get(`api/epics/${id}`);
  return data;
};

export const createEpic = async (payload: {
  title: string;
  description?: string;
  color?: string;
}): Promise<EpicModel> => {
  const { data } = await $authHost.post("api/epics", payload);
  return data;
};

export const updateEpic = async (
  id: number,
  payload: { title?: string; description?: string; color?: string; status?: string }
): Promise<EpicModel> => {
  const { data } = await $authHost.put(`api/epics/${id}`, payload);
  return data;
};

export const deleteEpic = async (id: number): Promise<void> => {
  await $authHost.delete(`api/epics/${id}`);
};

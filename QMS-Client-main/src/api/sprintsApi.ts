import { $authHost } from "./index";

export interface SprintModel {
  id: number;
  projectId: number;
  title: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string; // PLANNING | ACTIVE | COMPLETED
  createdById: number;
  createdBy?: { id: number; name: string; surname: string } | null;
  project?: { id: number; title: string } | null;
  taskCount?: number;
  completedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BurndownPoint {
  id: number;
  sprintId: number;
  date: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  idealRemaining?: number | null;
}

export const fetchSprintsForProject = async (projectId: number) => {
  const { data } = await $authHost.get(`api/sprints/project/${projectId}`);
  return data as SprintModel[];
};

export const fetchSprintById = async (id: number) => {
  const { data } = await $authHost.get(`api/sprints/${id}`);
  return data as SprintModel;
};

export const fetchBurndown = async (sprintId: number) => {
  const { data } = await $authHost.get(`api/sprints/${sprintId}/burndown`);
  return data as BurndownPoint[];
};

export const createSprint = async (payload: {
  projectId: number;
  title: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await $authHost.post("api/sprints", payload);
  return data as SprintModel;
};

export const updateSprint = async (id: number, payload: {
  title?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await $authHost.put(`api/sprints/${id}`, payload);
  return data as SprintModel;
};

export const startSprint = async (id: number) => {
  const { data } = await $authHost.post(`api/sprints/${id}/start`);
  return data as SprintModel;
};

export const completeSprint = async (id: number) => {
  const { data } = await $authHost.post(`api/sprints/${id}/complete`);
  return data as SprintModel;
};

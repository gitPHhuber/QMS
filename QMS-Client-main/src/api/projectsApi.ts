import { $authHost } from "./index";

export interface ProjectTaskStats {
    total: number;
    byStatus: {
        NEW: number;
        IN_PROGRESS: number;
        REVIEW: number;
        DONE: number;
        CLOSED: number;
    };
    overdue: number;
    progressPercent: number;
}

export interface ProjectMember {
    id: number;
    name: string;
    surname: string;
}

export interface ProjectModel {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    author?: { name: string; surname: string };
    taskStats?: ProjectTaskStats;
    members?: ProjectMember[];
}

export const fetchProjects = async () => {
    const { data } = await $authHost.get("api/projects");
    return data as ProjectModel[];
};

export const fetchProjectById = async (id: number) => {
    const { data } = await $authHost.get(`api/projects/${id}`);
    return data as ProjectModel;
};

export const createProject = async (title: string, description: string) => {
    const { data } = await $authHost.post("api/projects", { title, description });
    return data;
};

export const updateProject = async (id: number, payload: { title?: string; description?: string; status?: string }) => {
    const { data } = await $authHost.put(`api/projects/${id}`, payload);
    return data;
};

export const deleteProject = async (id: number) => {
    await $authHost.delete(`api/projects/${id}`);
};

import { $authHost } from "./index";


export interface RecipeStep {
    id?: number;
    order: number;
    title: string;
    description?: string;
    componentId?: number;
    quantity: number;
}

export interface AssemblyRecipe {
    id: number;
    projectId: number;
    title: string;
    steps: RecipeStep[];
}

export interface AssemblyProcess {
    id: number;
    boxId: number;
    recipeId: number;
    completedSteps: number[];
    status: "IN_PROGRESS" | "COMPLETED";
    startTime: string;
    endTime: string;
}


export const fetchRecipeByProject = async (projectId: number) => {
    const { data } = await $authHost.get(`api/assembly/recipes/project/${projectId}`);
    return data as AssemblyRecipe;
};

export const createOrUpdateRecipe = async (projectId: number, title: string, steps: RecipeStep[]) => {
    const { data } = await $authHost.post(`api/assembly/recipes`, { projectId, title, steps });
    return data;
};


export const startAssemblyProcess = async (qrCode: string, projectId: number) => {
    const { data } = await $authHost.post(`api/assembly/recipes/process/start`, { qrCode, projectId });
    return data as { process: AssemblyProcess, recipe: AssemblyRecipe };
};

export const updateProcessStep = async (processId: number, stepIndex: number, isDone: boolean) => {
    const { data } = await $authHost.put(`api/assembly/recipes/process/${processId}/step`, { stepIndex, isDone });
    return data as AssemblyProcess;
};

export const finishAssemblyProcess = async (processId: number) => {
    const { data } = await $authHost.post(`api/assembly/recipes/process/${processId}/finish`);
    return data;
};


export const fetchAssembledHistory = async (params: { projectId?: number, search?: string }) => {
    const { data } = await $authHost.get(`api/assembly/recipes/history/list`, { params });
    return data;
};

export const fetchAssemblyPassport = async (processId: number) => {
    const { data } = await $authHost.get(`api/assembly/recipes/history/${processId}/passport`);
    return data;
};

export const updateAssemblyPassport = async (processId: number, completedSteps: number[]) => {
    const { data } = await $authHost.put(`api/assembly/recipes/history/${processId}`, { completedSteps });
    return data;
};

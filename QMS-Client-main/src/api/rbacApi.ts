import { $authHost } from "./index";

export interface AbilityModel {
    id: number;
    code: string;
    description: string;
}

export interface RoleModel {
    id: number;
    name: string;
    description: string;
    abilities: AbilityModel[];
}

export const fetchAllRoles = async () => {
    const { data } = await $authHost.get("api/rbac/roles");
    return data as RoleModel[];
};

export const fetchAllAbilities = async () => {
    const { data } = await $authHost.get("api/rbac/abilities");
    return data as AbilityModel[];
};

export const updateRoleAbilities = async (roleId: number, abilityIds: number[]) => {
    const { data } = await $authHost.post(`api/rbac/role/${roleId}`, { abilityIds });
    return data;
};

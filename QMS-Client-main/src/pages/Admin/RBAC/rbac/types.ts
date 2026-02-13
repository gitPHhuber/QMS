import type { AbilityModel } from "src/api/rbacApi";

export interface AbilityGroup {
    prefix: string;
    label: string;
    abilities: AbilityModel[];
    isExpanded: boolean;
}

export interface KeycloakStatus {
    connected: boolean;
    mode: string;
    message?: string;
    realm?: string;
    url?: string;
    error?: string;
}

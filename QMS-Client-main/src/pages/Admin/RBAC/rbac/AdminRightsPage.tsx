import React, { useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
    fetchAllRoles,
    fetchAllAbilities,
    updateRoleAbilities,
    RoleModel,
    AbilityModel
} from "src/api/rbacApi";
import { fetchUsers } from "src/api/userApi";
import { userGetModel } from "src/types/UserModel";
import { Shield, Loader2, Users, Key, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { AbilityGroup, KeycloakStatus } from "./types";
import { GROUP_LABELS } from "./constants";
import { UsersView } from "./UsersView";
import { MatrixView } from "./MatrixView";

export const AdminRightsPage: React.FC = observer(() => {
    const [viewMode, setViewMode] = useState<"USERS" | "MATRIX">("USERS");
    const [loading, setLoading] = useState(false);
    const [kcStatus, setKcStatus] = useState<KeycloakStatus | null>(null);

    const [roles, setRoles] = useState<RoleModel[]>([]);
    const [abilities, setAbilities] = useState<AbilityModel[]>([]);
    const [users, setUsers] = useState<userGetModel[]>([]);

    const [matrix, setMatrix] = useState<Record<number, Set<number>>>({});
    const [originalMatrix, setOriginalMatrix] = useState<Record<number, Set<number>>>({});
    const [savingId, setSavingId] = useState<number | null>(null);
    const [savingAll, setSavingAll] = useState(false);

    const [userSearch, setUserSearch] = useState("");
    const [abilitySearch, setAbilitySearch] = useState("");

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [compactMode, setCompactMode] = useState(false);

    useEffect(() => {
        loadData();
        loadKeycloakStatus();
    }, []);

    const loadKeycloakStatus = async () => {
        try {
            const { $authHost } = await import("src/api/index");
            const { data } = await $authHost.get("api/rbac/keycloak/status");
            setKcStatus(data);
        } catch {
            // silently ignore — endpoint might not exist yet
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesData, abilitiesData, usersData] = await Promise.all([
                fetchAllRoles(),
                fetchAllAbilities(),
                fetchUsers()
            ]);

            setRoles(rolesData);
            setAbilities(abilitiesData);
            setUsers(usersData);

            const initialMatrix: Record<number, Set<number>> = {};
            rolesData.forEach(role => {
                const abilityIds = new Set(role.abilities.map(a => a.id));
                initialMatrix[role.id] = abilityIds;
            });
            setMatrix(initialMatrix);
            setOriginalMatrix(JSON.parse(JSON.stringify(
                Object.fromEntries(
                    Object.entries(initialMatrix).map(([k, v]) => [k, Array.from(v)])
                )
            )));

            const prefixes = new Set(abilitiesData.map(a => a.code.split('.')[0]));
            setExpandedGroups(prefixes);
        } catch (e) {
            console.error(e);
            toast.error("Ошибка загрузки данных безопасности");
        } finally {
            setLoading(false);
        }
    };

    const groupedAbilities = useMemo(() => {
        const groups: Record<string, AbilityModel[]> = {};
        abilities.forEach(ability => {
            const prefix = ability.code.split('.')[0];
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push(ability);
        });

        const filtered: AbilityGroup[] = Object.entries(groups)
            .map(([prefix, abs]) => ({
                prefix,
                label: GROUP_LABELS[prefix] || prefix,
                abilities: abs.filter(a =>
                    !abilitySearch ||
                    a.code.toLowerCase().includes(abilitySearch.toLowerCase()) ||
                    a.description.toLowerCase().includes(abilitySearch.toLowerCase())
                ),
                isExpanded: expandedGroups.has(prefix)
            }))
            .filter(g => g.abilities.length > 0)
            .sort((a, b) => a.label.localeCompare(b.label));

        return filtered;
    }, [abilities, abilitySearch, expandedGroups]);

    const togglePermission = (roleId: number, abilityId: number) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.name === 'SUPER_ADMIN') {
            toast('Права Супер-Админа неизменны', { icon: '🔒' });
            return;
        }
        setMatrix(prev => {
            const roleAbilities = new Set(prev[roleId]);
            if (roleAbilities.has(abilityId)) {
                roleAbilities.delete(abilityId);
            } else {
                roleAbilities.add(abilityId);
            }
            return { ...prev, [roleId]: roleAbilities };
        });
    };

    const toggleGroupForRole = (roleId: number, groupPrefix: string) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.name === 'SUPER_ADMIN') {
            toast('Права Супер-Админа неизменны', { icon: '🔒' });
            return;
        }
        const groupAbilities = abilities.filter(a => a.code.startsWith(groupPrefix + '.'));
        const groupIds = groupAbilities.map(a => a.id);
        setMatrix(prev => {
            const roleAbilities = new Set(prev[roleId]);
            const allChecked = groupIds.every(id => roleAbilities.has(id));
            if (allChecked) {
                groupIds.forEach(id => roleAbilities.delete(id));
            } else {
                groupIds.forEach(id => roleAbilities.add(id));
            }
            return { ...prev, [roleId]: roleAbilities };
        });
    };

    const hasChanges = (roleId: number): boolean => {
        const current = matrix[roleId] || new Set();
        const original = new Set(originalMatrix[roleId] || []);
        if (current.size !== original.size) return true;
        for (const id of current) {
            if (!original.has(id)) return true;
        }
        return false;
    };

    const changedRolesCount = useMemo(() => {
        return roles.filter(r => hasChanges(r.id)).length;
    }, [roles, matrix, originalMatrix]);

    const saveRole = async (roleId: number) => {
        setSavingId(roleId);
        try {
            const abilityIds = Array.from(matrix[roleId] || []);
            await updateRoleAbilities(roleId, abilityIds);
            toast.success("Права роли обновлены");
            setOriginalMatrix(prev => ({ ...prev, [roleId]: new Set(abilityIds) }));
            const updatedRoles = roles.map(r => {
                if (r.id === roleId) {
                    const newAbilities = abilities.filter(a => abilityIds.includes(a.id));
                    return { ...r, abilities: newAbilities };
                }
                return r;
            });
            setRoles(updatedRoles);
        } catch (e) {
            toast.error("Ошибка сохранения");
        } finally {
            setSavingId(null);
        }
    };

    const saveAllChanges = async () => {
        const changedRoles = roles.filter(r => hasChanges(r.id));
        if (changedRoles.length === 0) return;
        setSavingAll(true);
        let successCount = 0;
        let errorCount = 0;
        for (const role of changedRoles) {
            try {
                const abilityIds = Array.from(matrix[role.id] || []);
                await updateRoleAbilities(role.id, abilityIds);
                setOriginalMatrix(prev => ({ ...prev, [role.id]: new Set(abilityIds) }));
                successCount++;
            } catch (e) {
                errorCount++;
            }
        }
        setSavingAll(false);
        if (errorCount === 0) {
            toast.success(`Сохранено ${successCount} ролей`);
        } else {
            toast.error(`Ошибки: ${errorCount} из ${changedRoles.length}`);
        }
        loadData();
    };

    const getUserAbilities = (userRoleName: string) => {
        if (userRoleName === 'SUPER_ADMIN') return abilities;
        const roleObj = roles.find(r => r.name === userRoleName);
        return roleObj ? roleObj.abilities : [];
    };

    const toggleGroup = (prefix: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(prefix)) next.delete(prefix);
            else next.add(prefix);
            return next;
        });
    };

    const expandAllGroups = () => {
        setExpandedGroups(new Set(abilities.map(a => a.code.split('.')[0])));
    };

    const collapseAllGroups = () => {
        setExpandedGroups(new Set());
    };

    if (loading && roles.length === 0) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-indigo-600" size={32}/>
            </div>
        );
    }

    return (
        <div className="p-6 bg-asvo-surface min-h-screen">
            <div className="max-w-full mx-auto">
                {kcStatus && kcStatus.mode === 'dev-bypass' && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-medium">
                        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                        <span>Режим разработки — Keycloak отключён (AUTH_MODE=dev-bypass)</span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-asvo-text">Контроль доступа</h1>
                            <p className="text-asvo-text-mid font-medium">RBAC: Роли и полномочия</p>
                        </div>
                    </div>

                    <div className="bg-asvo-card p-1 rounded-xl shadow-sm border border-asvo-border flex">
                        <button
                            onClick={() => setViewMode("USERS")}
                            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                                viewMode === "USERS"
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-asvo-text-mid hover:bg-asvo-surface/50"
                            }`}
                        >
                            <Users size={18} /> Пользователи
                        </button>
                        <button
                            onClick={() => setViewMode("MATRIX")}
                            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                                viewMode === "MATRIX"
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-asvo-text-mid hover:bg-asvo-surface/50"
                            }`}
                        >
                            <Key size={18} /> Матрица прав
                        </button>
                    </div>
                </div>

                {viewMode === "USERS" && (
                    <UsersView
                        users={users}
                        userSearch={userSearch}
                        setUserSearch={setUserSearch}
                        getUserAbilities={getUserAbilities}
                    />
                )}

                {viewMode === "MATRIX" && (
                    <MatrixView
                        roles={roles}
                        abilities={abilities}
                        matrix={matrix}
                        groupedAbilities={groupedAbilities}
                        compactMode={compactMode}
                        setCompactMode={setCompactMode}
                        abilitySearch={abilitySearch}
                        setAbilitySearch={setAbilitySearch}
                        expandAllGroups={expandAllGroups}
                        collapseAllGroups={collapseAllGroups}
                        toggleGroup={toggleGroup}
                        togglePermission={togglePermission}
                        toggleGroupForRole={toggleGroupForRole}
                        hasChanges={hasChanges}
                        saveRole={saveRole}
                        savingId={savingId}
                        changedRolesCount={changedRolesCount}
                        saveAllChanges={saveAllChanges}
                        savingAll={savingAll}
                    />
                )}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce-in {
                    0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                    50% { transform: scale(1.05) translateY(-5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-bounce-in {
                    animation: bounce-in 0.4s ease-out;
                }
            `}</style>
        </div>
    );
});

export default AdminRightsPage;

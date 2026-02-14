import React from "react";
import { Search, User } from "lucide-react";
import type { userGetModel } from "src/types/UserModel";
import type { AbilityModel } from "src/api/rbacApi";

interface UsersViewProps {
    users: userGetModel[];
    userSearch: string;
    setUserSearch: (v: string) => void;
    getUserAbilities: (roleName: string) => AbilityModel[];
}

export const UsersView: React.FC<UsersViewProps> = ({
    users,
    userSearch,
    setUserSearch,
    getUserAbilities,
}) => {
    const filteredUsers = users.filter(u =>
        u.login.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.surname?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 text-asvo-text-dim w-5 h-5"/>
                <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Поиск сотрудника..."
                />
            </div>

            <div className="bg-asvo-card rounded-xl shadow-sm border border-asvo-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-asvo-surface border-b border-asvo-border text-xs font-bold text-asvo-text-mid uppercase">
                        <tr>
                            <th className="p-4">Сотрудник</th>
                            <th className="p-4">Роль (Keycloak)</th>
                            <th className="p-4">Активные права</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-asvo-border/50">
                        {filteredUsers.map(user => {
                            const effectiveAbilities = getUserAbilities(user.role);
                            return (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-asvo-surface-2 flex items-center justify-center text-asvo-text-mid overflow-hidden border border-asvo-border">
                                                {user.img ? (
                                                    <img src={user.img} alt="" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <User size={20}/>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-asvo-text">
                                                    {user.surname} {user.name}
                                                </div>
                                                <div className="text-xs text-asvo-text-dim">{user.login}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1 max-w-xl">
                                            {effectiveAbilities.length > 0 ? effectiveAbilities.map(ab => (
                                                <span
                                                    key={ab.id}
                                                    className="px-2 py-0.5 bg-asvo-surface-2 text-asvo-text-mid rounded text-[10px] border border-asvo-border"
                                                    title={ab.code}
                                                >
                                                    {ab.description}
                                                </span>
                                            )) : (
                                                <span className="text-asvo-text-dim text-sm italic">Нет прав</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-asvo-text-dim">Сотрудники не найдены</div>
                )}
            </div>
        </div>
    );
};

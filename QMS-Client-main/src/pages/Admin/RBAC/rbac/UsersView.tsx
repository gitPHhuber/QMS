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
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5"/>
                <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Поиск сотрудника..."
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                            <th className="p-4">Сотрудник</th>
                            <th className="p-4">Роль (Keycloak)</th>
                            <th className="p-4">Активные права</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => {
                            const effectiveAbilities = getUserAbilities(user.role);
                            return (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-200">
                                                {user.img ? (
                                                    <img src={user.img} alt="" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <User size={20}/>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {user.surname} {user.name}
                                                </div>
                                                <div className="text-xs text-gray-400">{user.login}</div>
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
                                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200"
                                                    title={ab.code}
                                                >
                                                    {ab.description}
                                                </span>
                                            )) : (
                                                <span className="text-gray-400 text-sm italic">Нет прав</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Сотрудники не найдены</div>
                )}
            </div>
        </div>
    );
};

import React from "react";
import {
    Search, CheckSquare, Square,
    Loader2, X, ChevronDown, ChevronRight,
    AlertCircle, Save,
} from "lucide-react";
import type { RoleModel, AbilityModel } from "src/api/rbacApi";
import type { AbilityGroup } from "./types";

interface MatrixViewProps {
    roles: RoleModel[];
    abilities: AbilityModel[];
    matrix: Record<number, Set<number>>;
    groupedAbilities: AbilityGroup[];
    compactMode: boolean;
    setCompactMode: (v: boolean) => void;
    abilitySearch: string;
    setAbilitySearch: (v: string) => void;
    expandAllGroups: () => void;
    collapseAllGroups: () => void;
    toggleGroup: (prefix: string) => void;
    togglePermission: (roleId: number, abilityId: number) => void;
    toggleGroupForRole: (roleId: number, groupPrefix: string) => void;
    hasChanges: (roleId: number) => boolean;
    saveRole: (roleId: number) => void;
    savingId: number | null;
    changedRolesCount: number;
    saveAllChanges: () => void;
    savingAll: boolean;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
    roles,
    abilities,
    matrix,
    groupedAbilities,
    compactMode,
    setCompactMode,
    abilitySearch,
    setAbilitySearch,
    expandAllGroups,
    collapseAllGroups,
    toggleGroup,
    togglePermission,
    toggleGroupForRole,
    hasChanges,
    saveRole,
    savingId,
    changedRolesCount,
    saveAllChanges,
    savingAll,
}) => {
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                        <input
                            value={abilitySearch}
                            onChange={e => setAbilitySearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Поиск права..."
                        />
                        {abilitySearch && (
                            <button
                                onClick={() => setAbilitySearch("")}
                                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16}/>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAllGroups}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            Развернуть всё
                        </button>
                        <button
                            onClick={collapseAllGroups}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            Свернуть всё
                        </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={compactMode}
                            onChange={e => setCompactMode(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600">Компактный режим</span>
                    </label>

                    <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
                        <span>{roles.length} ролей</span>
                        <span>{abilities.length} прав</span>
                        <span>{groupedAbilities.length} групп</span>
                    </div>
                </div>
            </div>

            {/* Matrix table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className={`
                                    ${compactMode ? 'p-2 min-w-[160px]' : 'p-4 min-w-[220px]'}
                                    text-left bg-gray-50 border-b border-r
                                    sticky left-0 z-20
                                    shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                `}>
                                    <div className="text-xs text-gray-400 font-normal uppercase mb-1">Роль</div>
                                    <div className="font-bold text-gray-800">Название роли</div>
                                </th>

                                {groupedAbilities.map(group => (
                                    <th
                                        key={group.prefix}
                                        colSpan={group.isExpanded ? group.abilities.length : 1}
                                        className={`
                                            ${compactMode ? 'p-1' : 'p-2'}
                                            text-center bg-gray-100 border-b border-r
                                            ${!group.isExpanded ? 'cursor-pointer hover:bg-gray-200' : ''}
                                        `}
                                        onClick={() => !group.isExpanded && toggleGroup(group.prefix)}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleGroup(group.prefix); }}
                                                className="p-1 hover:bg-gray-200 rounded transition"
                                            >
                                                {group.isExpanded
                                                    ? <ChevronDown size={14} className="text-gray-500"/>
                                                    : <ChevronRight size={14} className="text-gray-500"/>
                                                }
                                            </button>
                                            <span className="font-bold text-gray-700 text-xs uppercase">
                                                {group.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 ml-1">
                                                ({group.abilities.length})
                                            </span>
                                        </div>
                                    </th>
                                ))}

                                <th className={`
                                    ${compactMode ? 'p-2 min-w-[70px]' : 'p-4 min-w-[100px]'}
                                    bg-gray-50 border-b
                                    sticky right-0 z-20
                                    shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                `}>
                                    <div className="text-xs text-gray-500 font-bold">Сохр.</div>
                                </th>
                            </tr>

                            {/* Sub-header for expanded abilities */}
                            <tr>
                                <th className={`
                                    ${compactMode ? 'p-1' : 'p-2'}
                                    bg-gray-50 border-b border-r
                                    sticky left-0 z-20
                                    shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                `}></th>

                                {groupedAbilities.map(group => (
                                    group.isExpanded ? (
                                        group.abilities.map(ab => (
                                            <th
                                                key={ab.id}
                                                className={`
                                                    ${compactMode ? 'p-1 min-w-[80px]' : 'p-2 min-w-[110px]'}
                                                    text-center bg-gray-50 border-b border-r align-top
                                                `}
                                            >
                                                <div className={`
                                                    ${compactMode ? 'text-[8px]' : 'text-[10px]'}
                                                    text-gray-400 font-mono mb-0.5 truncate
                                                `} title={ab.code}>
                                                    .{ab.code.split('.')[1]}
                                                </div>
                                                <div className={`
                                                    ${compactMode ? 'text-[9px]' : 'text-xs'}
                                                    font-semibold text-gray-600 leading-tight
                                                `} title={ab.description}>
                                                    {compactMode
                                                        ? ab.description.slice(0, 12) + (ab.description.length > 12 ? '…' : '')
                                                        : ab.description
                                                    }
                                                </div>
                                            </th>
                                        ))
                                    ) : (
                                        <th key={group.prefix + '-collapsed'} className="p-1 bg-gray-50 border-b border-r">
                                            <div className="text-[10px] text-gray-400 italic">свёрнуто</div>
                                        </th>
                                    )
                                ))}

                                <th className={`
                                    ${compactMode ? 'p-1' : 'p-2'}
                                    bg-gray-50 border-b
                                    sticky right-0 z-20
                                    shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                `}></th>
                            </tr>
                        </thead>

                        <tbody>
                            {roles.map(role => {
                                const isChanged = hasChanges(role.id);
                                const isSuperAdmin = role.name === 'SUPER_ADMIN';

                                return (
                                    <tr
                                        key={role.id}
                                        className={`
                                            hover:bg-indigo-50/30 transition group
                                            ${isChanged ? 'bg-amber-50/50' : ''}
                                        `}
                                    >
                                        <td className={`
                                            ${compactMode ? 'p-2' : 'p-4'}
                                            border-r border-b bg-white
                                            sticky left-0 z-10
                                            group-hover:bg-indigo-50/30
                                            ${isChanged ? 'bg-amber-50/50 group-hover:bg-amber-100/50' : ''}
                                            shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                        `}>
                                            <div className={`font-bold text-gray-800 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                                {role.description}
                                            </div>
                                            <div className={`text-indigo-500 font-mono mt-0.5 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                                {role.name}
                                            </div>
                                            {isChanged && (
                                                <div className="flex items-center gap-1 mt-1 text-amber-600">
                                                    <AlertCircle size={12}/>
                                                    <span className="text-[10px]">Изменено</span>
                                                </div>
                                            )}
                                        </td>

                                        {groupedAbilities.map(group => (
                                            group.isExpanded ? (
                                                group.abilities.map(ab => {
                                                    const isChecked = isSuperAdmin || matrix[role.id]?.has(ab.id);
                                                    return (
                                                        <td
                                                            key={ab.id}
                                                            onClick={() => togglePermission(role.id, ab.id)}
                                                            className={`
                                                                ${compactMode ? 'p-1' : 'p-2'}
                                                                border-r border-b text-center
                                                                ${isSuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                                                transition-colors
                                                                ${isChecked ? 'bg-indigo-50/50' : ''}
                                                                ${!isSuperAdmin && 'hover:bg-indigo-100/50'}
                                                            `}
                                                        >
                                                            <div className="flex justify-center">
                                                                {isChecked
                                                                    ? <CheckSquare size={compactMode ? 16 : 20} className="text-indigo-600"/>
                                                                    : <Square size={compactMode ? 16 : 20} className="text-gray-300"/>
                                                                }
                                                            </div>
                                                        </td>
                                                    );
                                                })
                                            ) : (
                                                <td
                                                    key={group.prefix + '-collapsed'}
                                                    onClick={() => !isSuperAdmin && toggleGroupForRole(role.id, group.prefix)}
                                                    className={`
                                                        ${compactMode ? 'p-1' : 'p-2'}
                                                        border-r border-b text-center
                                                        ${isSuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-indigo-100/50'}
                                                        transition-colors
                                                    `}
                                                    title="Клик для переключения всей группы"
                                                >
                                                    {(() => {
                                                        const groupAbilities = abilities.filter(a => a.code.startsWith(group.prefix + '.'));
                                                        const checkedCount = isSuperAdmin
                                                            ? groupAbilities.length
                                                            : groupAbilities.filter(a => matrix[role.id]?.has(a.id)).length;
                                                        const total = groupAbilities.length;

                                                        return (
                                                            <div className={`
                                                                font-mono font-bold
                                                                ${checkedCount === total ? 'text-green-600' :
                                                                  checkedCount === 0 ? 'text-gray-400' : 'text-amber-600'}
                                                                ${compactMode ? 'text-xs' : 'text-sm'}
                                                            `}>
                                                                {checkedCount}/{total}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            )
                                        ))}

                                        <td className={`
                                            ${compactMode ? 'p-1' : 'p-2'}
                                            border-b bg-white
                                            sticky right-0 z-10
                                            group-hover:bg-indigo-50/30
                                            ${isChanged ? 'bg-amber-50/50 group-hover:bg-amber-100/50' : ''}
                                            shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]
                                        `}>
                                            <button
                                                onClick={() => saveRole(role.id)}
                                                disabled={!isChanged || savingId === role.id || isSuperAdmin}
                                                className={`
                                                    p-2 rounded-lg transition-all flex items-center justify-center
                                                    ${isChanged && !isSuperAdmin
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }
                                                `}
                                                title={isSuperAdmin ? 'Права Супер-Админа неизменны' : isChanged ? 'Сохранить изменения' : 'Нет изменений'}
                                            >
                                                {savingId === role.id
                                                    ? <Loader2 size={16} className="animate-spin"/>
                                                    : <Save size={16}/>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 px-2">
                <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600"/>
                    <span>Право включено</span>
                </div>
                <div className="flex items-center gap-2">
                    <Square size={16} className="text-gray-300"/>
                    <span>Право выключено</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 rounded"/>
                    <span>Есть несохранённые изменения</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-green-600 font-bold">3/3</span>
                    <span>Все права группы (в свёрнутом виде)</span>
                </div>
            </div>

            {/* Floating save-all button */}
            {changedRolesCount > 0 && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
                    <button
                        onClick={saveAllChanges}
                        disabled={savingAll}
                        className="
                            flex items-center gap-3 px-6 py-4
                            bg-gradient-to-r from-indigo-600 to-purple-600
                            text-white font-bold rounded-2xl
                            shadow-2xl shadow-indigo-500/40
                            hover:from-indigo-700 hover:to-purple-700
                            transition-all transform hover:scale-105
                            disabled:opacity-70 disabled:cursor-not-allowed
                        "
                    >
                        {savingAll ? (
                            <>
                                <Loader2 size={24} className="animate-spin"/>
                                <span>Сохранение...</span>
                            </>
                        ) : (
                            <>
                                <Save size={24}/>
                                <span>Сохранить всё</span>
                                <span className="
                                    ml-2 px-2 py-1
                                    bg-white/20 rounded-full
                                    text-sm font-mono
                                ">
                                    {changedRolesCount}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

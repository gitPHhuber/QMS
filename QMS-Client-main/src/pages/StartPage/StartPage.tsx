import React, { useState, useEffect, useContext } from "react";
import { Context } from "src/main";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  Box, Activity, ArrowRight, Clock,
  Users, Settings,
  ClipboardList,
  Monitor, Laptop, RefreshCw, AlertTriangle, CheckCircle2, Circle
} from "lucide-react";
import {
  WAREHOUSE_ROUTE,
  TASKS_ROUTE,
  ADMIN_ROUTE,
} from "src/utils/consts";
import { fetchPC, fetchSession, fetchUsers } from "src/api/userApi";


const UPDATES = [
    { ver: "3.00", date: "10.02", desc: "QMS-ядро: документы, риски, NC/CAPA." },
    { ver: "2.04", date: "21.01", desc: "Виджет онлайн пользователей." },
];


const HeroCard = ({ title, sub, icon: Icon, to }: any) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(to)}
            className="group relative col-span-1 md:col-span-2 lg:col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-2xl bg-asvo-dark-2/70 border border-slate-700/50 p-8 text-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:shadow-xl"
        >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500 opacity-[0.04] blur-3xl transition-transform duration-700 group-hover:scale-150 group-hover:opacity-[0.08]"></div>
            <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-black/20 to-transparent"></div>

            <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-cyan-500/10 p-4 border border-cyan-500/20 backdrop-blur-md transition-transform duration-300 group-hover:rotate-6 group-hover:bg-cyan-500/15">
                        <Icon size={32} className="text-cyan-400" />
                    </div>
                    <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 backdrop-blur-md font-mono">
                        QMS
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-100 md:text-4xl">{title}</h2>
                    <p className="mt-2 max-w-sm text-sm font-medium text-slate-400 opacity-90">{sub}</p>
                    <div className="mt-6 flex items-center gap-2 font-bold text-cyan-400 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
                        Перейти <ArrowRight size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
};


const InfoTile = ({ title, sub, icon: Icon, to, accentClass, iconClass }: any) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(to)}
            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-700/50 bg-asvo-dark-2/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 col-span-1"
        >
            <div className={clsx("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.04] transition-transform duration-500 group-hover:scale-150", accentClass)}></div>
            <div className="flex items-start justify-between">
                <div className={clsx("rounded-xl p-3 border transition-transform duration-300 group-hover:scale-110", accentClass)}>
                    <Icon size={24} className={iconClass} strokeWidth={2} />
                </div>
            </div>
            <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-200 transition-colors group-hover:text-cyan-400">{title}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>
            </div>
        </div>
    );
};


const SystemWidget = () => (
    <div className="col-span-1 md:col-span-1 lg:row-span-2 flex flex-col gap-4">
        <div className="flex-1 rounded-2xl border border-slate-700/50 bg-asvo-dark-2/50 p-6 shadow-sm relative overflow-hidden">
             <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400"/> Статус
                </h3>
                <span className="flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
             </div>
             <div className="space-y-4">
                 <div className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/30 p-3">
                     <div className="flex items-center gap-3">
                         <div className="text-xs font-bold text-slate-400 font-mono">Core API</div>
                     </div>
                     <span className="text-[10px] font-bold text-emerald-400 font-mono">ONLINE</span>
                 </div>
             </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-700/50 bg-asvo-dark/80 p-6 text-slate-400 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none"></div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                Updates
            </h3>
            <div className="space-y-3">
                {UPDATES.map((u, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                        <span className="font-mono text-cyan-400 min-w-[32px]">{u.ver}</span>
                        <p className="leading-snug text-slate-500">{u.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


interface OnlineUser {
  id: number;
  name: string;
  surname: string;
  role: string;
  pcName: string | null;
  isPersonalLaptop: boolean;
}

const OnlineUsersWidget = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const loadOnlineUsers = async () => {
        try {
            setLoading(true);
            const [sessions, users, pcs] = await Promise.all([
                fetchSession(),
                fetchUsers(),
                fetchPC().catch(() => [])
            ]);

            const activeSessions = sessions.filter((s: any) => s.online === true);

            const online: OnlineUser[] = activeSessions.map((session: any) => {
                const user = users.find((u: any) => u.id === session.userId);
                const pc = pcs.find((p: any) => p.id === session.PCId);
                return {
                    id: user?.id || 0,
                    name: user?.name || "Неизвестный",
                    surname: user?.surname || "",
                    role: user?.role || "USER",
                    pcName: pc?.pc_name || null,
                    isPersonalLaptop: session.PCId === null
                };
            });

            const uniqueOnline = online.filter((user, index, self) =>
                index === self.findIndex(u => u.id === user.id)
            );

            setOnlineUsers(uniqueOnline);
            setLastUpdate(new Date());
        } catch (e) {
            console.error("Ошибка загрузки онлайн пользователей:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOnlineUsers();
        const interval = setInterval(loadOnlineUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRoleLabel = (role: string) => {
        const roles: Record<string, string> = {
            SUPER_ADMIN: "Админ", ADMIN: "Админ",
            WAREHOUSE_MASTER: "Склад", QC_ENGINEER: "ОТК",
            USER: "User"
        };
        return roles[role] || role;
    };

    const canReboot = onlineUsers.length === 0;

    return (
        <div className="col-span-1 md:col-span-2 row-span-2 rounded-2xl border border-slate-700/50 bg-asvo-dark-2/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-700/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-2.5 rounded-xl border",
                            onlineUsers.length > 0
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-slate-800/50 border-slate-700/30"
                        )}>
                            <Users size={20} className={onlineUsers.length > 0 ? "text-emerald-400" : "text-slate-500"} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200">Сейчас в системе</h3>
                            <p className="text-xs text-slate-500">
                                Обн: {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border",
                            canReboot
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                            {canReboot ? (
                                <><CheckCircle2 size={12} /> OK</>
                            ) : (
                                <><AlertTriangle size={12} /> {onlineUsers.length}</>
                            )}
                        </div>
                        <button
                            onClick={loadOnlineUsers}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <RefreshCw size={14} className={clsx("text-slate-500", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading && onlineUsers.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw size={20} className="text-slate-600 animate-spin" />
                    </div>
                ) : onlineUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-14 h-14 mb-3 rounded-full bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                            <Users size={24} className="text-slate-500" />
                        </div>
                        <p className="font-medium text-slate-400 text-sm">Никого нет</p>
                        <p className="text-xs text-slate-600 mt-1">Можно ребутать сервер</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {onlineUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20 hover:bg-slate-700/40 hover:border-slate-600/30 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/80 to-teal-600/80 flex items-center justify-center text-white text-xs font-bold">
                                            {user.name[0]}{user.surname?.[0] || ""}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-asvo-dark-2 rounded-full"></span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-200 text-sm leading-tight">
                                            {user.name} {user.surname?.[0] ? user.surname[0] + "." : ""}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-500 font-mono">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    {user.isPersonalLaptop ? (
                                        <Laptop size={12} />
                                    ) : (
                                        <Monitor size={12} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {onlineUsers.length > 0 && (
                <div className="px-5 py-2.5 bg-slate-800/30 border-t border-slate-700/30 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Онлайн: <span className="font-bold text-emerald-400 font-mono">{onlineUsers.length}</span>
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                            <Circle size={6} className="fill-emerald-500 text-emerald-500" />
                            <span className="font-mono">Live</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const StartPage: React.FC = observer(() => {
    const { user } = useContext(Context)!;
    const [greeting, setGreeting] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now);
            const hour = now.getHours();
            if (hour < 12) setGreeting("Доброе утро");
            else if (hour < 18) setGreeting("Добрый день");
            else setGreeting("Добрый вечер");
        };
        updateTime();
        const t = setInterval(updateTime, 1000);
        return () => clearInterval(t);
    }, []);

    const today = currentTime.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const isAdmin = user.can('admin.access') || user.can('users.manage');

    return (
        <div className="min-h-screen bg-asvo-dark p-6 lg:p-10 font-sans text-slate-200 pb-20">
            <div className="max-w-[1400px] mx-auto animate-slide-in-up">

                <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                            <Clock size={14} className="text-cyan-400"/>
                            {today}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-100 md:text-5xl">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">{user.user?.name || "Коллега"}</span>.
                        </h1>
                        <p className="mt-2 text-lg font-medium text-slate-500">
                            Добро пожаловать в систему менеджмента качества.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 rounded-xl bg-asvo-dark-2/70 px-5 py-3 border border-slate-700/50">
                            <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono">
                                {user.user?.name?.[0] || "U"}
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-slate-500 font-mono">Ваша роль</div>
                                <div className="font-bold text-cyan-400">{user.user?.role || "Сотрудник"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 auto-rows-auto">

                    <HeroCard
                        title="Задачи"
                        sub="Управление рабочими задачами и проектами"
                        icon={ClipboardList}
                        to={TASKS_ROUTE}
                    />

                    <InfoTile
                        title="Склад"
                        sub="Остатки и движение"
                        icon={Box}
                        to={WAREHOUSE_ROUTE}
                        accentClass="bg-emerald-500/10 border-emerald-500/20"
                        iconClass="text-emerald-400"
                    />

                    {isAdmin && (
                        <InfoTile
                            title="Админка"
                            sub="Настройки системы"
                            icon={Settings}
                            to={ADMIN_ROUTE}
                            accentClass="bg-slate-700/50 border-slate-600/30"
                            iconClass="text-slate-400"
                        />
                    )}

                    <SystemWidget />

                    {isAdmin && <OnlineUsersWidget />}
                </div>
            </div>
        </div>
    );
});

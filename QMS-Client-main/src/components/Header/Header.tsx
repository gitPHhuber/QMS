
import React, { useContext, Fragment, useState, useEffect, useRef } from "react";
import Logo from "assets/images/logo.svg";
import { NavLink, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "src/main";
import { useAppAuth as useAuth } from "src/hooks/useAppAuth";
import { Menu, Transition } from "@headlessui/react";
import { setSessionOnline } from "src/api/userApi";
import { DateTimeDisplay } from "./DateTimeDisplay";
import clsx from "clsx";


import {
  Shield, ShieldCheck, Archive,
  ClipboardList, User, LogOut,
  ChevronDown, FileText, AlertTriangle, ClipboardCheck, BarChart3, LayoutDashboard,
  Truck, GraduationCap, Wrench,
} from "lucide-react";


import {
  ADMIN_ROUTE,
  WAREHOUSE_ROUTE, TASKS_ROUTE,
  PROFILE_ROUTE,
  QMS_DASHBOARD_ROUTE, DOCUMENTS_ROUTE, NC_ROUTE, CAPA_ROUTE,
  RISKS_ROUTE, SUPPLIERS_ROUTE, INTERNAL_AUDITS_ROUTE,
  TRAINING_ROUTE, EQUIPMENT_ROUTE, REVIEW_ROUTE,
} from "src/utils/consts";

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  permissions?: string[];
  children?: { label: string; to: string; icon?: React.ElementType }[];
};


export const HEADER_HEIGHT = 56;

export const Header: React.FC = observer(() => {
  const auth = useAuth();
  const context = useContext(Context);
  const _location = useLocation();

  if (!context) throw new Error("Context required");
  const { user, modules } = context;


  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;


      setIsAtTop(currentScrollY < 5);


      const scrollDiff = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDiff) < scrollThreshold) {
        return;
      }

      if (scrollDiff > 0 && currentScrollY > HEADER_HEIGHT) {

        setIsVisible(false);
      } else {

        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const logOut = async () => {
    try {
      const userId = Number(localStorage.getItem("userID"));
      const pcId = localStorage.getItem("pcID");
      const pcIdNum = pcId === "PERSONAL" ? null : Number(pcId);
      if (userId) await setSessionOnline(false, userId, pcIdNum);
    } catch (error) { console.error(error); }

    user.resetUser();
    localStorage.clear();
    sessionStorage.clear();
    await auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin });
  };


  const navigation: NavItem[] = [
    {
      label: "Задачи",
      icon: ClipboardList,
      to: TASKS_ROUTE,
    },
    // QMS — dropdown if any qms module is enabled
    ...(modules.hasGroup('qms') ? [{
      label: "Качество",
      icon: ShieldCheck,
      children: [
        modules.isEnabled('qms.dashboard') ? { label: "Дашборд", to: QMS_DASHBOARD_ROUTE, icon: BarChart3 } : null,
        modules.isEnabled('qms.dms')       ? { label: "Документы", to: DOCUMENTS_ROUTE, icon: FileText } : null,
        modules.isEnabled('qms.nc')        ? { label: "Несоответствия", to: NC_ROUTE, icon: AlertTriangle } : null,
        modules.isEnabled('qms.capa')      ? { label: "CAPA", to: CAPA_ROUTE, icon: ClipboardCheck } : null,
        modules.isEnabled('qms.risk')      ? { label: "Риски", to: RISKS_ROUTE, icon: Shield } : null,
        modules.isEnabled('qms.supplier')  ? { label: "Поставщики", to: SUPPLIERS_ROUTE, icon: Truck } : null,
        modules.isEnabled('qms.audit')     ? { label: "Аудиты", to: INTERNAL_AUDITS_ROUTE, icon: ClipboardCheck } : null,
        modules.isEnabled('qms.training')  ? { label: "Обучение", to: TRAINING_ROUTE, icon: GraduationCap } : null,
        modules.isEnabled('qms.equipment') ? { label: "Оборудование", to: EQUIPMENT_ROUTE, icon: Wrench } : null,
        modules.isEnabled('qms.review')    ? { label: "Анализ руководства", to: REVIEW_ROUTE, icon: BarChart3 } : null,
      ].filter(Boolean) as { label: string; to: string; icon?: React.ElementType }[],
    } as NavItem] : []),
    // WMS
    ...(modules.hasGroup('wms') ? [{
      label: "Склад",
      icon: Archive,
      to: WAREHOUSE_ROUTE,
      permissions: ["warehouse.view"],
    }] : []),
    // Admin
    {
      label: "Админ",
      icon: Shield,
      to: ADMIN_ROUTE,
      permissions: ["admin.access"],
    },
  ];


  const visibleNav = navigation.filter(item => {
      if (!item.permissions) return true;
      return item.permissions.some(p => user.can(p));
  });

  return (
    <div
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 h-14",
        "bg-asvo-dark/95 backdrop-blur-sm border-b border-asvo-dark-3/50 shadow-sm",
        "transition-transform duration-300 ease-in-out",
        !isVisible && "-translate-y-full",
        isAtTop && "shadow-none"
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 h-full flex justify-between items-center">

        <div className="flex items-center gap-6 min-w-max">
          <NavLink to="/" className="flex items-center gap-2 group">
            <img src={Logo} alt="Logo" className="h-7 w-auto group-hover:opacity-80 transition-opacity" />
            <span className="text-lg font-bold text-asvo-accent tracking-tight leading-none">
              ASVO-QMS
            </span>
          </NavLink>
          <div className="h-6 w-px bg-asvo-dark-3 hidden lg:block"></div>
        </div>

        {auth.isAuthenticated && (
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNav.map((item, idx) => (
              <Fragment key={idx}>
                {item.children ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className={({ open }) => clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all outline-none",
                        open ? "bg-asvo-dark-2 text-asvo-accent" : "text-asvo-muted hover:bg-asvo-dark-2 hover:text-asvo-light"
                    )}>
                      <item.icon size={16} />
                      <span>{item.label}</span>
                      <ChevronDown size={12} className="opacity-50" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-[cubic-bezier(0.16,1,0.3,1)] duration-200"
                      enterFrom="transform opacity-0 scale-95 -translate-y-2"
                      enterTo="transform opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100 translate-y-0"
                      leaveTo="transform opacity-0 scale-95 -translate-y-2"
                    >
                      <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-asvo-dark-3/30 rounded-lg bg-asvo-dark-2 shadow-lg ring-1 ring-asvo-dark-3/50 focus:outline-none z-50">
                        <div className="p-1">
                          {item.children.map((sub, sIdx) => (
                            <Menu.Item key={sIdx}>
                              {({ active }) => (
                                <NavLink
                                  to={sub.to}
                                  className={clsx(
                                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                                    active ? "bg-asvo-dark-3/50 text-asvo-accent font-medium" : "text-asvo-muted hover:bg-asvo-dark-3/30"
                                  )}
                                >
                                  {sub.icon && <sub.icon size={14} className={active ? "text-asvo-accent" : "text-asvo-muted"} />}
                                  {sub.label}
                                </NavLink>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <NavLink
                    to={item.to!}
                    className={({ isActive }) => clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        isActive
                          ? "bg-asvo-dark-2 text-asvo-accent font-bold"
                          : "text-asvo-muted hover:bg-asvo-dark-2 hover:text-asvo-light"
                    )}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                )}
              </Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4 min-w-max">
          {modules.config?.tier === 'dev-all' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-yellow-400">
              DEV — все модули
            </span>
          )}
          <div className="hidden xl:block text-right">
             <DateTimeDisplay />
          </div>

          {auth.isAuthenticated ? (
            <Menu as="div" className="relative ml-2">
                <Menu.Button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-asvo-dark-2 transition border border-transparent hover:border-asvo-dark-3 group outline-none">
                    <div className="flex flex-col items-end leading-none mr-1">
                        <span className="text-xs font-bold text-asvo-light">{user.user?.surname} {user.user?.name?.[0]}.</span>
                        <span className="text-[10px] text-asvo-muted">{user.user?.role}</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-asvo-dark-3 overflow-hidden ring-2 ring-asvo-dark-2 shadow-sm">
                         {user.user?.img
                            ? <img src={`${import.meta.env.VITE_API_URL}/${user.user.img}`} alt="" className="h-full w-full object-cover"/>
                            : <div className="h-full w-full flex items-center justify-center text-asvo-accent font-bold text-xs">{user.user?.name?.[0]}</div>
                         }
                    </div>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-asvo-dark-3/30 rounded-lg bg-asvo-dark-2 shadow-lg ring-1 ring-asvo-dark-3/50 focus:outline-none z-50">
                    <div className="p-1">
                      <Menu.Item>
                        {({ active }) => (
                          <NavLink
                            to={PROFILE_ROUTE}
                            className={clsx(
                              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                              active ? "bg-asvo-dark-3/50 text-asvo-accent" : "text-asvo-muted"
                            )}
                          >
                            <User size={14} />
                            Профиль
                          </NavLink>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="p-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logOut}
                            className={clsx(
                              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                              active ? "bg-red-900/30 text-red-400" : "text-asvo-muted"
                            )}
                          >
                            <LogOut size={14} />
                            Выйти
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
            </Menu>
          ) : null}
        </div>
      </div>
    </div>
  );
});

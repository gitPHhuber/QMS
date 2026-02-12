import React, { useState, useContext } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import { Context } from "src/main";

import {
  Shield,
  Users,
  Network,
  Package,
  History,
  Plus,
  ArrowUpRight,
  Settings,
  Blocks,
} from "lucide-react";

import { CreatePC } from "./CreateModals/CreatePC";
import { Modal } from "src/components/Modal/Modal";

import {
  ADMIN_RBAC_ROUTE,
  ADMIN_USERS_ROUTE,
  STRUCTURE_ROUTE,
  AUDIT_LOG_ROUTE,
  ADMIN_WAREHOUSE_ROUTE,
  ADMIN_MODULES_ROUTE,
} from "src/utils/consts";

import {
  CREATE_COMPUTER,
} from "src/utils/constsModalType";


interface BentoItemProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  link: string;
  className?: string;
  colorClass?: string;
  iconColorClass?: string;
  onAdd?: () => void;
}

const BentoItem: React.FC<BentoItemProps> = ({
  title,
  subtitle,
  icon: Icon,
  link,
  className,
  colorClass = "bg-asvo-card hover:border-asvo-border-lt",
  iconColorClass = "text-asvo-accent bg-asvo-accent-dim",
  onAdd,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(link)}
      className={clsx(
        "relative p-6 rounded-3xl border border-asvo-border shadow-sm transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1",
        colorClass,
        className
      )}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-5 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />

      <div className="flex justify-between items-start z-10">
        <div className={clsx("p-3 rounded-2xl", iconColorClass)}>
          <Icon size={28} strokeWidth={1.5} />
        </div>
        <div className="p-2 rounded-full text-asvo-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={20} />
        </div>
      </div>

      <div className="mt-4 z-10">
        <h3 className="text-xl font-bold tracking-tight mb-1 text-asvo-text">{title}</h3>
        {subtitle && (
          <p className="text-sm opacity-70 font-medium leading-tight text-asvo-text-mid">
            {subtitle}
          </p>
        )}
      </div>

      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="absolute bottom-4 right-4 p-2 bg-asvo-surface-2/90 backdrop-blur-sm border border-asvo-border rounded-xl text-asvo-text-mid shadow-sm hover:bg-asvo-accent hover:text-white hover:border-asvo-accent transition-all z-20"
          title="Быстрое создание"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};


export const AdminPanel: React.FC = observer(() => {
  const { user } = useContext(Context)!;
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<string | null>(null);

  const openModal = (type: string) => setModalType(type);
  const closeModal = () => setModalType(null);

  const canManageUsers =
    user.can("users.manage") || user.can("admin.users_manage");

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-asvo-text tracking-tight">
          Центр управления
        </h1>
        <p className="text-asvo-text-mid mt-2 text-lg">
          Администрирование системы менеджмента качества
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[180px]">
        {(canManageUsers || user.can("rbac.manage")) && (
          <div className="md:col-span-2 row-span-2 bg-asvo-surface rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl border border-asvo-border">
            <div className="absolute top-0 right-0 w-96 h-96 bg-asvo-accent rounded-full blur-[100px] opacity-10 -mr-20 -mt-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <Shield size={40} className="text-asvo-accent" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(CREATE_COMPUTER)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition backdrop-blur-sm border border-white/5"
                  >
                    + ПК
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-2">Безопасность</h2>
                <p className="text-asvo-text-mid mb-6 max-w-md">
                  Управление ролевой моделью (RBAC), пользователями и рабочими станциями.
                </p>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(ADMIN_RBAC_ROUTE)}
                    className="flex items-center gap-2 px-5 py-3 bg-asvo-accent hover:bg-asvo-accent/80 text-asvo-bg rounded-xl font-bold transition shadow-lg"
                  >
                    <Settings size={18} /> Доступ (RBAC)
                  </button>
                  <button
                    onClick={() => navigate(ADMIN_USERS_ROUTE)}
                    className="flex items-center gap-2 px-5 py-3 bg-asvo-surface-3 hover:bg-asvo-grey rounded-xl font-bold transition"
                  >
                    <Users size={18} /> Пользователи
                  </button>
                  <button
                    onClick={() => navigate(AUDIT_LOG_ROUTE)}
                    className="flex items-center gap-2 px-5 py-3 bg-asvo-surface-2 hover:bg-asvo-surface-3 border border-asvo-border rounded-xl font-bold transition"
                  >
                    <History size={18} /> Аудит
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.can("admin.structure_manage") && (
          <BentoItem
            title="Структура"
            subtitle="Цеха, участки и бригады"
            icon={Network}
            link={STRUCTURE_ROUTE}
            className="md:col-span-2"
            colorClass="bg-asvo-card border border-asvo-border hover:border-asvo-blue hover:shadow-lg"
            iconColorClass="bg-asvo-blue-dim text-asvo-blue"
          />
        )}

        {user.can("warehouse.manage") && (
          <BentoItem
            title="WMS Склад"
            subtitle="Поставки и хранение"
            icon={Package}
            link={ADMIN_WAREHOUSE_ROUTE}
            colorClass="bg-asvo-card border-asvo-border hover:border-asvo-green"
            iconColorClass="bg-asvo-green-dim text-asvo-green"
          />
        )}

        {(canManageUsers || user.can("rbac.manage")) && (
          <BentoItem
            title="Модули"
            subtitle="Тариф и активные модули"
            icon={Blocks}
            link={ADMIN_MODULES_ROUTE}
            colorClass="bg-asvo-card border border-asvo-border hover:border-asvo-purple hover:shadow-lg"
            iconColorClass="bg-asvo-purple-dim text-asvo-purple"
          />
        )}
      </div>

      <Modal isOpen={modalType === CREATE_COMPUTER} onClose={closeModal}>
        <CreatePC />
      </Modal>
    </div>
  );
});

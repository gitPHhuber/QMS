import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from 'src/main';
import {
  Shield, FileText, Archive, Factory,
  CheckCircle, XCircle, Package, Crown, Globe
} from 'lucide-react';

const GROUP_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  core:    { label: 'Ядро',              icon: Shield,        color: 'text-blue-400' },
  qms:     { label: 'Качество (QMS)',    icon: FileText,      color: 'text-teal-400' },
  wms:     { label: 'Склад (WMS)',       icon: Archive,       color: 'text-amber-400' },
  mes:     { label: 'Производство (MES)',icon: Factory,       color: 'text-orange-400' },
  erp:     { label: 'Планирование (ERP)',icon: Package,       color: 'text-purple-400' },
  ru:      { label: 'Российская специфика', icon: Globe,      color: 'text-red-400' },
  premium: { label: 'Premium',           icon: Crown,         color: 'text-yellow-400' },
  addon:   { label: 'Дополнительные',    icon: Package,       color: 'text-asvo-text-dim' },
};

export const ModulesPage: React.FC = observer(() => {
  const context = useContext(Context);
  if (!context) throw new Error('Context required');
  const { modules } = context;

  useEffect(() => {
    if (!modules.config) modules.fetchModules();
  }, []);

  if (modules.loading) {
    return <div className="p-6 text-asvo-muted">Загрузка модулей...</div>;
  }

  const config = modules.config!;
  const grouped = new Map<string, typeof config.modules>();

  for (const mod of config.modules) {
    if (!grouped.has(mod.group)) grouped.set(mod.group, []);
    grouped.get(mod.group)!.push(mod);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-asvo-light mb-1">Модули системы</h1>
      <p className="text-sm text-asvo-muted mb-6">
        Тариф: <span className="text-asvo-accent font-bold">{modules.tierName}</span>
        {' \u2022 '}
        Активно: {config.enabled.length} из {config.modules.length} модулей
        {' \u2022 '}
        Пользователей: до {config.maxUsers}
      </p>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([group, mods]) => {
          const meta = GROUP_META[group] || { label: group, icon: Package, color: 'text-asvo-text-dim' };
          const Icon = meta.icon;
          const enabledInGroup = mods.filter(m => m.enabled).length;

          return (
            <div key={group} className="bg-asvo-dark-2 rounded-xl border border-asvo-dark-3/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} className={meta.color} />
                <h2 className="text-sm font-bold text-asvo-light">{meta.label}</h2>
                <span className="text-xs text-asvo-muted ml-auto">
                  {enabledInGroup}/{mods.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mods.map(mod => (
                  <div
                    key={mod.code}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      mod.enabled
                        ? 'bg-asvo-dark-3/30 text-asvo-light'
                        : 'bg-asvo-dark/50 text-asvo-muted/50'
                    }`}
                  >
                    {mod.enabled
                      ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      : <XCircle size={14} className="text-asvo-dark-3 flex-shrink-0" />
                    }
                    <span className={mod.enabled ? '' : 'line-through'}>{mod.name}</span>
                    <code className="text-[10px] text-asvo-muted/50 ml-auto">{mod.code}</code>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

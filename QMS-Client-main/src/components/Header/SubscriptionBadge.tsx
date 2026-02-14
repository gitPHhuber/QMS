import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from 'src/main';
import { Shield, AlertTriangle, XOctagon } from 'lucide-react';
import clsx from 'clsx';

export const SubscriptionBadge: React.FC = observer(() => {
  const context = useContext(Context);
  if (!context) return null;
  const { modules, license } = context;

  // Dev mode badge (no license configured)
  if (modules.config?.tier === 'dev-all' && !license.isActive) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-yellow-400">
        DEV — все модули
      </span>
    );
  }

  // No license active — show nothing (env-based config, no badge needed)
  if (!license.isActive) return null;

  const variant = license.badgeVariant;
  const tierName = license.tierDisplayName;
  const days = license.license?.daysRemaining;

  if (variant === 'danger') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/50 text-red-400">
        <XOctagon size={11} />
        Лицензия истекла
      </span>
    );
  }

  if (variant === 'warning') {
    const label = license.isGrace
      ? `${tierName} — grace ${days} дн.`
      : `${tierName} — ${days} дн.`;
    return (
      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/50 text-amber-400">
        <AlertTriangle size={11} />
        {label}
      </span>
    );
  }

  // variant === 'ok'
  return (
    <span className={clsx(
      "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full",
      "bg-emerald-900/20 border border-emerald-700/40 text-emerald-400"
    )}>
      <Shield size={11} />
      {tierName}
    </span>
  );
});

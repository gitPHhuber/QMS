import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from 'src/main';
import clsx from 'clsx';

export const SubscriptionBadge = observer(() => {
  const context = useContext(Context);
  if (!context) return null;
  const { license } = context;

  if (license.loading || !license.hasLicense) return null;

  const color = license.badgeColor;
  const daysText = license.isExpired
    ? (license.isInGrace ? 'Грейс' : 'Истекла')
    : `${license.daysUntilExpiry} дн.`;

  return (
    <span
      className={clsx(
        'text-[10px] px-2 py-0.5 rounded-full border',
        color === 'green' && 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400',
        color === 'yellow' && 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400',
        color === 'red' && 'bg-red-900/30 border-red-700/50 text-red-400',
      )}
      title={`Лицензия: ${license.tierName}, ${daysText}`}
    >
      {license.tierName} · {daysText}
    </span>
  );
});

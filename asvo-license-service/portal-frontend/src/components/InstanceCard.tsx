interface Instance {
  id: string;
  name: string;
  version: string;
  status: 'online' | 'offline';
  lastHeartbeat: string;
}

interface Props {
  instance: Instance;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'только что';
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} мин. назад`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} ч. назад`;
  }
  const d = Math.floor(diffSec / 86400);
  return `${d} дн. назад`;
}

export type { Instance };

export default function InstanceCard({ instance }: Props) {
  const isOnline = instance.status === 'online';

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-5 hover:border-accent/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-txt-primary truncate">{instance.name}</h3>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isOnline
              ? 'bg-status-green/10 text-status-green'
              : 'bg-txt-secondary/10 text-txt-secondary'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-status-green animate-pulse' : 'bg-txt-secondary'
            }`}
          />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-txt-secondary">Версия</span>
          <span className="text-txt-primary font-mono">{instance.version}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-txt-secondary">Последний отклик</span>
          <span className="text-txt-primary">{relativeTime(instance.lastHeartbeat)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-txt-secondary">ID</span>
          <span className="text-txt-primary font-mono text-xs">{instance.id.slice(0, 12)}...</span>
        </div>
      </div>
    </div>
  );
}

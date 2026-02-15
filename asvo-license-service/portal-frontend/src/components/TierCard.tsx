export interface TierPreset {
  key: string;
  name: string;
  price: number;
  maxUsers: number;
  maxStorageGb: number;
  modulesCount: number;
  features: string[];
}

export const TIER_PRESETS: TierPreset[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: 4900,
    maxUsers: 5,
    maxStorageGb: 10,
    modulesCount: 3,
    features: ['Документооборот', 'Аудит-трейл', 'Базовые отчёты'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 14900,
    maxUsers: 25,
    maxStorageGb: 50,
    modulesCount: 7,
    features: [
      'Всё из Starter',
      'CAPA / Отклонения',
      'Обучение персонала',
      'Управление рисками',
      'Валидация',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 34900,
    maxUsers: 100,
    maxStorageGb: 200,
    modulesCount: 12,
    features: [
      'Всё из Professional',
      'Управление поставщиками',
      'Электронная подпись',
      'BI-дашборды',
      'API-интеграции',
    ],
  },
  {
    key: 'corporate',
    name: 'Corporate',
    price: 79900,
    maxUsers: 500,
    maxStorageGb: 1000,
    modulesCount: 15,
    features: [
      'Всё из Enterprise',
      'Мульти-площадки',
      'SSO / LDAP',
      'Выделенная поддержка',
      'SLA 99.9%',
    ],
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    price: 149900,
    maxUsers: -1,
    maxStorageGb: -1,
    modulesCount: 18,
    features: [
      'Всё из Corporate',
      'Безлимит пользователей',
      'Безлимит хранилища',
      'On-premise опция',
      'Персональный менеджер',
    ],
  },
];

interface Props {
  tier: TierPreset;
  selected?: boolean;
  onSelect?: (key: string) => void;
}

export default function TierCard({ tier, selected, onSelect }: Props) {
  const fmt = (n: number) =>
    n === -1 ? 'Безлимит' : n.toLocaleString('ru-RU');

  return (
    <div
      onClick={() => onSelect?.(tier.key)}
      className={`rounded-xl p-5 border-2 transition-all cursor-pointer ${
        selected
          ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
          : 'border-dark-border bg-dark-card hover:border-accent/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-txt-primary">{tier.name}</h3>
        {selected && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            Выбран
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-2xl font-bold text-accent">
          {tier.price.toLocaleString('ru-RU')} &#8381;
        </span>
        <span className="text-txt-secondary text-sm"> / мес</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-dark-bg/50 rounded-lg py-2">
          <div className="text-sm font-medium text-txt-primary">{fmt(tier.maxUsers)}</div>
          <div className="text-xs text-txt-secondary">Польз.</div>
        </div>
        <div className="bg-dark-bg/50 rounded-lg py-2">
          <div className="text-sm font-medium text-txt-primary">{fmt(tier.maxStorageGb)} Гб</div>
          <div className="text-xs text-txt-secondary">Хранилище</div>
        </div>
        <div className="bg-dark-bg/50 rounded-lg py-2">
          <div className="text-sm font-medium text-txt-primary">{tier.modulesCount}</div>
          <div className="text-xs text-txt-secondary">Модулей</div>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-1.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-txt-secondary">
            <span className="text-accent mt-0.5">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

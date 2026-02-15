# Интеграция ALS с QMS-Server и QMS-Client

Документ описывает взаимодействие между ASVO License Service (ALS) и продуктом ASVO-QMS (QMS-Server + QMS-Client).

---

## Содержание

- [Обзор](#обзор)
- [Текущие файлы интеграции в QMS](#текущие-файлы-интеграции-в-qms)
- [Распространение публичного ключа](#распространение-публичного-ключа)
- [Интеграция heartbeat](#интеграция-heartbeat)
- [Жизненный цикл лицензии](#жизненный-цикл-лицензии)
- [Сценарии состояния лицензии](#сценарии-состояния-лицензии)
- [Обратная совместимость](#обратная-совместимость)
- [Будущие компоненты](#будущие-компоненты)

---

## Обзор

ALS и QMS работают как два независимых сервиса:

```
+------------------+         +------------------+         +------------------+
|   ALS Backend    | <-----> |   QMS-Server     | <-----> |   QMS-Client     |
|                  |         |                  |         |                  |
| - Генерация      | license | - Чтение .lic    | modules | - ModuleStore    |
|   лицензий       | ------> |   файла          | ------> |   (tier, groups) |
| - Управление     |         | - ModuleManager  |         | - Header tier    |
|   подписками     | heartbeat| - Heartbeat      |  API    |   badge          |
| - Биллинг        | <-----> |   Worker (cron)  |         | - Conditional    |
| - Телеметрия     |         | - LicenseService |         |   navigation     |
+------------------+         +------------------+         +------------------+
```

**Ключевые принципы:**

1. ALS генерирует и подписывает лицензии (Ed25519)
2. QMS-Server получает лицензию через heartbeat или ручную активацию
3. QMS-Server проверяет подпись лицензии offline (только публичный ключ)
4. QMS-Client получает список доступных модулей через `GET /api/system/modules`
5. При отсутствии связи с ALS QMS продолжает работать с последней известной лицензией

---

## Текущие файлы интеграции в QMS

### QMS-Server

#### `config/modules.js`

Центральный модуль управления доступностью функционала. Содержит:

- **MODULE_CATALOG** -- полный каталог модулей с зависимостями (79 модулей в 8 группах: `core`, `qms`, `wms`, `mes`, `erp`, `ru`, `premium`, `addon`)
- **TIER_PRESETS** -- предустановки модулей по тарифам (`start`, `standard`, `pro`, `industry`)
- **ModuleManager** -- класс, определяющий доступные модули

```javascript
// config/modules.js -- текущая логика определения модулей
class ModuleManager {
  constructor() {
    const tier = process.env.MODULES_TIER;       // Тариф из .env
    const explicit = process.env.MODULES_ENABLED; // Или явный список

    if (explicit) {
      this.enabled = new Set(explicit.split(',').map(m => m.trim()));
      this.tier = 'custom';
    } else if (tier && TIER_PRESETS[tier]) {
      this.enabled = new Set(TIER_PRESETS[tier]);
      this.tier = tier;
    } else {
      // Нет настроек -> ALL enabled (dev mode, backward compatibility)
      this.enabled = new Set(Object.keys(MODULE_CATALOG));
      this.tier = 'dev-all';
    }
    // Core-модули всегда включены
    // Зависимости разрешаются автоматически
  }
}
```

Ключевые методы:

| Метод            | Описание                                               |
|------------------|---------------------------------------------------------|
| `isEnabled(code)`| Проверка модуля или группы: `isEnabled('qms.dms')`, `isEnabled('qms')` |
| `toClientConfig()` | Полная конфигурация для клиента (tier, enabled, groups, modules) |
| `getEnabledGroups()` | Список активных групп модулей                       |

#### `routes/index.js`

Эндпоинт для получения конфигурации модулей клиентом:

```javascript
// routes/index.js
router.get("/system/modules", (req, res) => {
  res.json(moduleManager.toClientConfig());
});
```

Ответ:

```json
{
  "tier": "pro",
  "enabled": ["qms.dms", "qms.nc", "qms.capa", ...],
  "groups": ["core", "qms", "wms"],
  "maxUsers": 50,
  "modules": [
    { "code": "qms.dms", "name": "Документы СМК", "group": "qms", "enabled": true },
    { "code": "mes.routes", "name": "Маршруты сборки", "group": "mes", "enabled": false }
  ]
}
```

### QMS-Client

#### `store/ModuleStore.ts`

MobX store для управления состоянием модулей на фронтенде:

```typescript
// store/ModuleStore.ts
class ModuleStore {
  config: ModulesConfig | null = null;

  async fetchModules() {
    const { data } = await $host.get<ModulesConfig>('/api/system/modules');
    this.config = data;
  }

  // Проверка доступности модуля
  isEnabled(code: string): boolean { ... }

  // Проверка группы
  hasGroup(group: string): boolean { ... }

  // Название тарифа для отображения
  get tierName(): string {
    const names = {
      start: 'Старт', standard: 'Стандарт', pro: 'Про',
      industry: 'Индустрия', 'dev-all': 'Разработка', fallback: 'Все модули',
    };
    return names[this.config?.tier] || '—';
  }
}
```

#### `components/Header/Header.tsx`

Использует `ModuleStore` для:

- Отображение tier badge (название тарифа)
- Условная навигация: пункты меню скрываются, если модуль не включён
- Группировка навигации по группам (QMS, WMS, MES и т.д.)

```tsx
// Header.tsx (пример использования)
const { modules } = context;

// Показать пункт меню только если модуль включён
{modules.isEnabled('qms.capa') && (
  <NavLink to={CAPA_ROUTE}>CAPA</NavLink>
)}

// Показать группу WMS только если есть хотя бы один модуль
{modules.hasGroup('wms') && (
  <NavLink to={WAREHOUSE_ROUTE}>Склад</NavLink>
)}
```

---

## Распространение публичного ключа

QMS-Server нуждается в `public.key` для offline-проверки подписи лицензий (без обращения к ALS).

### Способы доставки

1. **Через файловую систему (рекомендуется):**

```bash
# На сервере QMS
mkdir -p /opt/qms/keys/
scp user@als-server:/path/to/keys/public.key /opt/qms/keys/public.key
```

Переменная окружения в QMS-Server `.env`:

```env
ALS_PUBLIC_KEY_PATH=/opt/qms/keys/public.key
```

2. **Через environment variable (base64):**

```bash
# Закодировать ключ
cat public.key | base64 -w0
# Результат в .env:
ALS_PUBLIC_KEY=<base64-encoded-key>
```

3. **Через heartbeat (автоматически):**

При первом heartbeat ALS может вернуть публичный ключ в ответе (future feature).

> **ВАЖНО:** Публичный ключ **безопасно** распространять открыто. Он позволяет только проверять подписи, но не создавать их.

---

## Интеграция heartbeat

QMS-Server должен реализовать HeartbeatWorker -- фоновый процесс, периодически отправляющий данные о состоянии инстанса в ALS.

### Архитектура

```
QMS-Server
  |
  +-- workers/
        +-- HeartbeatWorker.js   <-- новый файл
        |
        |   Каждые 60 минут:
        |   1. Собирает метрики (users, storage, modules, errors)
        |   2. POST /api/v1/heartbeat -> ALS
        |   3. Обрабатывает ответ:
        |      - Новая лицензия? -> Сохранить .lic файл
        |      - Команды? -> Выполнить (message -> log, update_license -> save)
        |
        +-- cron.js              <-- добавить HeartbeatWorker в cron
```

### Пример реализации HeartbeatWorker

```javascript
// workers/HeartbeatWorker.js
const axios = require('axios');
const fs = require('fs');
const { moduleManager } = require('../config/modules');

const ALS_URL = process.env.ALS_URL || 'https://als.asvo.tech';
const ALS_API_KEY = process.env.ALS_API_KEY;  // inst_<32hex>
const LICENSE_PATH = process.env.LICENSE_PATH || './license.lic';

class HeartbeatWorker {
  async run() {
    if (!ALS_API_KEY) {
      console.log('HeartbeatWorker: ALS_API_KEY not configured, skipping');
      return;
    }

    try {
      const payload = await this.collectMetrics();
      const response = await this.sendHeartbeat(payload);
      await this.processResponse(response.data);
    } catch (error) {
      console.error('HeartbeatWorker error:', error.message);
      // При ошибке QMS продолжает работать с текущей лицензией
    }
  }

  async collectMetrics() {
    // Пример сбора метрик из QMS
    const db = require('../db');  // ваше подключение к БД

    const usersCount = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const storageGb = await this.getStorageUsedGb();
    const errorsCount = await this.getErrors24h();

    return {
      fingerprint: this.getFingerprint(),
      version: require('../package.json').version,
      modules_active: [...moduleManager.enabled],
      users_count: usersCount,
      storage_used_gb: storageGb,
      os: `${process.platform} ${process.arch}`,
      uptime_hours: process.uptime() / 3600,
      errors_24h: errorsCount,
    };
  }

  async sendHeartbeat(payload) {
    return axios.post(`${ALS_URL}/api/v1/heartbeat`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ALS_API_KEY}`,
      },
      timeout: 10000,  // 10 секунд
    });
  }

  async processResponse(data) {
    // 1. Обновить лицензию, если прислали новую
    if (data.license) {
      fs.writeFileSync(LICENSE_PATH, data.license, 'utf8');
      console.log('HeartbeatWorker: License updated');
    }

    // 2. Обработать команды
    for (const cmd of (data.commands || [])) {
      switch (cmd.type) {
        case 'update_license':
          console.log('HeartbeatWorker: License update received');
          break;
        case 'message':
          const level = cmd.severity === 'error' ? 'error' : 'warn';
          console[level](`ALS Message [${cmd.severity}]: ${cmd.text}`);
          break;
      }
    }
  }

  getFingerprint() {
    const os = require('os');
    const crypto = require('crypto');
    const data = [
      os.hostname(),
      os.cpus()[0]?.model,
      os.totalmem(),
      // Добавьте MAC-адрес сетевого интерфейса для большей уникальности
    ].join('|');
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  async getStorageUsedGb() {
    // Реализация подсчёта используемого хранилища
    return 0;
  }

  async getErrors24h() {
    // Реализация подсчёта ошибок за 24 часа
    return 0;
  }
}

module.exports = { HeartbeatWorker };
```

### Запуск по расписанию (cron)

```javascript
// cron.js (добавить к существующим cron-задачам)
const cron = require('node-cron');
const { HeartbeatWorker } = require('./workers/HeartbeatWorker');

const heartbeatWorker = new HeartbeatWorker();

// Каждые 60 минут
cron.schedule('0 * * * *', () => {
  heartbeatWorker.run();
});

// Первый heartbeat при старте (через 10 секунд)
setTimeout(() => heartbeatWorker.run(), 10000);
```

### Переменные окружения для QMS-Server

```env
# .env QMS-Server
ALS_URL=https://als.asvo.tech
ALS_API_KEY=inst_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ALS_PUBLIC_KEY_PATH=./keys/public.key
LICENSE_PATH=./license.lic
```

---

## Жизненный цикл лицензии

Полный flow от создания лицензии до применения модулей в QMS:

```
1. СОЗДАНИЕ ЛИЦЕНЗИИ (ALS)
   Admin-панель или API -> POST /api/v1/licenses
   |
   v
2. ДОСТАВКА ЛИЦЕНЗИИ (ALS -> QMS)
   Способ A: Heartbeat -> ALS возвращает licenseKey в response.license
   Способ B: Ручная активация -> .lic файл копируется на сервер
   Способ C: Portal reissue -> через портал клиента
   |
   v
3. ПРОВЕРКА ПОДПИСИ (QMS-Server)
   LicenseService читает .lic файл
   -> Проверяет Ed25519 подпись с помощью public.key
   -> Проверяет срок действия (exp, grace_days)
   -> Проверяет fingerprint (если указан)
   |
   v
4. ПРИМЕНЕНИЕ МОДУЛЕЙ (QMS-Server)
   ModuleManager получает список modules из лицензии
   -> Обновляет набор enabled-модулей
   -> Пересчитывает зависимости
   |
   v
5. ПЕРЕДАЧА КЛИЕНТУ (QMS-Server -> QMS-Client)
   GET /api/system/modules -> { tier, enabled, groups, modules }
   |
   v
6. ОТОБРАЖЕНИЕ В UI (QMS-Client)
   ModuleStore.fetchModules()
   -> Header: tier badge
   -> Навигация: скрытие/показ пунктов меню
   -> Роуты: guard для недоступных модулей
```

### License payload (decoded)

```json
{
  "iss": "asvo-license-service",
  "sub": "ООО Медтехника",
  "iat": 1704067200,
  "exp": 1735689600,
  "lid": "license-uuid",
  "tier": "pro",
  "modules": ["qms.dms", "qms.nc", "qms.capa", "qms.risk", "..."],
  "limits": {
    "max_users": 50,
    "max_storage_gb": 100
  },
  "fingerprint": "a1b2c3d4e5f6g7h8",
  "grace_days": 14
}
```

---

## Сценарии состояния лицензии

### Valid (Действительная)

```
Условие: now < exp
Поведение: Все модули из лицензии доступны
UI: Зелёный badge тарифа, полная навигация
```

### Grace Period (Льготный период)

```
Условие: exp < now < exp + grace_days
Поведение: Все модули по-прежнему доступны
UI: Оранжевый badge "Истекает", предупреждение в Header
Heartbeat: ALS отправляет команду message (severity: warning)
```

### Expired (Истекла)

```
Условие: now > exp + grace_days
Поведение: Только core-модули (auth, users, audit, admin, tasks)
UI: Красный badge "Истекла", баннер с предложением продлить
Heartbeat: ALS отправляет команду message (severity: error)
```

### Revoked (Отозвана)

```
Условие: isRevoked = true
Поведение: Только core-модули
UI: Красный badge "Отозвана", контакт с поддержкой
Heartbeat: ALS не выдаёт новую лицензию
```

### No License (Лицензия отсутствует)

```
Условие: Файл .lic не найден И MODULES_TIER/MODULES_ENABLED не заданы
Поведение: ВСЕ модули доступны (dev mode, backward compatibility)
UI: Badge "Разработка" (dev-all)
```

### ALS Offline (Сервер лицензий недоступен)

```
Условие: Heartbeat не проходит (timeout, network error)
Поведение: QMS продолжает работать с последней известной лицензией
UI: Без изменений (но может показать предупреждение)
Heartbeat: Повторная попытка через 60 минут
```

---

## Обратная совместимость

Если QMS-Server не имеет файла лицензии и не подключён к ALS, действует fallback-логика из `config/modules.js`:

```
Приоритет определения модулей:

1. Файл лицензии (.lic) + LicenseService   <-- будущее (ALS integration)
2. MODULES_TIER из .env                     <-- текущая конфигурация
3. MODULES_ENABLED из .env                  <-- ручной override
4. (ничего не задано) -> ALL modules        <-- dev mode
```

Это гарантирует, что:

- Существующие установки QMS **без ALS** продолжат работать без изменений
- Для активации ALS достаточно добавить `ALS_API_KEY` и `ALS_PUBLIC_KEY_PATH` в `.env`
- Переход на ALS не требует миграции данных -- только добавление новых файлов

---

## Будущие компоненты

Следующие файлы планируются к добавлению в QMS для полной интеграции с ALS:

### QMS-Server (новые файлы)

| Файл                        | Описание                                              |
|-----------------------------|--------------------------------------------------------|
| `services/LicenseService.js`| Чтение, проверка подписи и парсинг .lic файла. Кэширование в памяти. Определение состояния (valid/grace/expired/revoked). Предоставляет API для ModuleManager. |
| `middleware/licenseMiddleware.js` | Express middleware для проверки лицензии на каждом запросе. В случае expired лицензии -- ограничение до core-модулей. |

#### Пример LicenseService.js

```javascript
// services/LicenseService.js (план)
const nacl = require('tweetnacl');
const fs = require('fs');

class LicenseService {
  constructor(publicKeyPath, licensePath) {
    this.publicKey = this.loadPublicKey(publicKeyPath);
    this.licensePath = licensePath;
    this.cachedLicense = null;
    this.lastCheck = null;
  }

  loadPublicKey(path) {
    const keyB64 = fs.readFileSync(path, 'utf8').trim();
    return new Uint8Array(Buffer.from(keyB64, 'base64'));
  }

  verify() {
    // Проверить подпись, срок, fingerprint
    // Вернуть { valid, inGrace, expired, revoked, payload }
  }

  getModules() {
    const result = this.verify();
    if (result.valid || result.inGrace) {
      return result.payload.modules;
    }
    return []; // только core
  }

  getState() {
    // 'valid' | 'grace' | 'expired' | 'revoked' | 'missing'
  }
}
```

#### Пример licenseMiddleware.js

```javascript
// middleware/licenseMiddleware.js (план)
const { licenseService } = require('../services/LicenseService');

function licenseMiddleware(req, res, next) {
  const state = licenseService.getState();

  // Всегда разрешать core и system endpoints
  if (req.path.startsWith('/api/system/') || req.path.startsWith('/api/auth/')) {
    return next();
  }

  if (state === 'expired' || state === 'revoked') {
    // Проверить, является ли запрашиваемый модуль core
    const moduleCode = extractModuleFromRoute(req.path);
    if (moduleCode && !moduleCode.startsWith('core.')) {
      return res.status(403).json({
        error: 'License expired',
        message: 'Лицензия истекла. Доступны только базовые модули.',
        state,
      });
    }
  }

  next();
}
```

### QMS-Client (новые файлы)

| Файл                                    | Описание                                              |
|------------------------------------------|--------------------------------------------------------|
| `store/LicenseStore.ts`                  | MobX store для хранения состояния лицензии (valid/grace/expired). Получает данные через `GET /api/system/license-status`. |
| `components/SubscriptionBadge.tsx`       | Компонент badge в Header: зелёный (valid), оранжевый (grace), красный (expired). Показывает tier, дату истечения. |
| `pages/LicenseActivationPage.tsx`        | Страница для ручной активации лицензии: загрузка .lic файла или ввод license key. |

#### Пример LicenseStore.ts

```typescript
// store/LicenseStore.ts (план)
import { makeAutoObservable, runInAction } from 'mobx';
import { $host } from '../api/index';

export type LicenseState = 'valid' | 'grace' | 'expired' | 'revoked' | 'missing' | 'dev';

export interface LicenseStatus {
  state: LicenseState;
  tier: string;
  validUntil: string | null;
  graceDaysLeft: number | null;
  modules: string[];
  limits: { max_users: number; max_storage_gb: number };
}

export default class LicenseStore {
  status: LicenseStatus | null = null;
  loading = true;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchStatus() {
    try {
      this.loading = true;
      const { data } = await $host.get<LicenseStatus>('/api/system/license-status');
      runInAction(() => { this.status = data; });
    } catch {
      runInAction(() => {
        this.status = { state: 'dev', tier: 'dev-all', validUntil: null,
                        graceDaysLeft: null, modules: [], limits: { max_users: 999, max_storage_gb: 999 } };
      });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  get isActive(): boolean {
    return this.status?.state === 'valid' || this.status?.state === 'grace' || this.status?.state === 'dev';
  }

  get badgeColor(): string {
    switch (this.status?.state) {
      case 'valid': return 'green';
      case 'grace': return 'orange';
      case 'expired': case 'revoked': return 'red';
      default: return 'gray';
    }
  }
}
```

#### Пример SubscriptionBadge.tsx

```tsx
// components/SubscriptionBadge.tsx (план)
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Context } from '../main';

export const SubscriptionBadge = observer(() => {
  const { license, modules } = useContext(Context);

  const colors = {
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[license.badgeColor]}`}>
      {modules.tierName}
      {license.status?.state === 'grace' && ' (Истекает)'}
      {license.status?.state === 'expired' && ' (Истекла)'}
    </span>
  );
});
```

### Итоговая карта файлов

```
QMS-Server (добавить)
  +-- services/LicenseService.js         -- Проверка подписи, кэш, состояние
  +-- middleware/licenseMiddleware.js     -- Express middleware
  +-- workers/HeartbeatWorker.js         -- Cron heartbeat -> ALS
  +-- keys/public.key                    -- Публичный ключ ALS

QMS-Client (добавить)
  +-- store/LicenseStore.ts              -- MobX store для лицензии
  +-- components/SubscriptionBadge.tsx   -- Badge в Header
  +-- pages/LicenseActivationPage.tsx    -- Ручная активация
```

После добавления этих файлов QMS будет полностью интегрирован с ALS, обеспечивая автоматическое управление лицензиями, мониторинг инстансов и гибкое управление модулями в зависимости от тарифа подписки.

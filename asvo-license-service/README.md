# ASVO License Service (ALS)

Независимый сервис для управления лицензиями, подписками, биллингом и телеметрией продукта **ASVO-QMS**.

ALS обеспечивает полный жизненный цикл лицензии: генерация Ed25519-подписанных ключей, привязка к инстансу по fingerprint, периодический heartbeat с QMS-Server, автоматическое продление через систему подписок и интеграцию с ЮKassa.

---

## Архитектура

Monorepo на базе npm workspaces, содержит 4 пакета:

| Пакет              | Описание                                           | Технологии                    |
|--------------------|------------------------------------------------------|-------------------------------|
| `cli`              | CLI-утилита для генерации ключей и лицензий           | Commander, TweetNaCl          |
| `backend`          | REST API сервер                                       | Fastify, Prisma, PostgreSQL, Redis |
| `admin-frontend`   | Админ-панель для управления организациями и лицензиями| React, Tailwind CSS, Vite     |
| `portal-frontend`  | Портал клиента для самообслуживания                   | React, Tailwind CSS, Vite     |

```
ALS (монорепо)
  |
  +-- cli/                CLI-утилита (keygen, create, verify)
  +-- backend/            Fastify API + Prisma + cron workers
  +-- admin-frontend/     React SPA — панель администратора
  +-- portal-frontend/    React SPA — портал клиента
```

---

## Quick Start

### Предварительные требования

- **Docker** и **Docker Compose** (v2+)
- **Node.js** 20+ (для локальной разработки без Docker)

### Запуск через Docker

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd asvo-license-service

# 2. Сгенерировать Ed25519 ключи
npx als-cli keygen --output ./keys/

# 3. Запустить все сервисы
docker-compose up --build
```

После запуска доступны:

| Сервис          | URL                        |
|-----------------|----------------------------|
| API (backend)   | http://localhost:4000       |
| Admin-панель    | http://localhost:4001       |
| Портал клиента  | http://localhost:4002       |
| Health check    | http://localhost:4000/health|

---

## CLI Usage

CLI-утилита `als-cli` предоставляет три команды:

### Генерация ключей

```bash
npx als-cli keygen --output ./keys/
# Создаёт ./keys/private.key и ./keys/public.key (Ed25519)
```

### Создание лицензии

```bash
npx als-cli create \
  --key ./keys/private.key \
  --org "ООО Медтехника" \
  --tier pro \
  --modules qms.dms,qms.nc,qms.capa,qms.risk \
  --max-users 50 \
  --max-storage 100 \
  --duration 365 \
  --fingerprint "a1b2c3d4e5" \
  --grace-days 14 \
  -o ./license.lic
```

### Проверка лицензии

```bash
# Проверка из файла
npx als-cli verify --key ./keys/public.key --file ./license.lic

# Проверка из строки
npx als-cli verify --key ./keys/public.key --token "eyJhbGciOi..."
```

Вывод при успешной проверке:

```
License is VALID

Payload:
{
  "iss": "asvo-license-service",
  "sub": "ООО Медтехника",
  "tier": "pro",
  "modules": ["qms.dms", "qms.nc", "qms.capa", "qms.risk"],
  "limits": { "max_users": 50, "max_storage_gb": 100 },
  "grace_days": 14,
  ...
}
```

---

## Структура проекта

```
asvo-license-service/
  +-- package.json              Root workspace manifest
  +-- docker-compose.yml        Production compose
  +-- docker-compose.dev.yml    Development overrides (hot-reload)
  +-- .env.example              Шаблон переменных окружения
  +-- keys/                     Ed25519 keypair (gitignored)
  |
  +-- cli/
  |     +-- index.js            Entry point (Commander)
  |     +-- src/
  |           +-- keygen.js     Генерация ключей
  |           +-- license-create.js  Создание лицензии
  |           +-- license-verify.js  Проверка лицензии
  |           +-- crypto.js     Криптографические утилиты
  |
  +-- backend/
  |     +-- Dockerfile
  |     +-- prisma/
  |     |     +-- schema.prisma  Data model
  |     |     +-- seed.ts        Seed data
  |     +-- src/
  |     |     +-- index.ts       Fastify entry point
  |     |     +-- config.ts      Env schema + TIER_PRESETS
  |     |     +-- routes/        API route handlers
  |     |     +-- services/      Business logic services
  |     |     +-- middleware/     Auth, rate-limit, audit
  |     |     +-- workers/       Cron jobs (billing, alerts, cleanup)
  |     |     +-- utils/         Crypto, email, logger
  |     +-- templates/           HTML email templates
  |     +-- tests/               Unit tests
  |
  +-- admin-frontend/
  |     +-- Dockerfile
  |     +-- src/
  |           +-- api/           API client
  |           +-- store/         Zustand/MobX stores
  |           +-- components/    UI components
  |           +-- pages/         Page components
  |
  +-- portal-frontend/
        +-- Dockerfile
        +-- src/
              +-- api/           API client
              +-- store/         Portal store
              +-- components/    UI components
              +-- pages/         Page components
```

---

## Разработка

Проект использует **npm workspaces**. Все зависимости устанавливаются из корня:

```bash
npm install
```

### Запуск отдельных сервисов

```bash
# API сервер (с hot-reload)
npm run dev:api

# Admin-панель (Vite dev server)
npm run dev:admin

# Портал клиента (Vite dev server)
npm run dev:portal

# Тесты backend
npm run test
```

### Docker-разработка с hot-reload

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Переменные окружения

Полный список переменных находится в файле [`.env.example`](./.env.example).

| Переменная                | Описание                                          | Default                    |
|---------------------------|-----------------------------------------------------|----------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                         | `postgresql://als:als_secret@localhost:5433/als` |
| `REDIS_URL`               | Redis connection string                              | `redis://localhost:6380`   |
| `ED25519_PRIVATE_KEY_PATH`| Путь к приватному ключу Ed25519                      | `./keys/private.key`       |
| `ED25519_PUBLIC_KEY_PATH` | Путь к публичному ключу Ed25519                      | `./keys/public.key`        |
| `JWT_SECRET`              | Секрет для JWT-токенов (portal auth)                 | `change_me_in_production`  |
| `ADMIN_TOKEN`             | Bearer-токен для admin API                           | `admin_secret_change_me`   |
| `PORT`                    | Порт API сервера                                     | `4000`                     |
| `NODE_ENV`                | Окружение (`development` / `production` / `test`)    | `development`              |
| `YUKASSA_SHOP_ID`         | ID магазина ЮKassa (пусто = mock mode)               | —                          |
| `YUKASSA_SECRET_KEY`      | Секретный ключ ЮKassa                                | —                          |
| `SMTP_HOST`               | SMTP-хост (пусто = вывод в консоль)                  | —                          |
| `SMTP_PORT`               | SMTP-порт                                            | `587`                      |
| `SMTP_USER`               | SMTP-пользователь                                    | —                          |
| `SMTP_PASS`               | SMTP-пароль                                          | —                          |
| `SMTP_FROM`               | Адрес отправителя                                    | `noreply@asvo.tech`        |
| `TELEGRAM_BOT_TOKEN`      | Token Telegram-бота для уведомлений                  | —                          |
| `TELEGRAM_ADMIN_CHAT_ID`  | Chat ID для admin-уведомлений                        | —                          |

---

## Tech Stack

| Слой       | Технологии                                                     |
|------------|----------------------------------------------------------------|
| Runtime    | Node.js 20+, TypeScript                                       |
| API        | Fastify, Zod (validation), Pino (logging)                      |
| ORM        | Prisma 5                                                       |
| Database   | PostgreSQL 16                                                  |
| Cache      | Redis 7                                                        |
| Crypto     | TweetNaCl (Ed25519 sign/verify), base64url encoding            |
| Auth       | @fastify/jwt, OTP via email, Bearer token, ApiKey              |
| Billing    | ЮKassa (YuKassa) integration                                  |
| Frontend   | React 18, TypeScript, Tailwind CSS, Vite                       |
| Email      | Nodemailer + HTML templates                                    |
| Alerts     | Telegram Bot API                                               |
| CI/CD      | Docker, Docker Compose                                         |

---

## Порты

| Сервис           | Порт (host) | Порт (container) |
|------------------|-------------|-------------------|
| API (backend)    | 4000        | 4000              |
| Admin-панель     | 4001        | 80 (nginx)        |
| Портал клиента   | 4002        | 80 (nginx)        |
| PostgreSQL       | 5433        | 5432              |
| Redis            | 6380        | 6379              |

---

## Ссылки

- [API Reference](./docs/API.md) -- полная документация REST API
- [Deployment Guide](./docs/DEPLOYMENT.md) -- руководство по production-развёртыванию
- [QMS Integration](./docs/QMS_INTEGRATION.md) -- интеграция с QMS-Server и QMS-Client

# ASVO License Service -- API Reference

Полная документация REST API для ASVO License Service (ALS).

**Base URL:** `http://localhost:4000` (dev) / `https://als.asvo.tech` (prod)

---

## Содержание

- [Аутентификация](#аутентификация)
- [Auth (Public)](#auth-public)
- [Organizations (Bearer)](#organizations-bearer)
- [Instances (Bearer)](#instances-bearer)
- [Licenses (Bearer)](#licenses-bearer)
- [Heartbeat (ApiKey)](#heartbeat-apikey)
- [Subscriptions (Bearer)](#subscriptions-bearer)
- [Payments](#payments)
- [Portal (Portal JWT)](#portal-portal-jwt)
- [Telemetry (Bearer)](#telemetry-bearer)
- [Dashboard (Bearer)](#dashboard-bearer)
- [Health Check](#health-check)
- [Ошибки](#ошибки)

---

## Аутентификация

ALS использует три схемы аутентификации:

### 1. Bearer Token (Admin)

Для admin-эндпоинтов. Используется статический `ADMIN_TOKEN` из переменных окружения или JWT-токен.

```
Authorization: Bearer <ADMIN_TOKEN>
```

### 2. ApiKey (Instance)

Для heartbeat-эндпоинта. Каждый инстанс получает уникальный `apiKey` при регистрации.

```
Authorization: ApiKey inst_<32hex>
```

### 3. Portal JWT

Для portal-эндпоинтов. JWT выдаётся после OTP-верификации, содержит `scope: "portal"` и `orgId`.

```
Authorization: Bearer <JWT_TOKEN>
```

JWT payload:
```json
{
  "sub": "user@company.ru",
  "scope": "portal",
  "orgId": "uuid",
  "exp": 1234567890
}
```

---

## Auth (Public)

Публичные эндпоинты, не требуют аутентификации.

### POST /api/v1/auth/register

Регистрация новой организации. Создаёт Organization, Subscription (trialing) и отправляет приветственное письмо.

**Request Body:**

```json
{
  "orgName": "ООО Медтехника",
  "inn": "7712345678",
  "email": "admin@medtech.ru",
  "contactName": "Иванов Иван",
  "tier": "standard",
  "phone": "+79001234567"
}
```

| Поле          | Тип     | Обязательно | Описание                                        |
|---------------|---------|-------------|---------------------------------------------------|
| `orgName`     | string  | да          | Название организации                               |
| `inn`         | string  | да          | ИНН (10-12 символов)                               |
| `email`       | string  | да          | Контактный email (email-формат)                    |
| `contactName` | string  | да          | Контактное лицо                                    |
| `tier`        | enum    | да          | Тариф: `start`, `standard`, `pro`, `industry`, `corp` |
| `phone`       | string  | нет         | Телефон                                            |

**Response: 201 Created**

```json
{
  "organization": {
    "id": "uuid",
    "name": "ООО Медтехника",
    "inn": "7712345678",
    "contactEmail": "admin@medtech.ru",
    "contactName": "Иванов Иван",
    "tier": "standard",
    "status": "trial",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "subscription": {
    "id": "uuid",
    "tier": "standard",
    "billingCycle": "monthly",
    "priceRub": 35000,
    "status": "trialing",
    "currentPeriodStart": "2025-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-01-31T00:00:00.000Z"
  },
  "message": "Registration successful. Check your email for further instructions."
}
```

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "ООО Медтехника",
    "inn": "7712345678",
    "email": "admin@medtech.ru",
    "contactName": "Иванов Иван",
    "tier": "standard"
  }'
```

---

### POST /api/v1/auth/login

Отправка OTP-кода на email. Код хранится в Redis с TTL 5 минут.

**Request Body:**

```json
{
  "email": "admin@medtech.ru"
}
```

**Response: 200 OK**

```json
{
  "message": "OTP sent to your email"
}
```

**Ошибки:**

| Код | Описание                           |
|-----|------------------------------------|
| 404 | Organization not found for this email |

---

### POST /api/v1/auth/verify-otp

Верификация OTP-кода. При успехе возвращает JWT-токен с scope `portal` (срок действия 24 часа).

**Request Body:**

```json
{
  "email": "admin@medtech.ru",
  "otp": "123456"
}
```

**Response: 200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organization": {
    "id": "uuid",
    "name": "ООО Медтехника",
    "tier": "standard",
    "status": "active"
  }
}
```

**Ошибки:**

| Код | Описание                  |
|-----|---------------------------|
| 400 | OTP expired or not found  |
| 400 | Invalid OTP               |
| 404 | Organization not found    |

**curl:**

```bash
# 1. Запросить OTP
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medtech.ru"}'

# 2. Подтвердить OTP
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medtech.ru", "otp": "123456"}'
```

---

## Organizations (Bearer)

Управление организациями. Все эндпоинты требуют `Authorization: Bearer <ADMIN_TOKEN>`.

### GET /api/v1/orgs

Список организаций с пагинацией и фильтрацией.

**Query Parameters:**

| Параметр  | Тип    | Default | Описание                                         |
|-----------|--------|---------|------------------------------------------------------|
| `search`  | string | —       | Поиск по названию или ИНН (case-insensitive)          |
| `tier`    | enum   | —       | Фильтр по тарифу: `start`, `standard`, `pro`, `industry`, `corp` |
| `status`  | enum   | —       | Фильтр по статусу: `active`, `suspended`, `trial`, `churned` |
| `page`    | number | 1       | Номер страницы                                        |
| `limit`   | number | 20      | Записей на странице                                   |

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ООО Медтехника",
      "inn": "7712345678",
      "contactEmail": "admin@medtech.ru",
      "contactName": "Иванов Иван",
      "tier": "standard",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "_count": { "instances": 2 },
      "subscription": { "id": "uuid", "tier": "standard", "status": "active" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

**curl:**

```bash
curl http://localhost:4000/api/v1/orgs?search=медтех&tier=standard&page=1&limit=10 \
  -H "Authorization: Bearer admin_secret_change_me"
```

---

### POST /api/v1/orgs

Создание организации вручную (через админ-панель).

**Request Body:**

```json
{
  "name": "ООО Фармпром",
  "inn": "7798765432",
  "contactEmail": "contact@farmprom.ru",
  "contactName": "Петрова Мария",
  "contactPhone": "+79009876543",
  "address": "г. Москва, ул. Ленина, 10",
  "tier": "pro",
  "notes": "Крупный клиент, особые условия"
}
```

| Поле           | Тип    | Обязательно | Описание                                           |
|----------------|--------|-------------|------------------------------------------------------|
| `name`         | string | да          | Название организации                                  |
| `inn`          | string | да          | ИНН (10-12 символов, уникальный)                     |
| `contactEmail` | string | да          | Контактный email                                      |
| `contactName`  | string | да          | Контактное лицо                                       |
| `contactPhone` | string | нет         | Телефон                                               |
| `address`      | string | нет         | Адрес                                                 |
| `tier`         | enum   | нет         | Тариф (default: `start`)                              |
| `notes`        | string | нет         | Заметки                                               |

**Response: 201 Created** -- объект Organization.

---

### GET /api/v1/orgs/:id

Детальная информация об организации, включая instances, licenses, subscription с payments и audit logs.

**Response: 200 OK**

```json
{
  "id": "uuid",
  "name": "ООО Медтехника",
  "inn": "7712345678",
  "contactEmail": "admin@medtech.ru",
  "tier": "standard",
  "status": "active",
  "instances": [...],
  "licenses": [...],
  "subscription": {
    "id": "uuid",
    "tier": "standard",
    "billingCycle": "monthly",
    "priceRub": 35000,
    "status": "active",
    "payments": [...]
  },
  "auditLogs": [...]
}
```

**curl:**

```bash
curl http://localhost:4000/api/v1/orgs/<org-uuid> \
  -H "Authorization: Bearer admin_secret_change_me"
```

---

### PATCH /api/v1/orgs/:id

Обновление данных организации. Все поля опциональны.

**Request Body:**

```json
{
  "tier": "pro",
  "status": "active",
  "notes": "Переведён на тариф Pro"
}
```

| Поле           | Тип    | Описание                                       |
|----------------|--------|--------------------------------------------------|
| `name`         | string | Название организации                              |
| `contactEmail` | string | Контактный email                                  |
| `contactPhone` | string | Телефон                                           |
| `contactName`  | string | Контактное лицо                                   |
| `address`      | string | Адрес                                             |
| `tier`         | enum   | `start`, `standard`, `pro`, `industry`, `corp`    |
| `status`       | enum   | `active`, `suspended`, `trial`, `churned`         |
| `notes`        | string | Заметки                                           |

**Response: 200 OK** -- обновлённый объект Organization.

---

## Instances (Bearer)

Управление инстансами QMS. Каждый инстанс привязан к организации и имеет уникальный `apiKey`.

### GET /api/v1/orgs/:id/instances

Список инстансов организации.

**Response: 200 OK**

```json
[
  {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Production Server",
    "fingerprint": "a1b2c3d4e5",
    "version": "2.1.0",
    "status": "online",
    "lastHeartbeatAt": "2025-01-15T12:00:00.000Z",
    "lastIp": "185.1.2.3",
    "modulesActive": ["qms.dms", "qms.nc"],
    "apiKey": "inst_abc123..."
  }
]
```

---

### POST /api/v1/orgs/:id/instances

Регистрация нового инстанса. Автоматически генерирует `apiKey` в формате `inst_<32hex>`.

**Request Body:**

```json
{
  "name": "Production Server",
  "fingerprint": "a1b2c3d4e5f6g7h8"
}
```

| Поле          | Тип    | Обязательно | Описание                |
|---------------|--------|-------------|---------------------------|
| `name`        | string | да          | Имя инстанса               |
| `fingerprint` | string | да          | Hardware fingerprint        |

**Response: 201 Created**

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "name": "Production Server",
  "fingerprint": "a1b2c3d4e5f6g7h8",
  "apiKey": "inst_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "status": "offline",
  "version": "0.0.0",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

> **Важно:** `apiKey` возвращается только при создании. Сохраните его для настройки heartbeat на стороне QMS-Server.

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/orgs/<org-uuid>/instances \
  -H "Authorization: Bearer admin_secret_change_me" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Server", "fingerprint": "a1b2c3d4e5f6g7h8"}'
```

---

### DELETE /api/v1/instances/:id

Деактивация инстанса (переводит в статус `offline`). Инстанс не удаляется из базы.

**Response: 200 OK**

```json
{
  "success": true
}
```

---

### GET /api/v1/instances

Список всех инстансов (across all organizations) с пагинацией.

**Query Parameters:**

| Параметр | Тип    | Default | Описание                                    |
|----------|--------|---------|-----------------------------------------------|
| `status` | enum   | —       | Фильтр: `online`, `offline`, `degraded`       |
| `page`   | number | 1       | Номер страницы                                 |
| `limit`  | number | 50      | Записей на странице                            |

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Production Server",
      "status": "online",
      "lastHeartbeatAt": "2025-01-15T12:00:00.000Z",
      "organization": { "name": "ООО Медтехника", "tier": "standard" }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12, "pages": 1 }
}
```

---

## Licenses (Bearer)

Управление лицензиями. Лицензия -- это Ed25519-подписанный JWT (формат `header.payload.signature`).

### POST /api/v1/licenses

Создание новой лицензии. Payload подписывается приватным ключом Ed25519.

**Request Body:**

```json
{
  "organizationId": "uuid",
  "instanceId": "uuid",
  "tier": "pro",
  "modules": ["qms.dms", "qms.nc", "qms.capa", "qms.risk"],
  "maxUsers": 50,
  "maxStorageGb": 100,
  "durationDays": 365,
  "fingerprint": "a1b2c3d4e5",
  "graceDays": 14
}
```

| Поле             | Тип      | Обязательно | Описание                                          |
|------------------|----------|-------------|-----------------------------------------------------|
| `organizationId` | UUID     | да          | ID организации                                      |
| `instanceId`     | UUID     | нет         | ID инстанса (привязка)                               |
| `tier`           | enum     | да          | Тариф                                               |
| `modules`        | string[] | нет         | Список модулей (default: из TIER_PRESETS)             |
| `maxUsers`       | number   | нет         | Макс. пользователей (default: из TIER_PRESETS)        |
| `maxStorageGb`   | number   | нет         | Макс. хранилище GB (default: из TIER_PRESETS)         |
| `durationDays`   | number   | да          | Срок действия в днях                                  |
| `fingerprint`    | string   | нет         | Hardware fingerprint для привязки                     |
| `graceDays`      | number   | нет         | Grace period в днях (default: 14)                     |

**Response: 201 Created**

```json
{
  "license": {
    "id": "uuid",
    "organizationId": "uuid",
    "instanceId": "uuid",
    "tier": "pro",
    "modules": ["qms.dms", "qms.nc", "qms.capa", "qms.risk"],
    "maxUsers": 50,
    "maxStorageGb": 100,
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validUntil": "2026-01-01T00:00:00.000Z",
    "isRevoked": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "licenseKey": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhc3ZvLWxpY2Vuc2Utc2VydmljZSIsInN1YiI6ItCe0J7QniDQnNC10LTRgtC10YXQvdC40LrQsCIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxNzM1Njg5NjAwLCJsaWQiOiJ1dWlkIiwidGllciI6InBybyIsIm1vZHVsZXMiOlsicW1zLmRtcyIsInFtcy5uYyIsInFtcy5jYXBhIiwicW1zLnJpc2siXSwibGltaXRzIjp7Im1heF91c2VycyI6NTAsIm1heF9zdG9yYWdlX2diIjoxMDB9LCJmaW5nZXJwcmludCI6ImExYjJjM2Q0ZTUiLCJncmFjZV9kYXlzIjoxNH0.SIGNATURE"
}
```

License payload (decoded):

```json
{
  "iss": "asvo-license-service",
  "sub": "ООО Медтехника",
  "iat": 1704067200,
  "exp": 1735689600,
  "lid": "uuid",
  "tier": "pro",
  "modules": ["qms.dms", "qms.nc", "qms.capa", "qms.risk"],
  "limits": {
    "max_users": 50,
    "max_storage_gb": 100
  },
  "fingerprint": "a1b2c3d4e5",
  "grace_days": 14
}
```

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/licenses \
  -H "Authorization: Bearer admin_secret_change_me" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "<org-uuid>",
    "tier": "pro",
    "durationDays": 365,
    "maxUsers": 50,
    "maxStorageGb": 100
  }'
```

---

### GET /api/v1/licenses/:id

Получение лицензии по ID, включая данные Organization и Instance.

**Response: 200 OK**

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "instanceId": "uuid",
  "licenseKey": "eyJ...",
  "tier": "pro",
  "modules": ["qms.dms", "qms.nc"],
  "maxUsers": 50,
  "maxStorageGb": 100,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2026-01-01T00:00:00.000Z",
  "isRevoked": false,
  "organization": { "id": "uuid", "name": "ООО Медтехника" },
  "instance": { "id": "uuid", "name": "Production Server" }
}
```

---

### POST /api/v1/licenses/:id/revoke

Отзыв лицензии.

**Request Body:**

```json
{
  "reason": "Организация прекратила подписку"
}
```

**Response: 200 OK**

```json
{
  "id": "uuid",
  "isRevoked": true,
  "revokedAt": "2025-06-01T00:00:00.000Z",
  "revokeReason": "Организация прекратила подписку"
}
```

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/licenses/<license-uuid>/revoke \
  -H "Authorization: Bearer admin_secret_change_me" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Организация прекратила подписку"}'
```

---

### POST /api/v1/licenses/:id/renew

Продление лицензии. Если лицензия ещё действует, новый срок добавляется к текущему `validUntil`. Если истекла -- от текущей даты.

**Request Body:**

```json
{
  "durationDays": 30
}
```

| Поле           | Тип    | Default | Описание                 |
|----------------|--------|---------|----------------------------|
| `durationDays` | number | 30      | Дополнительные дни          |

**Response: 200 OK** -- обновлённый объект License с новым `licenseKey` и `validUntil`.

---

## Heartbeat (ApiKey)

Механизм периодического обмена данными между QMS-Server (инстансом) и ALS.

### POST /api/v1/heartbeat

QMS-инстанс отправляет heartbeat каждые 60 минут. ALS обновляет статус инстанса, записывает телеметрию и может вернуть команды (обновление лицензии, уведомления).

**Авторизация:** `ApiKey`

```
Authorization: ApiKey inst_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Request Body:**

```json
{
  "fingerprint": "a1b2c3d4e5f6g7h8",
  "version": "2.1.0",
  "modules_active": ["qms.dms", "qms.nc", "qms.capa"],
  "users_count": 12,
  "storage_used_gb": 3.7,
  "os": "Ubuntu 22.04 LTS",
  "uptime_hours": 720.5,
  "errors_24h": 0
}
```

| Поле              | Тип      | Описание                                |
|-------------------|----------|-------------------------------------------|
| `fingerprint`     | string   | Hardware fingerprint инстанса              |
| `version`         | string   | Версия QMS-Server                          |
| `modules_active`  | string[] | Список активных модулей                    |
| `users_count`     | number   | Количество пользователей                   |
| `storage_used_gb` | number   | Использованное хранилище в GB              |
| `os`              | string   | Информация об ОС                          |
| `uptime_hours`    | number   | Время работы в часах                       |
| `errors_24h`      | number   | Количество ошибок за последние 24 часа     |

**Response: 200 OK**

```json
{
  "status": "ok",
  "license": "eyJ...",
  "commands": [
    {
      "type": "update_license"
    },
    {
      "type": "message",
      "severity": "warning",
      "text": "Лицензия истекает через 5 дн. Обновление будет выполнено автоматически."
    }
  ],
  "server_time": "2025-01-15T12:00:00.000Z"
}
```

| Поле в ответе  | Описание                                                                |
|----------------|---------------------------------------------------------------------------|
| `status`       | Всегда `"ok"` при успешной обработке                                      |
| `license`      | Новый licenseKey (если лицензия обновилась с прошлого heartbeat), иначе `null` |
| `commands`     | Массив команд для инстанса                                                |
| `server_time`  | Текущее время сервера (ISO 8601)                                           |

**Типы команд:**

| `type`           | Описание                                         |
|------------------|------------------------------------------------------|
| `update_license` | Новая лицензия прилагается в поле `license`           |
| `message`        | Текстовое уведомление (severity: `info` / `warning` / `error`) |

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/heartbeat \
  -H "Authorization: ApiKey inst_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "fingerprint": "a1b2c3d4e5f6g7h8",
    "version": "2.1.0",
    "modules_active": ["qms.dms", "qms.nc"],
    "users_count": 12,
    "storage_used_gb": 3.7,
    "os": "Ubuntu 22.04 LTS",
    "uptime_hours": 720.5,
    "errors_24h": 0
  }'
```

---

## Subscriptions (Bearer)

Управление подписками организаций.

### POST /api/v1/subscriptions

Создание подписки. Цена рассчитывается автоматически на основе `tier` и `billingCycle` из `TIER_PRESETS`.

**Request Body:**

```json
{
  "organizationId": "uuid",
  "tier": "standard",
  "billingCycle": "monthly"
}
```

| Поле             | Тип  | Default     | Описание                                   |
|------------------|------|-------------|----------------------------------------------|
| `organizationId` | UUID | --          | ID организации (обязательно)                  |
| `tier`           | enum | --          | Тариф (обязательно)                           |
| `billingCycle`   | enum | `monthly`   | Цикл оплаты: `monthly`, `quarterly`, `annual` |

**Тарифная сетка (руб.):**

| Тариф      | Monthly  | Quarterly | Annual     |
|------------|----------|-----------|------------|
| `start`    | 15 000   | 40 500    | 144 000    |
| `standard` | 35 000   | 94 500    | 336 000    |
| `pro`      | 60 000   | 162 000   | 576 000    |
| `industry` | 120 000  | 324 000   | 1 152 000  |
| `corp`     | 0        | 0         | 0          |

**Response: 201 Created**

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "tier": "standard",
  "billingCycle": "monthly",
  "priceRub": 35000,
  "status": "active",
  "currentPeriodStart": "2025-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2025-01-31T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/v1/subscriptions/:id

Обновление подписки (смена тарифа, цикла, отмена автопродления).

**Request Body:**

```json
{
  "tier": "pro",
  "billingCycle": "annual",
  "cancelAtPeriodEnd": false
}
```

| Поле               | Тип     | Описание                                    |
|--------------------|---------|-----------------------------------------------|
| `tier`             | enum    | Новый тариф                                   |
| `billingCycle`     | enum    | Новый цикл: `monthly`, `quarterly`, `annual`  |
| `cancelAtPeriodEnd`| boolean | `true` -- отменить автопродление               |

**Response: 200 OK** -- обновлённый объект Subscription.

---

## Payments

### POST /api/v1/payments/yukassa-webhook

Webhook от ЮKassa. Публичный эндпоинт, проверяется подпись запроса.

**Webhook Payload (от ЮKassa):**

```json
{
  "event": "payment.succeeded",
  "object": {
    "id": "yp_abc123",
    "status": "succeeded",
    "amount": {
      "value": "35000.00",
      "currency": "RUB"
    },
    "metadata": {
      "subscription_id": "uuid"
    },
    "payment_method": {
      "id": "pm_xyz",
      "saved": true
    }
  }
}
```

**Обрабатываемые события:**

| Event               | Действие                                              |
|----------------------|---------------------------------------------------------|
| `payment.succeeded`  | Обновляет Payment (status=succeeded), активирует подписку |
| `payment.canceled`   | Обновляет Payment (status=failed)                       |

**Response: 200 OK**

```json
{
  "status": "ok"
}
```

---

### GET /api/v1/payments

Список платежей (admin). Требует `Authorization: Bearer`.

**Query Parameters:**

| Параметр         | Тип    | Описание                                     |
|------------------|--------|------------------------------------------------|
| `subscriptionId` | UUID   | Фильтр по подписке                             |
| `organizationId` | UUID   | Фильтр по организации                          |
| `status`         | enum   | `pending`, `succeeded`, `failed`, `refunded`    |
| `page`           | number | Номер страницы (default: 1)                     |
| `limit`          | number | Записей на странице (default: 20)               |

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "subscriptionId": "uuid",
      "organizationId": "uuid",
      "amountRub": 35000,
      "status": "succeeded",
      "yukassaPaymentId": "yp_abc123",
      "paidAt": "2025-01-15T12:00:00.000Z",
      "createdAt": "2025-01-15T11:55:00.000Z",
      "subscription": {
        "organization": { "name": "ООО Медтехника" }
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

**curl:**

```bash
curl "http://localhost:4000/api/v1/payments?status=succeeded&page=1&limit=10" \
  -H "Authorization: Bearer admin_secret_change_me"
```

---

## Portal (Portal JWT)

Эндпоинты для портала клиента. Требуют JWT с `scope: "portal"`, полученный через `/api/v1/auth/verify-otp`. Все запросы привязаны к `orgId` из токена.

### GET /api/v1/portal/subscription

Текущая подписка организации.

**Response: 200 OK**

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "tier": "standard",
  "billingCycle": "monthly",
  "priceRub": 35000,
  "status": "active",
  "currentPeriodStart": "2025-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2025-01-31T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "organization": {
    "name": "ООО Медтехника",
    "tier": "standard",
    "status": "active",
    "trialEndsAt": null
  }
}
```

---

### PATCH /api/v1/portal/subscription

Изменение подписки через портал (смена тарифа, цикла оплаты, отмена автопродления).

**Request Body:**

```json
{
  "tier": "pro",
  "billingCycle": "annual",
  "cancelAtPeriodEnd": false
}
```

Все поля опциональны. При смене `tier` обновляется также `Organization.tier`.

**Response: 200 OK** -- обновлённый объект Subscription.

---

### GET /api/v1/portal/payments

История платежей организации.

**Query Parameters:**

| Параметр | Тип    | Default | Описание            |
|----------|--------|---------|------------------------|
| `page`   | number | 1       | Номер страницы          |
| `limit`  | number | 20      | Записей на странице     |

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "amountRub": 35000,
      "status": "succeeded",
      "paidAt": "2025-01-15T12:00:00.000Z",
      "subscription": { "tier": "standard", "billingCycle": "monthly" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "pages": 1 }
}
```

---

### GET /api/v1/portal/instances

Список инстансов организации.

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Production Server",
      "version": "2.1.0",
      "status": "online",
      "lastHeartbeatAt": "2025-01-15T12:00:00.000Z",
      "lastIp": "185.1.2.3",
      "modulesActive": ["qms.dms", "qms.nc"],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/v1/portal/licenses

Список лицензий организации.

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "tier": "standard",
      "modules": ["qms.dms", "qms.nc"],
      "maxUsers": 15,
      "maxStorageGb": 20,
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-04-01T00:00:00.000Z",
      "isRevoked": false,
      "revokedAt": null,
      "revokeReason": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "instance": { "id": "uuid", "name": "Production Server" }
    }
  ]
}
```

---

### POST /api/v1/portal/licenses/reissue

Перевыпуск лицензии при замене оборудования. Старая лицензия отзывается, создаётся новая с тем же сроком (оставшиеся дни).

**Request Body:**

```json
{
  "licenseId": "uuid",
  "newFingerprint": "new_hardware_fp_123",
  "reason": "Замена сервера"
}
```

| Поле             | Тип    | Обязательно | Описание                             |
|------------------|--------|-------------|----------------------------------------|
| `licenseId`      | UUID   | да          | ID текущей лицензии                     |
| `newFingerprint` | string | да          | Fingerprint нового оборудования         |
| `reason`         | string | нет         | Причина перевыпуска                     |

**Response: 201 Created**

```json
{
  "license": {
    "id": "new-uuid",
    "tier": "standard",
    "modules": ["qms.dms", "qms.nc"],
    "maxUsers": 15,
    "maxStorageGb": 20,
    "validFrom": "2025-03-01T00:00:00.000Z",
    "validUntil": "2025-04-01T00:00:00.000Z",
    "isRevoked": false
  },
  "licenseKey": "eyJ...",
  "revokedLicenseId": "old-uuid"
}
```

**curl:**

```bash
curl -X POST http://localhost:4000/api/v1/portal/licenses/reissue \
  -H "Authorization: Bearer <portal-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseId": "<license-uuid>",
    "newFingerprint": "new_hardware_fp_123",
    "reason": "Замена сервера"
  }'
```

---

## Telemetry (Bearer)

Просмотр данных телеметрии, собранных от инстансов через heartbeat.

### GET /api/v1/telemetry/:instanceId

Список событий телеметрии для инстанса.

**Query Parameters:**

| Параметр    | Тип    | Default | Описание                                              |
|-------------|--------|---------|----------------------------------------------------------|
| `eventType` | enum   | —       | Тип: `heartbeat`, `error`, `module_usage`, `version_update` |
| `from`      | string | —       | Дата начала (ISO 8601)                                    |
| `to`        | string | —       | Дата конца (ISO 8601)                                     |
| `limit`     | number | 100     | Кол-во записей                                            |
| `offset`    | number | 0       | Смещение                                                  |

**Response: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "instanceId": "uuid",
      "eventType": "heartbeat",
      "payload": {
        "fingerprint": "a1b2c3d4e5",
        "version": "2.1.0",
        "users_count": 12,
        "storage_used_gb": 3.7,
        "os": "Ubuntu 22.04 LTS",
        "uptime_hours": 720.5,
        "errors_24h": 0
      },
      "createdAt": "2025-01-15T12:00:00.000Z"
    }
  ]
}
```

**curl:**

```bash
curl "http://localhost:4000/api/v1/telemetry/<instance-uuid>?eventType=heartbeat&limit=10" \
  -H "Authorization: Bearer admin_secret_change_me"
```

---

### GET /api/v1/telemetry/:instanceId/stats

Агрегированная статистика по телеметрии за указанный период.

**Query Parameters:**

| Параметр | Тип    | Default | Описание              |
|----------|--------|---------|-----------------------|
| `days`   | number | 30      | Период в днях          |

**Response: 200 OK**

```json
{
  "totalHeartbeats": 720,
  "totalErrors": 3,
  "avgUsersCount": 10.5,
  "avgStorageGb": 3.2,
  "uptimePercent": 99.5
}
```

---

## Dashboard (Bearer)

Сводная статистика для admin-панели.

### GET /api/v1/dashboard/stats

Возвращает ключевые метрики: MRR, ARR, количество организаций, инстансов, лицензий и активные алерты.

**Response: 200 OK**

```json
{
  "mrr": 350000,
  "arr": 4200000,
  "totalOrgs": 42,
  "activeOrgs": 38,
  "totalInstances": 65,
  "onlineInstances": 51,
  "totalLicenses": 70,
  "activeSubs": 38,
  "tierDistribution": [
    { "tier": "start", "count": 10 },
    { "tier": "standard", "count": 15 },
    { "tier": "pro", "count": 8 },
    { "tier": "industry", "count": 5 }
  ],
  "recentPayments": [
    {
      "id": "uuid",
      "amountRub": 35000,
      "status": "succeeded",
      "paidAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "alerts": [
    {
      "type": "instance_offline",
      "instanceId": "uuid",
      "message": "Instance 'Server-2' offline for 4 hours"
    }
  ]
}
```

**curl:**

```bash
curl http://localhost:4000/api/v1/dashboard/stats \
  -H "Authorization: Bearer admin_secret_change_me"
```

---

## Health Check

### GET /health

Проверка работоспособности сервиса. Не требует аутентификации.

**Response: 200 OK**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## Ошибки

Все ошибки возвращаются в едином формате:

### Validation Error (400)

```json
{
  "error": "Validation error",
  "details": [
    { "path": "email", "message": "Invalid email" },
    { "path": "inn", "message": "String must contain at least 10 character(s)" }
  ]
}
```

### Unauthorized (401)

```json
{
  "error": "Missing or invalid Authorization header"
}
```

### Forbidden (403)

```json
{
  "error": "Invalid token scope"
}
```

### Not Found (404)

```json
{
  "error": "Organization not found"
}
```

### Rate Limit (429)

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again later."
}
```

Rate limit: 100 requests per minute per IP.

### Internal Server Error (500)

```json
{
  "error": "Internal Server Error"
}
```

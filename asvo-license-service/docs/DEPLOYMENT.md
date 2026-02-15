# ASVO License Service -- Руководство по production-развёртыванию

Пошаговая инструкция по развёртыванию ALS в production-окружении.

---

## Содержание

- [Предварительные требования](#предварительные-требования)
- [Генерация Ed25519 ключей](#генерация-ed25519-ключей)
- [Конфигурация окружения](#конфигурация-окружения)
- [Запуск через Docker Compose](#запуск-через-docker-compose)
- [Миграция базы данных](#миграция-базы-данных)
- [SSL и reverse proxy](#ssl-и-reverse-proxy)
- [Мониторинг](#мониторинг)
- [Резервное копирование](#резервное-копирование)
- [Чеклист безопасности](#чеклист-безопасности)

---

## Предварительные требования

| Требование       | Минимальная версия | Описание                                  |
|------------------|--------------------|--------------------------------------------|
| Docker           | 24+                | Container runtime                          |
| Docker Compose   | v2+                | Multi-container orchestration              |
| Домен API        | --                 | `als.asvo.tech` (backend API)              |
| Домен Admin      | --                 | `manage.asvo.tech` (admin-панель)          |
| Домен Portal     | --                 | `my.asvo.tech` (портал клиента)            |
| SSL-сертификат   | --                 | Let's Encrypt или коммерческий             |
| RAM              | 2 GB+              | Рекомендуется 4 GB                         |
| Disk             | 20 GB+             | Для PostgreSQL, логов и backups             |

---

## Генерация Ed25519 ключей

Ключи используются для подписи и проверки лицензий. **Приватный ключ** должен быть доступен только backend-серверу. **Публичный ключ** распространяется на QMS-инстансы для offline-проверки.

```bash
# Установить CLI (если ещё не установлен)
cd asvo-license-service
npm install --workspace=cli

# Сгенерировать ключи
npx als-cli keygen --output ./keys/

# Проверить, что ключи созданы
ls -la ./keys/
# private.key  -- СЕКРЕТНЫЙ, только для ALS backend
# public.key   -- распространяется на QMS-инстансы
```

> **ВНИМАНИЕ:** Никогда не коммитьте `private.key` в git. Директория `keys/` уже добавлена в `.gitignore`.

> **ВАЖНО:** При потере приватного ключа все ранее выданные лицензии станут невозможными для обновления. Сохраните backup ключей в безопасном месте.

---

## Конфигурация окружения

Создайте файл `.env` на основе `.env.example` и настройте все переменные для production:

```bash
cp .env.example .env
```

### Обязательные переменные

```env
# ====== Database ======
# Используйте сложный пароль, отличный от дефолтного
DATABASE_URL=postgresql://als:YOUR_STRONG_PASSWORD@postgres:5432/als

# ====== Redis ======
REDIS_URL=redis://redis:6379

# ====== Ed25519 Keys ======
# Пути внутри контейнера (volume mount)
ED25519_PRIVATE_KEY_PATH=/keys/private.key
ED25519_PUBLIC_KEY_PATH=/keys/public.key

# ====== JWT ======
# Сгенерируйте случайную строку: openssl rand -hex 32
JWT_SECRET=<random-64-char-hex-string>

# ====== Server ======
PORT=4000
NODE_ENV=production

# ====== Admin Auth ======
# Сгенерируйте уникальный токен: openssl rand -hex 32
ADMIN_TOKEN=<random-64-char-hex-string>
```

### Биллинг (ЮKassa)

```env
# ID магазина из личного кабинета ЮKassa
YUKASSA_SHOP_ID=123456

# Секретный ключ для API ЮKassa
YUKASSA_SECRET_KEY=live_xxxxxxxxxxxxx
```

Если `YUKASSA_SHOP_ID` не задан, используется mock-режим (для тестирования).

### Email (SMTP)

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@asvo.tech
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@asvo.tech
```

Если `SMTP_HOST` пустой, письма логируются в консоль (не отправляются).

### Telegram-уведомления

```env
# Создайте бота через @BotFather и получите token
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlmNoPqRsTuVwXyZ

# Chat ID администратора (можно узнать через @userinfobot)
TELEGRAM_ADMIN_CHAT_ID=-100123456789
```

Если не задано, уведомления логируются в консоль.

---

## Запуск через Docker Compose

### Production docker-compose.yml

Стандартный `docker-compose.yml` из репозитория готов к production-использованию. Обновите переменные окружения:

```yaml
# docker-compose.yml -- production overrides
services:
  als-api:
    environment:
      DATABASE_URL: postgresql://als:YOUR_STRONG_PASSWORD@postgres:5432/als
      JWT_SECRET: <your-jwt-secret>
      ADMIN_TOKEN: <your-admin-token>
      YUKASSA_SHOP_ID: <your-shop-id>
      YUKASSA_SECRET_KEY: <your-secret-key>
      SMTP_HOST: smtp.yandex.ru
      SMTP_PORT: "465"
      SMTP_USER: noreply@asvo.tech
      SMTP_PASS: <your-smtp-password>
      SMTP_FROM: noreply@asvo.tech
      TELEGRAM_BOT_TOKEN: <your-bot-token>
      TELEGRAM_ADMIN_CHAT_ID: <your-chat-id>
      NODE_ENV: production
    restart: always

  postgres:
    environment:
      POSTGRES_PASSWORD: YOUR_STRONG_PASSWORD
    restart: always

  redis:
    restart: always
```

### Запуск

```bash
# Собрать и запустить в фоне
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f als-api

# Остановить
docker-compose down
```

### Проверка работоспособности

```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"2025-01-15T12:00:00.000Z"}
```

---

## Миграция базы данных

Prisma-миграции выполняются автоматически при старте backend-контейнера через Dockerfile entrypoint:

```dockerfile
# В backend/Dockerfile
CMD npx prisma migrate deploy && node dist/index.js
```

Для ручного запуска миграций:

```bash
# Войти в контейнер
docker-compose exec als-api sh

# Выполнить миграции
npx prisma migrate deploy

# Seed (опционально, для начальных данных)
npx prisma db seed
```

---

## SSL и reverse proxy

В production **обязательно** использование SSL. Рекомендуется развернуть reverse proxy перед ALS.

### Nginx + Let's Encrypt (рекомендуемый вариант)

Пример конфигурации nginx:

```nginx
# /etc/nginx/sites-available/als.conf

# API Backend
server {
    listen 443 ssl http2;
    server_name als.asvo.tech;

    ssl_certificate /etc/letsencrypt/live/als.asvo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/als.asvo.tech/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin-панель
server {
    listen 443 ssl http2;
    server_name manage.asvo.tech;

    ssl_certificate /etc/letsencrypt/live/manage.asvo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manage.asvo.tech/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Портал клиента
server {
    listen 443 ssl http2;
    server_name my.asvo.tech;

    ssl_certificate /etc/letsencrypt/live/my.asvo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/my.asvo.tech/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name als.asvo.tech manage.asvo.tech my.asvo.tech;
    return 301 https://$host$request_uri;
}
```

### Получение сертификатов Let's Encrypt

```bash
# Установить certbot
apt install certbot python3-certbot-nginx

# Получить сертификаты
certbot --nginx -d als.asvo.tech -d manage.asvo.tech -d my.asvo.tech

# Автоматическое обновление (cron)
certbot renew --dry-run
```

### Альтернатива: Traefik

Traefik можно добавить в docker-compose как дополнительный сервис с автоматическим получением Let's Encrypt сертификатов.

---

## Мониторинг

### Health endpoint

```bash
# Простая проверка (для Uptime Robot, Healthchecks.io и т.д.)
curl -f http://localhost:4000/health || echo "ALS is down!"
```

### Логирование

ALS использует **Pino** (JSON-формат в production). Для агрегации логов:

```bash
# Просмотр логов в реальном времени
docker-compose logs -f als-api

# Экспорт логов в файл
docker-compose logs als-api > /var/log/als/api.log

# Ротация логов (logrotate)
/var/log/als/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

Рекомендуется подключить Loki + Grafana или ELK для централизованного сбора логов.

### Мониторинг PostgreSQL

```bash
# Количество соединений
docker-compose exec postgres psql -U als -c "SELECT count(*) FROM pg_stat_activity;"

# Размер базы данных
docker-compose exec postgres psql -U als -c "SELECT pg_size_pretty(pg_database_size('als'));"
```

### Мониторинг Redis

```bash
docker-compose exec redis redis-cli info memory
docker-compose exec redis redis-cli info clients
```

---

## Резервное копирование

### PostgreSQL

```bash
# Полный backup
docker-compose exec postgres pg_dump -U als -Fc als > /backups/als_$(date +%Y%m%d_%H%M%S).dump

# Восстановление
docker-compose exec -T postgres pg_restore -U als -d als --clean < /backups/als_20250115_120000.dump
```

### Автоматический backup (cron)

```bash
# crontab -e
# Ежедневно в 3:00
0 3 * * * docker-compose -f /path/to/docker-compose.yml exec -T postgres pg_dump -U als -Fc als > /backups/als_$(date +\%Y\%m\%d).dump 2>/dev/null

# Удаление backup'ов старше 30 дней
0 4 * * * find /backups -name "als_*.dump" -mtime +30 -delete
```

### Ed25519 ключи

```bash
# Копия ключей в безопасное место
cp ./keys/private.key /secure-backup/als-private.key
cp ./keys/public.key /secure-backup/als-public.key
```

> **КРИТИЧЕСКИ ВАЖНО:** Потеря приватного ключа означает невозможность подписывать новые лицензии и продлевать существующие.

---

## Чеклист безопасности

Перед выходом в production убедитесь, что все пункты выполнены:

### Аутентификация и секреты

- [ ] `JWT_SECRET` заменён на случайную строку (`openssl rand -hex 32`)
- [ ] `ADMIN_TOKEN` заменён на уникальный токен (`openssl rand -hex 32`)
- [ ] Пароль PostgreSQL (`POSTGRES_PASSWORD`) заменён на сложный
- [ ] `private.key` не доступен извне и не в git
- [ ] `public.key` распространён на все QMS-инстансы

### Сеть

- [ ] CORS настроен для конкретных доменов (замените `origin: '*'` в production)
- [ ] SSL/TLS включён для всех доменов (als, manage, my)
- [ ] Порты PostgreSQL (5433) и Redis (6380) **не открыты** во внешнюю сеть
- [ ] Rate limiting настроен (по умолчанию: 100 req/min per IP)

### Биллинг и уведомления

- [ ] ЮKassa credentials настроены (live-ключи, не тестовые)
- [ ] Webhook URL зарегистрирован в личном кабинете ЮKassa: `https://als.asvo.tech/api/v1/payments/yukassa-webhook`
- [ ] SMTP настроен и тестовое письмо отправлено
- [ ] Telegram bot настроен и тестовое уведомление получено

### Инфраструктура

- [ ] Автоматические backup'ы PostgreSQL настроены
- [ ] Health check мониторинг настроен
- [ ] Логирование настроено (Pino JSON, агрегация)
- [ ] `NODE_ENV=production` установлен
- [ ] Docker-контейнеры имеют `restart: always`
- [ ] Backup Ed25519 ключей сохранён в безопасном месте

### Доступы

- [ ] Admin-панель (`manage.asvo.tech`) доступна только по VPN или IP whitelist
- [ ] Портал клиента (`my.asvo.tech`) доступен публично
- [ ] API (`als.asvo.tech`) доступен для QMS-инстансов (heartbeat)

# QMS

ASVO-QMS — система менеджмента качества для ISO 13485 (медицинские изделия), ООО «АСВОТЕХ».

## Структура

- `QMS-Client-main/` — Frontend (React/TypeScript, Vite)
- `QMS-Server-master/` — Backend (Node.js, Express, Sequelize, PostgreSQL)
- `QMS-Mobile/` — PWA мобильное приложение
- `docs/` — Документация СМК

## Быстрый старт

```bash
# 1. Скопировать .env.example и заполнить секреты
cp QMS-Server-master/.env.example QMS-Server-master/.env
# Заполнить DB_PASSWORD и SECRET_KEY в .env

# 2. Запустить БД
cd QMS-Server-master && docker compose up -d

# 3. Запустить сервер
npm install && npm start

# 4. Запустить клиент
cd ../QMS-Client-main && npm install && npm run dev
```

## Управление секретами

**Все секреты хранятся ТОЛЬКО в `.env` файлах, которые НЕ коммитятся в git.**

| Переменная | Описание | Где используется |
|---|---|---|
| `DB_PASSWORD` | Пароль PostgreSQL | Server `.env`, `docker-compose.yml` |
| `SECRET_KEY` | JWT-секрет для подписи токенов | Server `.env` |

Шаблон: `QMS-Server-master/.env.example`

**Никогда не коммитьте `.env` файлы с реальными значениями в репозиторий.**

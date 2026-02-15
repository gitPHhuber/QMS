# MOCK_AUDIT_RESULTS.md — Фаза 0 Разведка

Дата: 2026-02-13
Обновлено: 2026-02-13 (финальный отчёт после завершения всех задач)

---

## Страницы УЖЕ на API (не трогать)

- [x] RisksPage — `risksApi.getMatrix()`, `risksApi.getAll()` — matrixCounts загружается из API
- [x] AuditsPage — `internalAuditsApi`
- [x] ChangeControlPage — `changeRequestsApi`
- [x] ComplaintsPage — `complaintsApi`
- [x] EquipmentPage — `equipmentApi`
- [x] ProductRegistryPage — `productsApi`
- [x] SuppliersPage — `suppliersApi`
- [x] TrainingPage — `trainingApi`
- [x] ValidationPage — `validationsApi`
- [x] ReviewPage — `reviewsApi`
- [x] RiskManagementPage — `riskManagementApi`
- [x] DocumentsPage — `documentsApi`
- [x] NotificationBell — `notificationsApi` (getAll, getCount, markRead, markAllRead)

## Страницы с моками (production)

**НЕТ** — все production-страницы подключены к реальным API-сервисам.

---

## Кнопки без обработчиков — РЕШЕНО (SW-003, `d94df470`)

~~Изначально все 22 кнопки были `disabled` с tooltip "Будет доступно в следующем спринте".~~

**Обновлено 2026-02-14:** Все 22 кнопки полностью функциональны — подключены к Create-модалкам и Export через `useExport` хук + backend `/api/export/*`.

### AuditsPage — `CreateAuditModal` + `useExport`
- [x] «Новый аудит» — работает (CreateAuditModal)
- [x] «Экспорт» — работает (useExport → /api/export/audits)

### ChangeControlPage — `CreateChangeModal` + `useExport`
- [x] «Новый ECR» — работает (CreateChangeModal)
- [x] «Экспорт» — работает (useExport → /api/export/changes)

### ComplaintsPage — `CreateComplaintModal` + `useExport`
- [x] «Новая рекламация» — работает (CreateComplaintModal)
- [x] «Экспорт» — работает (useExport → /api/export/complaints)

### EquipmentPage — `CreateEquipmentModal` + `useExport`
- [x] «Добавить оборудование» — работает (CreateEquipmentModal)
- [x] «График калибровки» — работает (showCalibrationSchedule toggle)
- [x] «Экспорт» — работает (useExport → /api/export/equipment)

### ProductRegistryPage — `CreateProductModal` + `useExport`
- [x] «Новое изделие» — работает (CreateProductModal)
- [x] «Экспорт» — работает (useExport → /api/export/products)

### SuppliersPage — `CreateSupplierModal` + `useExport`
- [x] «Новый поставщик» — работает (CreateSupplierModal)
- [x] «Экспорт» — работает (useExport → /api/export/suppliers)

### TrainingPage — `CreateTrainingModal` + `useExport`
- [x] «Назначить обучение» — работает (CreateTrainingModal)
- [x] «Экспорт» — работает (useExport → /api/export/training)

### ValidationPage — `CreateValidationModal` + `useExport`
- [x] «Новая валидация» — работает (CreateValidationModal)
- [x] «Экспорт» — работает (useExport → /api/export/validation)

### ReviewPage — `CreateReviewModal` + `useExport`
- [x] «Новое совещание» — работает (CreateReviewModal)
- [x] «Протокол» — работает (useExport → /api/export/reviews)

### RisksPage — `CreateRiskModal` + `useExport`
- [x] «Новый риск» — работает (CreateRiskModal)
- [x] «Экспорт» — работает (useExport → /api/export/risks)

### RiskManagementPage — `CreatePlanModal` + inline export
- [x] «Новый план/Новая опасность» — работает (CreatePlanModal)
- [x] «Отчёт ISO 14971» — работает (/api/risk-management/export/report)

**Итого: 22/22 кнопок функциональны** (12 «Экспорт», 8 «Создать/Новый», 2 специальных)

---

## DMS — текущее состояние

| Фича | Frontend | Backend | Статус |
|------|----------|---------|--------|
| Создание документа | ✓ Modal | ✓ API | Работает |
| Список/фильтрация | ✓ Page + tabs | ✓ API | Работает |
| Просмотр деталей | ✓ Modal | ✓ API | Работает |
| Загрузка файла | ✓ FormData, drag-and-drop, валидация типов, 50MB, прогресс | ✓ API | Работает (DMS-001a) |
| Отправка на согласование | ✓ Workflow UI: Draft→Review→Approved→Effective | ✓ API | Работает (DMS-001b/d) |
| Согласование/отклонение | ✓ Inline кнопки | ✓ API | Работает |
| Ввод в действие | ✓ Кнопка | ✓ API | Работает |
| Новая версия | ✓ Кнопка | ✓ API | Работает |
| Скачивание файла | ✓ Download + iframe viewer (PDF) | ✓ Static serve | Работает (DMS-001b) |
| Рассылка | ✓ Distribution + acknowledgment tracking | ✓ API | Работает (DMS-001d) |
| Deep-link /documents/:id | ✓ Route в routes.ts, modal по URL param | ✓ API | Работает (DMS-001c) |
| Статистика и KPI | ✓ Dashboard | ✓ API | Работает |

---

## NotificationBell — статус

**Полностью на реальном API**. Мок-данные отсутствуют.
- `notificationsApi.getAll()` — пагинация уведомлений
- `notificationsApi.getCount()` — количество непрочитанных (polling 30сек)
- `notificationsApi.markRead(id)` — отметка прочитанным
- `notificationsApi.markAllRead()` — массовая отметка
- Backend: 16 типов уведомлений, severity (INFO/WARNING/CRITICAL), entityType/entityId

---

## Секреты в репо — РЕШЕНО (SEC-001, `154048a8`)

Все захардкоженные секреты удалены:
- `.env` удалён из отслеживания, добавлен в `.gitignore`
- `.env.example` создан как шаблон (без реальных значений)
- `config/config.js` — fallback `'qms_dev_2026'` удалён, используется `process.env` без fallback
- `db.js` — fallback `'qms_dev_2026'` удалён
- `docker-compose.yml` — `POSTGRES_PASSWORD` берётся из `${DB_PASSWORD}` env var

**Внимание:** секреты остаются в истории git. Рекомендуется очистка через BFG Repo-Cleaner или `git filter-branch`.

---

## Audit Logger — РЕШЕНО (AUDIT-001, `df5e67bb`)

- `auditLogger.js` — единый модуль с hash-chain, экспорты: `logAudit`, `computeDataHash`, `computeChainHash`, `GENESIS_HASH`, `AUDIT_ACTIONS`, `AUDIT_ENTITIES`
- `hashChainLogger.js` — **удалён**
- `auditVerifier.js` — импорт обновлён на `./auditLogger`
- Все 23 файла импортируют из `auditLogger`

---

## .docx документы — статус

- **СТО-7.5.3** (DOC-001, `60b88568`): Раздел 2 исправлен — корректный текст о входном/операционном/выходном контроле
- **СТО-7.5.2** (DOC-002, `94ab4637`): Разделы 2.1/2.2 исправлены — корректный текст о разработке ПО МИ и ГОСТ IEC 62304

### DOC-003: Скан плейсхолдеров (только отчёт, `a3ac41c4`)

Найдены в 2 файлах (`docs/qms/`), только в листах согласования — это штатные поля шаблона документа:

| Файл | Строка | Плейсхолдер | Комментарий |
|------|--------|-------------|-------------|
| СТО-7.5.2 | 11 | `____________________` | Дата введения |
| СТО-7.5.2 | 161 | `ФИО` | Заголовок таблицы согласования |
| СТО-7.5.2 | 163-166 | `_______________ ФИО`, `«___» __________ 202_г.` | 4 строки подписей (Разработал/Проверил/Утвердил/ПРК) |
| СТО-7.5.3 | 11 | `____________________` | Дата введения |
| СТО-7.5.3 | 143 | `ФИО` | Заголовок таблицы согласования |
| СТО-7.5.3 | 145-148 | `_______________ ФИО`, `«___» __________ 202_г.` | 4 строки подписей (Разработал/Проверил/Утвердил/ПРК) |

**Вердикт:** стандартные поля шаблона, заполняются при утверждении документа. Не являются дефектом.

---

## Итоговая таблица выполнения

| ID | Описание | Статус | Коммит |
|----|----------|--------|--------|
| DOC-001 | Раздел 2 в СТО-7.5.3 — исправлен текст | DONE | `60b88568` |
| DOC-002 | Разделы 2.1/2.2 в СТО-7.5.2 — исправлен текст | DONE | `94ab4637` |
| DOC-003 | Скан плейсхолдеров (отчёт) | DONE | `a3ac41c4` |
| SEC-001 | Удаление захардкоженных секретов | DONE | `154048a8` |
| AUDIT-001 | Унификация auditLogger + hashChainLogger | DONE | `df5e67bb` |
| DMS-001a | Загрузка файла в CreateDocumentModal | DONE | `4c6f348c` |
| DMS-001b/d | Просмотр, скачивание, workflow UI | DONE | `304247f2` |
| DMS-001c | Deep-link /qms/documents/:id | DONE | `3ad81ef7` |
| SW-001 | RisksPage matrixCounts → risksApi.getMatrix() | DONE | `a8959720` |
| SW-002 | NotificationBell навигация по клику | DONE | `b676e296` |
| SW-003 | 22 кнопки → disabled + tooltip | DONE | `d94df470` |

# MOCK_AUDIT_RESULTS.md — Фаза 0 Разведка

Дата: 2026-02-13

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

## Кнопки без обработчиков (onClick отсутствует)

### AuditsPage (`src/pages/Quality/AuditsPage.tsx`)
- [ ] Строка 361: «Новый аудит» — ActionBtn, API: internalAuditsApi ✓
- [ ] Строка 362: «Экспорт» — ActionBtn, API: internalAuditsApi ✓

### ChangeControlPage (`src/pages/Quality/ChangeControlPage.tsx`)
- [ ] Строка 306: «Новый ECR» — ActionBtn, API: changeRequestsApi ✓
- [ ] Строка 307: «Экспорт» — ActionBtn, API: changeRequestsApi ✓

### ComplaintsPage (`src/pages/Quality/ComplaintsPage.tsx`)
- [ ] Строка 334: «Новая рекламация» — ActionBtn, API: complaintsApi ✓
- [ ] Строка 335: «Экспорт» — ActionBtn, API: complaintsApi ✓

### EquipmentPage (`src/pages/Quality/EquipmentPage.tsx`)
- [ ] Строка 266: «Добавить оборудование» — ActionBtn, API: equipmentApi ✓
- [ ] Строка 269: «График калибровки» — ActionBtn, API: equipmentApi ✓
- [ ] Строка 272: «Экспорт» — ActionBtn, API: equipmentApi ✓

### ProductRegistryPage (`src/pages/Quality/ProductRegistryPage.tsx`)
- [ ] Строка 227: «Новое изделие» — ActionBtn, API: productsApi ✓
- [ ] Строка 230: «Экспорт» — ActionBtn, API: productsApi ✓

### SuppliersPage (`src/pages/Quality/SuppliersPage.tsx`)
- [ ] Строка 218: «Новый поставщик» — ActionBtn, API: suppliersApi ✓

### TrainingPage (`src/pages/Quality/TrainingPage.tsx`)
- [ ] Строка 201: «Назначить обучение» — ActionBtn, API: trainingApi ✓
- [ ] Строка 210: «Экспорт» — ActionBtn, API: trainingApi ✓

### ValidationPage (`src/pages/Quality/ValidationPage.tsx`)
- [ ] Строка 243: «Новая валидация» — ActionBtn, API: validationsApi ✓
- [ ] Строка 244: «Экспорт» — ActionBtn, API: validationsApi ✓

### ReviewPage (`src/pages/Quality/ReviewPage.tsx`)
- [ ] Строка 355: «Новое совещание» — ActionBtn, API: reviewsApi ✓
- [ ] Строка 358: «Протокол» — ActionBtn, API: reviewsApi ✓

### RisksPage (`src/pages/Quality/RisksPage.tsx`)
- [ ] Строка 170: «Новый риск» — ActionBtn, API: risksApi ✓
- [ ] Строка 174: «Экспорт» — ActionBtn, API: risksApi ✓

### RiskManagementPage (`src/pages/Quality/risk-management/RiskManagementPage.tsx`)
- [ ] Строка 125: «Новый план/Новая опасность» — ActionBtn, API: riskManagementApi ✓
- [ ] Строка 131: «Отчёт ISO 14971» — ActionBtn, API: riskManagementApi ✓

**Итого: 22 кнопки без обработчиков** (12 «Экспорт», 8 «Создать/Новый», 2 специальных)

---

## DMS — текущее состояние

| Фича | Frontend | Backend | Статус |
|------|----------|---------|--------|
| Создание документа | ✓ Modal | ✓ API | Работает |
| Список/фильтрация | ✓ Page + tabs | ✓ API | Работает |
| Просмотр деталей | ✓ Modal | ✓ API | Работает |
| **Загрузка файла** | ❌ Нет UI | ✓ API | **Блокер** |
| **Отправка на согласование** | ❌ Нет UI | ✓ API | **Блокер** |
| Согласование/отклонение | ✓ Inline кнопки | ✓ API | Работает |
| Ввод в действие | ✓ Кнопка | ✓ API | Работает |
| Новая версия | ✓ Кнопка | ✓ API | Работает |
| **Скачивание файла** | ❌ Нет кнопки | ✓ Static serve | **Блокер** |
| **Рассылка** | ❌ Нет UI | ✓ API | **Блокер** |
| **Deep-link /documents/:id** | ❌ Нет URL params | ✓ API | **Отсутствует** |
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

## Секреты в репо (КРИТИЧНО)

| Файл | Строка | Секрет | Severity |
|------|--------|--------|----------|
| QMS-Server-master/.env | 6 | DB_PASSWORD=qms_dev_2026 | CRITICAL |
| QMS-Server-master/.env | 16 | SECRET_KEY=qms_jwt_secret_dev_2026 | CRITICAL |
| QMS-Server-master/docker-compose.yml | 8 | POSTGRES_PASSWORD: qms_dev_2026 | HIGH |
| QMS-Server-master/config/config.js | 5 | Fallback: 'qms_dev_2026' | HIGH |
| QMS-Server-master/db.js | 7 | Fallback: 'qms_dev_2026' | HIGH |

**`.env` НЕ в `.gitignore`** — отслеживается в git!
**Taiga-файлов не найдено.**

---

## Audit Logger — текущее состояние

- `auditLogger.js` — содержит полную реализацию с hash-chain (уже обновлён)
- `hashChainLogger.js` — дублирует auditLogger.js (отдельная версия с ext transaction support)
- `auditVerifier.js` — импортирует из `hashChainLogger`
- 21 файл импортируют из `auditLogger`, 2 файла из `hashChainLogger`
- Нужно: объединить в один файл, обновить все импорты

---

## .docx документы — статус

- **СТО-7.5.3** (DOC-001): Раздел 2 **УЖЕ ИСПРАВЛЕН** — содержит корректный текст
- **СТО-7.5.2** (DOC-002): Разделы 2.1 и 2.2 **УЖЕ ИСПРАВЛЕНЫ** — содержат корректный текст
- Плейсхолдеры (ФИО, ___, 202_г.) найдены в листах согласования обоих документов

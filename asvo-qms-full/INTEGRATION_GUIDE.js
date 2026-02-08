/**
 * INTEGRATION_GUIDE.js — Инструкция по интеграции новых модулей
 * 
 * Этот файл НЕ запускается. Это пошаговое руководство по подключению
 * hash-chain audit и DMS к существующему коду Kryptonit.
 * 
 * ═══════════════════════════════════════════════════════════════
 * ПОРЯДОК ДЕЙСТВИЙ
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. Скопируй файлы в проект (пути ниже)
 * 2. Обнови models/index.js (добавь импорты и associations)
 * 3. Обнови routes/index.js (добавь documentRouter)
 * 4. Добавь новые abilities в initInitialData (index.js)
 * 5. Запусти миграции
 * 6. Запусти backfill-audit-hashes.js
 * 7. Проверь
 * 
 * ═══════════════════════════════════════════════════════════════
 * ШАГ 1: СКОПИРУЙ ФАЙЛЫ
 * ═══════════════════════════════════════════════════════════════
 * 
 * ЗАМЕНЯЕМЫЕ файлы (бэкапь оригиналы):
 *   models/definitions/General.js    ← General.js        (добавлены hash-chain поля в AuditLog)
 *   utils/auditLogger.js             ← hashChainLogger.js (полная замена, обратно совместим)
 *   controllers/auditController.js   ← auditController.js (расширен endpoints)
 *   routes/auditRouter.js            ← auditRouter.js     (новые routes)
 * 
 * НОВЫЕ файлы:
 *   utils/auditVerifier.js           — Верификация hash-chain
 *   models/definitions/Document.js   — Модели DMS
 *   services/DocumentService.js      — Бизнес-логика DMS
 *   controllers/documentController.js — REST API DMS
 *   routes/documentRouter.js         — Роуты DMS
 *   migrations/20260210-audit-hashchain.js  — Миграция audit
 *   migrations/20260210-create-dms.js       — Миграция DMS
 *   scripts/backfill-audit-hashes.js        — Пересчёт хешей
 */

// ═══════════════════════════════════════════════════════════════
// ШАГ 2: ОБНОВИТЬ models/index.js
// ═══════════════════════════════════════════════════════════════

// Добавить после строки: const { Project } = require("./definitions/Project");

// --- НАЧАЛО ВСТАВКИ ---
/*
const {
    Document,
    DocumentVersion,
    DocumentApproval,
    DocumentDistribution,
    setupDocumentAssociations,
    DOCUMENT_TYPES,
    DOCUMENT_STATUSES,
    VERSION_STATUSES,
    APPROVAL_ROLES,
    APPROVAL_DECISIONS,
} = require("./definitions/Document");
*/
// --- КОНЕЦ ВСТАВКИ ---

// Добавить ПЕРЕД строкой module.exports:

// --- НАЧАЛО ВСТАВКИ ---
/*
// DMS Associations
setupDocumentAssociations({ User });
*/
// --- КОНЕЦ ВСТАВКИ ---

// Добавить в module.exports:

// --- НАЧАЛО ВСТАВКИ ---
/*
  // DMS
  Document,
  DocumentVersion,
  DocumentApproval,
  DocumentDistribution,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  VERSION_STATUSES,
  APPROVAL_ROLES,
  APPROVAL_DECISIONS,
*/
// --- КОНЕЦ ВСТАВКИ ---


// ═══════════════════════════════════════════════════════════════
// ШАГ 3: ОБНОВИТЬ routes/index.js
// ═══════════════════════════════════════════════════════════════

// Добавить после строки: const productionOutputRouter = require("./productionOutputRouter");

// --- НАЧАЛО ВСТАВКИ ---
/*
const documentRouter = require("./documentRouter");
*/
// --- КОНЕЦ ВСТАВКИ ---

// Добавить после строки: router.use("/production", productionOutputRouter);

// --- НАЧАЛО ВСТАВКИ ---
/*
// QMS: Document Management System
router.use("/documents", documentRouter);
*/
// --- КОНЕЦ ВСТАВКИ ---


// ═══════════════════════════════════════════════════════════════
// ШАГ 4: ДОБАВИТЬ ABILITIES (в index.js → initInitialData)
// ═══════════════════════════════════════════════════════════════

// Добавить в массив permissions:

const NEW_QMS_PERMISSIONS = [
  // DMS
  { code: "dms.view", description: "Просмотр реестра документов" },
  { code: "dms.create", description: "Создание и редактирование документов" },
  { code: "dms.approve", description: "Согласование документов" },
  { code: "dms.manage", description: "Введение в действие, рассылка документов" },

  // Audit
  { code: "qms.audit.view", description: "Просмотр расширенного аудит-лога" },
  { code: "qms.audit.verify", description: "Верификация целостности hash-chain" },
  { code: "qms.audit.report", description: "Генерация отчётов для инспекции" },
];

// Добавить в роли:

const NEW_QMS_ROLES = {
  QMS_MANAGER: "Уполномоченный по качеству (менеджер СМК)",
  QMS_AUDITOR: "Внутренний аудитор",
  DOC_CONTROLLER: "Контролёр документации",
};

// Маппинг ролей на abilities:

const QMS_ROLE_ABILITIES = {
  QMS_MANAGER: [
    "dms.view", "dms.create", "dms.approve", "dms.manage",
    "qms.audit.view", "qms.audit.verify", "qms.audit.report",
  ],
  QMS_AUDITOR: [
    "dms.view",
    "qms.audit.view", "qms.audit.verify", "qms.audit.report",
  ],
  DOC_CONTROLLER: [
    "dms.view", "dms.create", "dms.approve", "dms.manage",
  ],
  // Существующие роли — добавить dms.view:
  PRODUCTION_CHIEF: ["dms.view"],
  TECHNOLOGIST: ["dms.view", "dms.create"],
  QC_ENGINEER: ["dms.view", "dms.approve", "qms.audit.view"],
};


// ═══════════════════════════════════════════════════════════════
// ШАГ 5: ЗАПУСК МИГРАЦИЙ
// ═══════════════════════════════════════════════════════════════

/*
  # Из корня серверного проекта:
  
  # 1. Миграция audit hash-chain
  npx sequelize-cli db:migrate --name 20260210-audit-hashchain.js
  
  # 2. Миграция DMS
  npx sequelize-cli db:migrate --name 20260210-create-dms.js
  
  # Или если используешь свой runner:
  node run-migration.js
*/


// ═══════════════════════════════════════════════════════════════
// ШАГ 6: BACKFILL ХЕШЕЙ
// ═══════════════════════════════════════════════════════════════

/*
  # После миграции — пересчитать хеши для существующих записей:
  node scripts/backfill-audit-hashes.js
  
  # Вывод примерно:
  # ═══════════════════════════════════════════════
  #   ASVO-QMS: Backfill hash-chain для audit_logs
  # ═══════════════════════════════════════════════
  # Записей без hash-chain: 15234
  # Записей с hash-chain:   0
  # Начинаем backfill с chainIndex=1...
  #   [100%] 15234/15234 записей | 12.3s | 1238 записей/сек
  # ✅ Backfill завершён!
  # ✅ Верификация пройдена: 100/100 записей ОК
*/


// ═══════════════════════════════════════════════════════════════
// ШАГ 7: ПРОВЕРКА
// ═══════════════════════════════════════════════════════════════

/*
  # API проверки:
  
  # 1. Проверка audit hash-chain
  curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/audit/verify
  # Ожидание: {"valid": true, "totalRecords": ..., "validRecords": ..., "invalidRecords": 0}
  
  # 2. Создание документа
  curl -X POST -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Руководство по качеству","type":"MANUAL"}' \
    http://localhost:5000/api/documents/
  # Ожидание: {"document": {"code": "РК-СМК-001", ...}, "version": {"version": "1.0", ...}}
  
  # 3. Реестр документов
  curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/documents/
  
  # 4. Отчёт для инспекции
  curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/audit/report
*/

module.exports = { NEW_QMS_PERMISSIONS, NEW_QMS_ROLES, QMS_ROLE_ABILITIES };

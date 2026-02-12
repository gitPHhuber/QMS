/**
 * hashChainLogger.js — Иммутабельный аудит-трейл с hash-chain
 * 
 * ЗАМЕНА: utils/auditLogger.js
 * 
 * ISO 13485 §4.2.5: Записи должны быть защищены от несанкционированного
 * изменения, удаления и порчи. Hash-chain гарантирует целостность —
 * изменение любой записи ломает всю последующую цепочку.
 * 
 * Алгоритм:
 *   1. Вычисляем dataHash = SHA-256(userId + action + entity + entityId + description + metadata + timestamp)
 *   2. Получаем prevHash из последней записи в цепочке
 *   3. Вычисляем currentHash = SHA-256(chainIndex + prevHash + dataHash)
 *   4. Сохраняем запись атомарно (с блокировкой для chainIndex)
 * 
 * Genesis запись: prevHash = "0".repeat(64), chainIndex = 1
 * 
 * СОВМЕСТИМОСТЬ: Экспортирует те же функции что старый auditLogger.js,
 * плюс новые QMS-специфичные (logDocumentApproval, logNonconformity и т.д.)
 */

const crypto = require("crypto");
const { AuditLog } = require("../../../models/index");
const sequelize = require("../../../db");

// ═══════════════════════════════════════════════════════════════════
// ДЕЙСТВИЯ — расширенный набор (MES + QMS)
// ═══════════════════════════════════════════════════════════════════

const AUDIT_ACTIONS = {
  // ── Сессии (из MES) ──
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",
  SESSION_DELETE: "SESSION_DELETE",
  SESSION_AUTO_OFF: "SESSION_AUTO_OFF",
  SESSION_FORCE_OFF: "SESSION_FORCE_OFF",

  // ── Склад (из MES) ──
  WAREHOUSE_MOVE: "WAREHOUSE_MOVE",
  WAREHOUSE_MOVE_BATCH: "WAREHOUSE_MOVE_BATCH",
  BOX_CREATE: "BOX_CREATE",
  BOX_UPDATE: "BOX_UPDATE",
  BOX_DELETE: "BOX_DELETE",
  BOX_SPLIT: "BOX_SPLIT",
  BOX_MERGE: "BOX_MERGE",
  SUPPLY_CREATE: "SUPPLY_CREATE",
  SUPPLY_UPDATE: "SUPPLY_UPDATE",
  SUPPLY_RECEIVE: "SUPPLY_RECEIVE",

  // ── Компоненты (из MES) ──
  COMPONENT_CREATE: "COMPONENT_CREATE",
  COMPONENT_UPDATE: "COMPONENT_UPDATE",
  COMPONENT_DELETE: "COMPONENT_DELETE",
  COMPONENT_SYNC: "COMPONENT_SYNC",
  COMPONENT_REPLACE: "COMPONENT_REPLACE",
  COMPONENT_TRANSFER: "COMPONENT_TRANSFER",
  COMPONENT_BATCH_ADD: "COMPONENT_BATCH_ADD",

  // ── Производство (из MES) ──
  PRODUCTION_ENTRY_CREATE: "PRODUCTION_ENTRY_CREATE",
  PRODUCTION_ENTRY_UPDATE: "PRODUCTION_ENTRY_UPDATE",
  PRODUCTION_ENTRY_APPROVE: "PRODUCTION_ENTRY_APPROVE",
  PRODUCTION_ENTRY_REJECT: "PRODUCTION_ENTRY_REJECT",
  PRODUCTION_ENTRY_DELETE: "PRODUCTION_ENTRY_DELETE",
  PRODUCT_ASSEMBLE: "PRODUCT_ASSEMBLE",
  PRODUCT_QC_PASS: "PRODUCT_QC_PASS",
  PRODUCT_QC_FAIL: "PRODUCT_QC_FAIL",

  // ── Структура (из MES) ──
  SECTION_CREATE: "SECTION_CREATE",
  SECTION_UPDATE: "SECTION_UPDATE",
  SECTION_DELETE: "SECTION_DELETE",
  TEAM_CREATE: "TEAM_CREATE",
  TEAM_UPDATE: "TEAM_UPDATE",
  TEAM_DELETE: "TEAM_DELETE",

  // ── RBAC (из MES) ──
  ROLE_CREATE: "ROLE_CREATE",
  ROLE_UPDATE: "ROLE_UPDATE",
  ROLE_DELETE: "ROLE_DELETE",
  ABILITY_CREATE: "ABILITY_CREATE",
  ABILITY_DELETE: "ABILITY_DELETE",
  ROLE_ABILITY_GRANT: "ROLE_ABILITY_GRANT",
  ROLE_ABILITY_REVOKE: "ROLE_ABILITY_REVOKE",

  // ── Пользователи (из MES) ──
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",

  // ── Экспорт (из MES) ──
  EXPORT_PASSPORT: "EXPORT_PASSPORT",
  EXPORT_DEFECTS: "EXPORT_DEFECTS",
  EXPORT_REPORT: "EXPORT_REPORT",

  // ── Системные (из MES) ──
  SETTINGS_UPDATE: "SETTINGS_UPDATE",
  SYSTEM_EVENT: "SYSTEM_EVENT",

  // ═══ НОВЫЕ QMS ДЕЙСТВИЯ ═══

  // ── Документы (DMS) ──
  DOCUMENT_CREATE: "DOCUMENT_CREATE",
  DOCUMENT_UPDATE: "DOCUMENT_UPDATE",
  DOCUMENT_DELETE: "DOCUMENT_DELETE",
  DOCUMENT_VERSION_CREATE: "DOCUMENT_VERSION_CREATE",
  DOCUMENT_SUBMIT_REVIEW: "DOCUMENT_SUBMIT_REVIEW",
  DOCUMENT_APPROVE: "DOCUMENT_APPROVE",
  DOCUMENT_REJECT: "DOCUMENT_REJECT",
  DOCUMENT_MAKE_EFFECTIVE: "DOCUMENT_MAKE_EFFECTIVE",
  DOCUMENT_OBSOLETE: "DOCUMENT_OBSOLETE",
  DOCUMENT_DISTRIBUTE: "DOCUMENT_DISTRIBUTE",
  DOCUMENT_ACKNOWLEDGE: "DOCUMENT_ACKNOWLEDGE",

  // ── Несоответствия (NC) ──
  NC_CREATE: "NC_CREATE",
  NC_UPDATE: "NC_UPDATE",
  NC_INVESTIGATE: "NC_INVESTIGATE",
  NC_DISPOSITION: "NC_DISPOSITION",
  NC_CLOSE: "NC_CLOSE",
  NC_REOPEN: "NC_REOPEN",

  // ── CAPA ──
  CAPA_CREATE: "CAPA_CREATE",
  CAPA_UPDATE: "CAPA_UPDATE",
  CAPA_PLAN_APPROVE: "CAPA_PLAN_APPROVE",
  CAPA_IMPLEMENT: "CAPA_IMPLEMENT",
  CAPA_VERIFY: "CAPA_VERIFY",
  CAPA_CLOSE: "CAPA_CLOSE",
  CAPA_EFFECTIVENESS_CHECK: "CAPA_EFFECTIVENESS_CHECK",

  // ── Внутренние аудиты ──
  AUDIT_PLAN_CREATE: "AUDIT_PLAN_CREATE",
  AUDIT_CONDUCT: "AUDIT_CONDUCT",
  AUDIT_FINDING_CREATE: "AUDIT_FINDING_CREATE",
  AUDIT_REPORT_APPROVE: "AUDIT_REPORT_APPROVE",

  // ── Управление рисками ──
  RISK_CREATE: "RISK_CREATE",
  RISK_UPDATE: "RISK_UPDATE",
  RISK_ASSESS: "RISK_ASSESS",
  RISK_MITIGATE: "RISK_MITIGATE",

  // ── Поставщики ──
  SUPPLIER_CREATE: "SUPPLIER_CREATE",
  SUPPLIER_EVALUATE: "SUPPLIER_EVALUATE",
  SUPPLIER_APPROVE: "SUPPLIER_APPROVE",
  SUPPLIER_SUSPEND: "SUPPLIER_SUSPEND",

  // ── Обучение ──
  TRAINING_COMPLETE: "TRAINING_COMPLETE",
  COMPETENCY_ASSIGN: "COMPETENCY_ASSIGN",

  // ── Оборудование / Метрология ──
  EQUIPMENT_CALIBRATE: "EQUIPMENT_CALIBRATE",
  EQUIPMENT_OVERDUE: "EQUIPMENT_OVERDUE",

  // ── Анализ руководством ──
  MANAGEMENT_REVIEW_CREATE: "MANAGEMENT_REVIEW_CREATE",
  MANAGEMENT_REVIEW_CLOSE: "MANAGEMENT_REVIEW_CLOSE",

  // ── Рекламации ──
  COMPLAINT_CREATE: "COMPLAINT_CREATE",
  COMPLAINT_UPDATE: "COMPLAINT_UPDATE",
  COMPLAINT_INVESTIGATE: "COMPLAINT_INVESTIGATE",
  COMPLAINT_CLOSE: "COMPLAINT_CLOSE",
  COMPLAINT_REPORT_REGULATOR: "COMPLAINT_REPORT_REGULATOR",

  // ── Управление изменениями ──
  CHANGE_REQUEST_CREATE: "CHANGE_REQUEST_CREATE",
  CHANGE_REQUEST_UPDATE: "CHANGE_REQUEST_UPDATE",
  CHANGE_REQUEST_SUBMIT: "CHANGE_REQUEST_SUBMIT",
  CHANGE_REQUEST_APPROVE: "CHANGE_REQUEST_APPROVE",
  CHANGE_REQUEST_REJECT: "CHANGE_REQUEST_REJECT",
  CHANGE_REQUEST_VERIFY: "CHANGE_REQUEST_VERIFY",
  CHANGE_REQUEST_COMPLETE: "CHANGE_REQUEST_COMPLETE",

  // ── Валидация процессов ──
  VALIDATION_CREATE: "VALIDATION_CREATE",
  VALIDATION_UPDATE: "VALIDATION_UPDATE",
  VALIDATION_IQ_COMPLETE: "VALIDATION_IQ_COMPLETE",
  VALIDATION_OQ_COMPLETE: "VALIDATION_OQ_COMPLETE",
  VALIDATION_PQ_COMPLETE: "VALIDATION_PQ_COMPLETE",
  VALIDATION_APPROVE: "VALIDATION_APPROVE",

  // ── Реестр изделий ──
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_REGISTRATION_UPDATE: "PRODUCT_REGISTRATION_UPDATE",

  // ── Уведомления ──
  NOTIFICATION_SEND: "NOTIFICATION_SEND",
};

// ═══════════════════════════════════════════════════════════════════
// СУЩНОСТИ — расширенный набор
// ═══════════════════════════════════════════════════════════════════

const AUDIT_ENTITIES = {
  // Из MES
  SESSION: "SESSION",
  WAREHOUSE_MOVEMENT: "WarehouseMovement",
  INVENTORY_BOX: "InventoryBox",
  SUPPLY: "Supply",
  WAREHOUSE_DOCUMENT: "WarehouseDocument",
  COMPONENT_INVENTORY: "ComponentInventory",
  COMPONENT_HISTORY: "ComponentHistory",
  COMPONENT_CATALOG: "ComponentCatalog",
  PRODUCTION_ENTRY: "ProductionEntry",
  PRODUCTION_OUTPUT: "ProductionOutput",
  ASSEMBLED_PRODUCT: "AssembledProduct",
  SECTION: "Section",
  TEAM: "Team",
  ROLE: "Role",
  ABILITY: "Ability",
  ROLE_ABILITY: "RoleAbility",
  USER: "User",

  // Новые QMS
  DOCUMENT: "Document",
  DOCUMENT_VERSION: "DocumentVersion",
  DOCUMENT_APPROVAL: "DocumentApproval",
  NONCONFORMITY: "Nonconformity",
  CAPA: "Capa",
  CAPA_ACTION: "CapaAction",
  RISK: "Risk",
  RISK_ASSESSMENT: "RiskAssessment",
  SUPPLIER: "Supplier",
  SUPPLIER_EVALUATION: "SupplierEvaluation",
  INTERNAL_AUDIT: "InternalAudit",
  AUDIT_FINDING: "AuditFinding",
  TRAINING_RECORD: "TrainingRecord",
  EQUIPMENT: "Equipment",
  CALIBRATION: "CalibrationRecord",
  MANAGEMENT_REVIEW: "ManagementReview",
  COMPLAINT: "Complaint",
  CHANGE_REQUEST: "ChangeRequest",
  PROCESS_VALIDATION: "ProcessValidation",
  PRODUCT: "Product",
  NOTIFICATION: "Notification",
};

// ═══════════════════════════════════════════════════════════════════
// SEVERITY — автоопределение по типу действия
// ═══════════════════════════════════════════════════════════════════

const SEVERITY_MAP = {
  // CRITICAL — действия влияющие на качество продукции
  DOCUMENT_APPROVE: "CRITICAL",
  DOCUMENT_MAKE_EFFECTIVE: "CRITICAL",
  NC_CREATE: "CRITICAL",
  NC_DISPOSITION: "CRITICAL",
  CAPA_CLOSE: "CRITICAL",
  PRODUCT_QC_PASS: "CRITICAL",
  PRODUCT_QC_FAIL: "CRITICAL",
  SUPPLIER_APPROVE: "CRITICAL",
  SUPPLIER_SUSPEND: "CRITICAL",
  EQUIPMENT_OVERDUE: "CRITICAL",
  MANAGEMENT_REVIEW_CLOSE: "CRITICAL",

  // WARNING — действия требующие внимания
  DOCUMENT_REJECT: "WARNING",
  NC_REOPEN: "WARNING",
  PRODUCTION_ENTRY_REJECT: "WARNING",
  RISK_ASSESS: "WARNING",

  // SECURITY — доступ и права
  USER_ROLE_CHANGE: "SECURITY",
  ROLE_ABILITY_GRANT: "SECURITY",
  ROLE_ABILITY_REVOKE: "SECURITY",
  SESSION_FORCE_OFF: "SECURITY",
  ROLE_CREATE: "SECURITY",
  ROLE_DELETE: "SECURITY",
};

function getSeverity(action) {
  return SEVERITY_MAP[action] || "INFO";
}

// ═══════════════════════════════════════════════════════════════════
// HASH-CHAIN CORE
// ═══════════════════════════════════════════════════════════════════

const GENESIS_HASH = "0".repeat(64);

/**
 * Вычисляет SHA-256 хеш данных записи (без chain-полей).
 * Используется для детекции изменений в данных записи.
 */
function computeDataHash({ userId, action, entity, entityId, description, metadata, createdAt }) {
  const payload = JSON.stringify({
    userId: userId ?? null,
    action: action || "",
    entity: entity || "",
    entityId: entityId === undefined || entityId === null ? "" : String(entityId),
    description: description || "",
    metadata: metadata || {},
    createdAt: createdAt || new Date().toISOString(),
  });

  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Вычисляет SHA-256 хеш записи в цепочке.
 * currentHash = SHA-256(chainIndex + prevHash + dataHash)
 */
function computeChainHash(chainIndex, prevHash, dataHash) {
  const payload = `${chainIndex}:${prevHash}:${dataHash}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Получает последнюю запись в цепочке (с блокировкой для атомарности).
 * Возвращает { chainIndex, currentHash } или genesis-значения.
 */
async function getLastChainEntry(transaction) {
  const [results] = await sequelize.query(
    `SELECT "chainIndex", "currentHash" 
     FROM audit_logs 
     WHERE "chainIndex" IS NOT NULL 
     ORDER BY "chainIndex" DESC 
     LIMIT 1
     FOR UPDATE`,
    { transaction, type: sequelize.QueryTypes.SELECT }
  );

  if (results) {
    return {
      chainIndex: Number(results.chainIndex),
      currentHash: results.currentHash,
    };
  }

  return { chainIndex: 0, currentHash: GENESIS_HASH };
}

// ═══════════════════════════════════════════════════════════════════
// ОСНОВНАЯ ФУНКЦИЯ ЛОГИРОВАНИЯ
// ═══════════════════════════════════════════════════════════════════

/**
 * Записывает событие в аудит-лог с hash-chain защитой.
 * 
 * Полностью обратно совместима со старым logAudit():
 *   - Принимает те же параметры (req, userId, action, entity, entityId, description, metadata)
 *   - Добавляет hash-chain автоматически
 *   - Автоматически определяет severity
 * 
 * @param {Object} params
 * @param {Object}  [params.req]         - Express request (для IP, user)
 * @param {number}  [params.userId]      - ID пользователя (если нет req)
 * @param {string}   params.action       - Тип действия из AUDIT_ACTIONS
 * @param {string}  [params.entity]      - Тип сущности из AUDIT_ENTITIES
 * @param {*}       [params.entityId]    - ID сущности
 * @param {string}  [params.description] - Описание
 * @param {Object}  [params.metadata]    - Доп. данные (JSON)
 * @param {string}  [params.severity]    - Принудительный severity (иначе авто)
 * @returns {Promise<Object>} Созданная запись AuditLog
 */
async function logAudit({
  req,
  userId,
  action,
  entity,
  entityId,
  description,
  metadata,
  severity,
}) {
  if (!action) {
    console.warn("[HashChainLogger] Попытка логирования без указания action");
    return null;
  }

  // Транзакция обязательна — нужна атомарность chain-записи
  const transaction = await sequelize.transaction({
    isolationLevel: "SERIALIZABLE", // Предотвращаем race condition на chainIndex
  });

  try {
    // 1. Определяем userId
    let finalUserId = null;
    if (req && req.user && req.user.id) {
      finalUserId = req.user.id;
    } else if (userId) {
      finalUserId = userId;
    }

    // 2. Собираем metadata с IP/UA
    let meta = metadata || {};
    if (req) {
      const ipHeader = req.headers["x-forwarded-for"];
      const ip =
        (typeof ipHeader === "string" ? ipHeader.split(",")[0] : null) ||
        req.connection?.remoteAddress ||
        req.ip ||
        null;

      meta = {
        ...meta,
        ip,
        userAgent: req.headers["user-agent"] || null,
      };
    }

    // 3. Нормализуем entityId
    const normalizedEntityId =
      entityId === undefined || entityId === null ? null : String(entityId);

    // 4. Вычисляем dataHash
    const now = new Date();
    const dataHash = computeDataHash({
      userId: finalUserId,
      action,
      entity: entity || null,
      entityId: normalizedEntityId,
      description: description || null,
      metadata: Object.keys(meta).length > 0 ? meta : null,
      createdAt: now.toISOString(),
    });

    // 5. Получаем последнюю запись цепочки (с блокировкой)
    const lastEntry = await getLastChainEntry(transaction);
    const newChainIndex = lastEntry.chainIndex + 1;
    const prevHash = lastEntry.currentHash;

    // 6. Вычисляем currentHash
    const currentHash = computeChainHash(newChainIndex, prevHash, dataHash);

    // 7. Определяем severity
    const finalSeverity = severity || getSeverity(action);

    // 8. Создаём запись
    const record = await AuditLog.create(
      {
        userId: finalUserId,
        action,
        entity: entity || null,
        entityId: normalizedEntityId,
        description: description || null,
        metadata: Object.keys(meta).length > 0 ? meta : null,
        chainIndex: newChainIndex,
        prevHash,
        currentHash,
        dataHash,
        severity: finalSeverity,
        createdAt: now,
      },
      { transaction }
    );

    await transaction.commit();
    return record;
  } catch (error) {
    await transaction.rollback();
    console.error("[HashChainLogger] Ошибка записи в журнал аудита:", error);

    // Fallback: пишем без hash-chain чтобы не потерять событие
    try {
      return await AuditLog.create({
        userId:
          (req && req.user && req.user.id) || userId || null,
        action,
        entity: entity || null,
        entityId:
          entityId === undefined || entityId === null
            ? null
            : String(entityId),
        description: `[CHAIN_ERROR] ${description || ""}`,
        metadata: { ...(metadata || {}), chainError: error.message },
        severity: severity || getSeverity(action),
      });
    } catch (fallbackError) {
      console.error("[HashChainLogger] CRITICAL: Даже fallback-запись не удалась:", fallbackError);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// ХЕЛПЕРЫ — совместимые со старым API + новые QMS
// ═══════════════════════════════════════════════════════════════════

// ── Склад (из старого auditLogger) ──

async function logWarehouseMove(req, movement, metadata = {}) {
  return logAudit({
    req,
    action: AUDIT_ACTIONS.WAREHOUSE_MOVE,
    entity: AUDIT_ENTITIES.WAREHOUSE_MOVEMENT,
    entityId: movement.id,
    description: `Перемещение: ${movement.operation}, кол-во: ${movement.deltaQty || 0}`,
    metadata: {
      boxId: movement.boxId,
      operation: movement.operation,
      fromSectionId: movement.fromSectionId,
      toSectionId: movement.toSectionId,
      deltaQty: movement.deltaQty,
      ...metadata,
    },
  });
}

// ── Производство (из старого auditLogger) ──

async function logProductionEntry(req, entry, action, metadata = {}) {
  const actionMap = {
    create: AUDIT_ACTIONS.PRODUCTION_ENTRY_CREATE,
    approve: AUDIT_ACTIONS.PRODUCTION_ENTRY_APPROVE,
    reject: AUDIT_ACTIONS.PRODUCTION_ENTRY_REJECT,
    update: AUDIT_ACTIONS.PRODUCTION_ENTRY_UPDATE,
    delete: AUDIT_ACTIONS.PRODUCTION_ENTRY_DELETE,
  };

  return logAudit({
    req,
    action: actionMap[action] || AUDIT_ACTIONS.PRODUCTION_ENTRY_UPDATE,
    entity: AUDIT_ENTITIES.PRODUCTION_ENTRY,
    entityId: entry.id,
    description: `Производственная запись #${entry.id}: ${action}`,
    metadata: {
      entryId: entry.id,
      quantity: entry.quantity,
      productId: entry.productId,
      ...metadata,
    },
  });
}

// ── Компоненты (из старого auditLogger) ──

async function logComponentSync(req, serverId, result, metadata = {}) {
  return logAudit({
    req,
    action: AUDIT_ACTIONS.COMPONENT_SYNC,
    entity: AUDIT_ENTITIES.COMPONENT_INVENTORY,
    entityId: serverId,
    description: `Синхронизация компонентов #${serverId}`,
    metadata: {
      serverId,
      mode: result.mode,
      added: result.actions?.added?.length || 0,
      updated: result.actions?.updated?.length || 0,
      preserved: result.actions?.preserved?.length || 0,
      ...metadata,
    },
  });
}

// ── Экспорт (из старого auditLogger) ──

async function logExport(req, exportType, description, metadata = {}) {
  return logAudit({
    req,
    action: AUDIT_ACTIONS.EXPORT_REPORT,
    entity: null,
    entityId: null,
    description: description || `Экспорт: ${exportType}`,
    metadata: { exportType, ...metadata },
  });
}

// ═══════════════════════════════════════════════════════════════════
// НОВЫЕ QMS ХЕЛПЕРЫ
// ═══════════════════════════════════════════════════════════════════

// ── Документы (DMS) ──

async function logDocumentCreate(req, doc, metadata = {}) {
  return logAudit({
    req,
    action: AUDIT_ACTIONS.DOCUMENT_CREATE,
    entity: AUDIT_ENTITIES.DOCUMENT,
    entityId: doc.id,
    description: `Создан документ: ${doc.code} "${doc.title}"`,
    metadata: { code: doc.code, type: doc.type, ...metadata },
  });
}

async function logDocumentApproval(req, doc, version, decision, metadata = {}) {
  const action =
    decision === "APPROVED"
      ? AUDIT_ACTIONS.DOCUMENT_APPROVE
      : AUDIT_ACTIONS.DOCUMENT_REJECT;

  return logAudit({
    req,
    action,
    entity: AUDIT_ENTITIES.DOCUMENT_APPROVAL,
    entityId: doc.id,
    description: `Документ ${doc.code} v${version.version}: ${decision}`,
    metadata: {
      documentId: doc.id,
      versionId: version.id,
      versionNumber: version.version,
      decision,
      ...metadata,
    },
  });
}

async function logDocumentEffective(req, doc, version, metadata = {}) {
  return logAudit({
    req,
    action: AUDIT_ACTIONS.DOCUMENT_MAKE_EFFECTIVE,
    entity: AUDIT_ENTITIES.DOCUMENT,
    entityId: doc.id,
    description: `Документ ${doc.code} v${version.version} введён в действие`,
    metadata: {
      documentId: doc.id,
      versionId: version.id,
      ...metadata,
    },
  });
}

// ── Несоответствия ──

async function logNonconformity(req, nc, action, metadata = {}) {
  const actionMap = {
    create: AUDIT_ACTIONS.NC_CREATE,
    update: AUDIT_ACTIONS.NC_UPDATE,
    investigate: AUDIT_ACTIONS.NC_INVESTIGATE,
    disposition: AUDIT_ACTIONS.NC_DISPOSITION,
    close: AUDIT_ACTIONS.NC_CLOSE,
    reopen: AUDIT_ACTIONS.NC_REOPEN,
  };

  return logAudit({
    req,
    action: actionMap[action] || AUDIT_ACTIONS.NC_UPDATE,
    entity: AUDIT_ENTITIES.NONCONFORMITY,
    entityId: nc.id,
    description: `NC-${String(nc.id).padStart(4, "0")}: ${action}`,
    metadata: {
      ncNumber: nc.number,
      source: nc.source,
      classification: nc.classification,
      ...metadata,
    },
  });
}

// ── CAPA ──

async function logCapa(req, capa, action, metadata = {}) {
  const actionMap = {
    create: AUDIT_ACTIONS.CAPA_CREATE,
    update: AUDIT_ACTIONS.CAPA_UPDATE,
    planApprove: AUDIT_ACTIONS.CAPA_PLAN_APPROVE,
    implement: AUDIT_ACTIONS.CAPA_IMPLEMENT,
    verify: AUDIT_ACTIONS.CAPA_VERIFY,
    close: AUDIT_ACTIONS.CAPA_CLOSE,
    effectivenessCheck: AUDIT_ACTIONS.CAPA_EFFECTIVENESS_CHECK,
  };

  return logAudit({
    req,
    action: actionMap[action] || AUDIT_ACTIONS.CAPA_UPDATE,
    entity: AUDIT_ENTITIES.CAPA,
    entityId: capa.id,
    description: `CAPA-${String(capa.id).padStart(4, "0")}: ${action}`,
    metadata: {
      capaNumber: capa.number,
      type: capa.type,
      ...metadata,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// ЭКСПОРТ — полная обратная совместимость + новые функции
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Core
  logAudit,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  GENESIS_HASH,

  // Hash utilities (для верификатора)
  computeDataHash,
  computeChainHash,

  // MES-совместимые хелперы (старый API)
  logWarehouseMove,
  logComponentSync,
  logProductionEntry,
  logExport,

  // Новые QMS хелперы
  logDocumentCreate,
  logDocumentApproval,
  logDocumentEffective,
  logNonconformity,
  logCapa,

  // Утилиты
  getSeverity,
};

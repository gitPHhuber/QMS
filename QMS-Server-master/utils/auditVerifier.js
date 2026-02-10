/**
 * auditVerifier.js — Верификация целостности hash-chain аудит-трейла
 * 
 * НОВЫЙ ФАЙЛ: utils/auditVerifier.js
 * 
 * ISO 13485 §4.2.5: Организация должна демонстрировать, что записи
 * не были изменены. Этот модуль позволяет:
 *   1. Проверить целостность всей цепочки (полный аудит)
 *   2. Проверить конкретный диапазон записей
 *   3. Найти точки разрыва цепочки
 *   4. Генерировать отчёт для инспекции
 * 
 * Используется:
 *   - Автоматически: cron-задача раз в сутки
 *   - По запросу: API endpoint для уполномоченного по качеству
 *   - При аудите: полный отчёт для инспектора
 */

const { AuditLog } = require("../models/index");
const { computeDataHash, computeChainHash, GENESIS_HASH } = require("./hashChainLogger");
const { Op } = require("sequelize");

/**
 * Результат верификации одной записи
 * @typedef {Object} VerifyResult
 * @property {number} chainIndex
 * @property {number} recordId
 * @property {boolean} valid
 * @property {string[]} errors - Массив описаний ошибок
 */

/**
 * Результат полной верификации
 * @typedef {Object} ChainVerificationReport
 * @property {boolean} valid           - Вся цепочка валидна
 * @property {number}  totalRecords    - Всего записей проверено
 * @property {number}  validRecords    - Валидных записей
 * @property {number}  invalidRecords  - Невалидных записей
 * @property {number}  unchainedRecords - Записей без hash-chain (старые)
 * @property {number}  firstChainIndex - Первый chainIndex
 * @property {number}  lastChainIndex  - Последний chainIndex
 * @property {Array<VerifyResult>} errors - Детали ошибок
 * @property {string}  verifiedAt      - Время верификации
 * @property {number}  durationMs      - Длительность проверки
 */

/**
 * Полная верификация hash-chain.
 * Проходит по всем записям с chainIndex и проверяет:
 *   1. dataHash совпадает с пересчитанным
 *   2. currentHash совпадает с пересчитанным
 *   3. prevHash совпадает с currentHash предыдущей записи
 *   4. chainIndex строго последовательны (нет пропусков)
 * 
 * @param {Object} [options]
 * @param {number} [options.fromIndex] - Начать с этого chainIndex
 * @param {number} [options.toIndex]   - До этого chainIndex (включительно)
 * @param {number} [options.batchSize=1000] - Размер batch для чтения из БД
 * @returns {Promise<ChainVerificationReport>}
 */
async function verifyChain({ fromIndex, toIndex, batchSize = 1000 } = {}) {
  const startTime = Date.now();
  const errors = [];
  let totalRecords = 0;
  let validRecords = 0;
  let unchainedRecords = 0;
  let firstChainIndex = null;
  let lastChainIndex = null;

  // Считаем записи без hash-chain (старые)
  unchainedRecords = await AuditLog.count({
    where: { chainIndex: null },
  });

  // Строим where-условие
  const where = { chainIndex: { [Op.ne]: null } };
  if (fromIndex !== undefined) {
    where.chainIndex[Op.gte] = fromIndex;
  }
  if (toIndex !== undefined) {
    where.chainIndex[Op.lte] = toIndex;
  }

  // Читаем batch-ами
  let offset = 0;
  let prevHash = null; // будет вычислен из предыдущей записи или genesis
  let prevChainIndex = null;

  // Если начинаем не с начала — нужен prevHash от предыдущей записи
  if (fromIndex && fromIndex > 1) {
    const prevRecord = await AuditLog.findOne({
      where: { chainIndex: fromIndex - 1 },
      attributes: ["currentHash", "chainIndex"],
    });

    if (prevRecord) {
      prevHash = prevRecord.currentHash;
      prevChainIndex = Number(prevRecord.chainIndex);
    } else {
      // Нет предыдущей записи — не можем проверить linkage первой
      prevHash = null;
      prevChainIndex = fromIndex - 2; // будет пропуск
    }
  }

  while (true) {
    const records = await AuditLog.findAll({
      where,
      order: [["chainIndex", "ASC"]],
      limit: batchSize,
      offset,
      raw: true,
    });

    if (records.length === 0) break;

    for (const record of records) {
      totalRecords++;
      const ci = Number(record.chainIndex);

      if (firstChainIndex === null) firstChainIndex = ci;
      lastChainIndex = ci;

      const recordErrors = [];

      // 1. Проверяем непрерывность chainIndex
      if (prevChainIndex !== null && ci !== prevChainIndex + 1) {
        recordErrors.push(
          `Пропуск в цепочке: ожидался chainIndex=${prevChainIndex + 1}, получен ${ci}`
        );
      }

      // 2. Пересчитываем dataHash
      const expectedDataHash = computeDataHash({
        userId: record.userId,
        action: record.action,
        entity: record.entity,
        entityId: record.entityId,
        description: record.description,
        metadata: record.metadata,
        createdAt: record.createdAt,
      });

      if (record.dataHash !== expectedDataHash) {
        recordErrors.push(
          `dataHash не совпадает: stored=${record.dataHash?.substring(0, 12)}..., computed=${expectedDataHash.substring(0, 12)}...`
        );
      }

      // 3. Проверяем prevHash linkage
      if (prevHash !== null && record.prevHash !== prevHash) {
        recordErrors.push(
          `prevHash разрыв: stored=${record.prevHash?.substring(0, 12)}..., expected=${prevHash.substring(0, 12)}...`
        );
      } else if (prevHash === null && ci === 1 && record.prevHash !== GENESIS_HASH) {
        recordErrors.push(
          `Genesis запись должна иметь prevHash=${"0".repeat(12)}...`
        );
      }

      // 4. Пересчитываем currentHash
      const expectedCurrentHash = computeChainHash(
        ci,
        record.prevHash,
        record.dataHash
      );

      if (record.currentHash !== expectedCurrentHash) {
        recordErrors.push(
          `currentHash не совпадает: stored=${record.currentHash?.substring(0, 12)}..., computed=${expectedCurrentHash.substring(0, 12)}...`
        );
      }

      // Результат для этой записи
      if (recordErrors.length > 0) {
        errors.push({
          chainIndex: ci,
          recordId: record.id,
          valid: false,
          errors: recordErrors,
        });
      } else {
        validRecords++;
      }

      // Обновляем для следующей итерации
      prevHash = record.currentHash;
      prevChainIndex = ci;
    }

    offset += batchSize;
  }

  const durationMs = Date.now() - startTime;

  return {
    valid: errors.length === 0,
    totalRecords,
    validRecords,
    invalidRecords: errors.length,
    unchainedRecords,
    firstChainIndex,
    lastChainIndex,
    errors: errors.slice(0, 100), // Лимит на количество ошибок в отчёте
    verifiedAt: new Date().toISOString(),
    durationMs,
  };
}

/**
 * Быстрая проверка — только последние N записей.
 * Для cron-задачи (ежечасно/ежедневно).
 * 
 * @param {number} [count=100] - Количество последних записей для проверки
 * @returns {Promise<ChainVerificationReport>}
 */
async function quickVerify(count = 100) {
  const lastRecord = await AuditLog.findOne({
    where: { chainIndex: { [Op.ne]: null } },
    order: [["chainIndex", "DESC"]],
    attributes: ["chainIndex"],
    raw: true,
  });

  if (!lastRecord) {
    return {
      valid: true,
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      unchainedRecords: 0,
      firstChainIndex: null,
      lastChainIndex: null,
      errors: [],
      verifiedAt: new Date().toISOString(),
      durationMs: 0,
    };
  }

  const fromIndex = Math.max(1, Number(lastRecord.chainIndex) - count + 1);
  return verifyChain({ fromIndex });
}

/**
 * Генерирует отчёт для инспекции в формате, совместимом с ISO.
 * 
 * @returns {Promise<Object>} Отчёт с метаданными системы
 */
async function generateInspectionReport() {
  const fullReport = await verifyChain();

  // Статистика по severity
  const severityStats = await AuditLog.findAll({
    attributes: [
      "severity",
      [require("sequelize").fn("COUNT", "*"), "count"],
    ],
    where: { chainIndex: { [Op.ne]: null } },
    group: ["severity"],
    raw: true,
  });

  // Статистика по месяцам (последние 12)
  const monthlyStats = await AuditLog.findAll({
    attributes: [
      [require("sequelize").fn("DATE_TRUNC", "month", require("sequelize").col("createdAt")), "month"],
      [require("sequelize").fn("COUNT", "*"), "count"],
    ],
    where: {
      chainIndex: { [Op.ne]: null },
      createdAt: { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    group: [require("sequelize").fn("DATE_TRUNC", "month", require("sequelize").col("createdAt"))],
    order: [[require("sequelize").fn("DATE_TRUNC", "month", require("sequelize").col("createdAt")), "ASC"]],
    raw: true,
  });

  return {
    system: "ASVO-QMS",
    standard: "ГОСТ ISO 13485-2017 §4.2.5",
    generatedAt: new Date().toISOString(),
    chainIntegrity: fullReport,
    severityDistribution: severityStats,
    monthlyActivity: monthlyStats,
    conclusion: fullReport.valid
      ? "Целостность аудит-трейла подтверждена. Разрывов в hash-цепочке не обнаружено."
      : `ВНИМАНИЕ: Обнаружено ${fullReport.invalidRecords} нарушений целостности. Требуется расследование.`,
  };
}

module.exports = {
  verifyChain,
  quickVerify,
  generateInspectionReport,
};

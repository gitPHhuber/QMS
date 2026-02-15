/**
 * backfill-audit-hashes.js — Пересчёт hash-chain для существующих записей
 * 
 * НОВЫЙ ФАЙЛ: scripts/backfill-audit-hashes.js
 * 
 * Запуск ОДИН РАЗ после миграции 20260210-audit-hashchain.js
 * 
 * Использование:
 *   node scripts/backfill-audit-hashes.js
 * 
 * Что делает:
 *   1. Берёт все записи audit_logs без chainIndex, отсортированные по createdAt
 *   2. Присваивает chainIndex по порядку
 *   3. Вычисляет dataHash, prevHash, currentHash для каждой
 *   4. Обновляет записи batch-ами по 100
 *   5. Выводит прогресс и итоговый отчёт
 */

require("dotenv").config();
const sequelize = require("../db");
const { AuditLog } = require("../models/index");
const { computeDataHash, computeChainHash, GENESIS_HASH } = require("../modules/core/utils/auditLogger");

const BATCH_SIZE = 100;

async function backfill() {
  console.log("═══════════════════════════════════════════════");
  console.log("  ASVO-QMS: Backfill hash-chain для audit_logs");
  console.log("═══════════════════════════════════════════════\n");

  // 1. Считаем записи без chain
  const unchainedCount = await AuditLog.count({
    where: { chainIndex: null },
  });

  const chainedCount = await AuditLog.count({
    where: { chainIndex: { [sequelize.Sequelize.Op.ne]: null } },
  });

  console.log(`Записей без hash-chain: ${unchainedCount}`);
  console.log(`Записей с hash-chain:   ${chainedCount}`);

  if (unchainedCount === 0) {
    console.log("\n✅ Все записи уже имеют hash-chain. Нечего делать.");
    process.exit(0);
  }

  // 2. Определяем начальный chainIndex
  let startChainIndex = 1;
  let prevHash = GENESIS_HASH;

  if (chainedCount > 0) {
    const lastChained = await AuditLog.findOne({
      where: { chainIndex: { [sequelize.Sequelize.Op.ne]: null } },
      order: [["chainIndex", "DESC"]],
      attributes: ["chainIndex", "currentHash"],
      raw: true,
    });

    if (lastChained) {
      startChainIndex = Number(lastChained.chainIndex) + 1;
      prevHash = lastChained.currentHash;
      console.log(`Продолжаем цепочку с chainIndex=${startChainIndex}`);
    }
  }

  console.log(`\nНачинаем backfill с chainIndex=${startChainIndex}...\n`);

  // 3. Обрабатываем batch-ами
  let processed = 0;
  let currentChainIndex = startChainIndex;
  let currentPrevHash = prevHash;
  const startTime = Date.now();

  while (true) {
    // Берём следующий batch без chain, отсортированный по createdAt
    const records = await AuditLog.findAll({
      where: { chainIndex: null },
      order: [["createdAt", "ASC"], ["id", "ASC"]],
      limit: BATCH_SIZE,
      raw: true,
    });

    if (records.length === 0) break;

    // Обновляем каждую запись в транзакции
    const transaction = await sequelize.transaction();

    try {
      await sequelize.query(
        "SELECT set_config('audit.allow_mutation', 'on', true);",
        { transaction }
      );

      for (const record of records) {
        const dataHash = computeDataHash({
          userId: record.userId,
          action: record.action,
          entity: record.entity,
          entityId: record.entityId,
          description: record.description,
          metadata: record.metadata,
          createdAt: record.createdAt,
        });

        const currentHash = computeChainHash(currentChainIndex, currentPrevHash, dataHash);

        await AuditLog.update(
          {
            chainIndex: currentChainIndex,
            prevHash: currentPrevHash,
            currentHash,
            dataHash,
            severity: record.severity || "INFO",
          },
          {
            where: { id: record.id },
            transaction,
          }
        );

        currentPrevHash = currentHash;
        currentChainIndex++;
        processed++;
      }

      await transaction.commit();

      // Прогресс
      const percent = Math.round((processed / unchainedCount) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.round(processed / (elapsed || 1));
      process.stdout.write(
        `\r  [${percent}%] ${processed}/${unchainedCount} записей | ${elapsed}s | ${rate} записей/сек`
      );
    } catch (error) {
      await transaction.rollback();
      console.error(`\n\n❌ Ошибка на записи #${processed + 1}:`, error.message);
      process.exit(1);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n\n═══════════════════════════════════════════════`);
  console.log(`  ✅ Backfill завершён!`);
  console.log(`  Обработано: ${processed} записей`);
  console.log(`  Время: ${totalTime}s`);
  console.log(`  chainIndex: ${startChainIndex} → ${currentChainIndex - 1}`);
  console.log(`  Последний hash: ${currentPrevHash.substring(0, 16)}...`);
  console.log(`═══════════════════════════════════════════════\n`);

  // 4. Быстрая верификация
  console.log("Запускаем верификацию...");
  const { quickVerify } = require("../utils/auditVerifier");
  const report = await quickVerify(Math.min(processed, 100));

  if (report.valid) {
    console.log(`✅ Верификация пройдена: ${report.validRecords}/${report.totalRecords} записей ОК`);
  } else {
    console.log(`❌ Найдены ошибки: ${report.invalidRecords} нарушений`);
    report.errors.forEach((e) => {
      console.log(`   chainIndex=${e.chainIndex}: ${e.errors.join("; ")}`);
    });
  }

  process.exit(0);
}

backfill().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

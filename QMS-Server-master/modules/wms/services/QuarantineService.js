const { logAudit } = require("../../core/utils/auditLogger");

/**
 * QuarantineService — Автоматический карантин и интеграция с NC
 * ISO 13485 §8.3: управление несоответствующей продукцией
 */
class QuarantineService {
  /**
   * Автоматический перевод коробки в карантин
   * Вызывается при: scrapQty > 0, входной контроль FAILED, истечение срока годности
   *
   * @param {object} params
   * @param {number} params.boxId - ID коробки
   * @param {string} params.reason - Причина карантина
   * @param {string} params.source - Источник (INCOMING_INSPECTION, SCRAP_DETECTED, EXPIRY)
   * @param {object} [params.req] - Express request (для аудита)
   * @param {object} [params.transaction] - Sequelize transaction
   * @returns {Promise<{box, nc?}>}
   */
  async autoQuarantine({ boxId, reason, source, req, transaction }) {
    const { WarehouseBox, StorageZone, WarehouseMovement } = require("../../../models/index");
    const sequelize = require("../../../db");

    const t = transaction || (await sequelize.transaction());
    const isOwnTransaction = !transaction;

    try {
      const box = await WarehouseBox.findByPk(boxId, { transaction: t });
      if (!box) {
        if (isOwnTransaction) await t.rollback();
        return { box: null };
      }

      const fromZoneId = box.currentZoneId;
      const previousStatus = box.status;

      // Найти зону QUARANTINE
      const quarantineZone = await StorageZone.findOne({
        where: { type: "QUARANTINE", isActive: true },
        transaction: t,
      });

      // Обновить коробку
      box.status = "QUARANTINE";
      if (quarantineZone) {
        box.currentZoneId = quarantineZone.id;
      }
      await box.save({ transaction: t });

      // Создать movement для отслеживания
      await WarehouseMovement.create(
        {
          boxId: box.id,
          fromSectionId: box.currentSectionId,
          toSectionId: box.currentSectionId,
          fromZoneId,
          toZoneId: quarantineZone ? quarantineZone.id : null,
          operation: "AUTO_QUARANTINE",
          statusAfter: "QUARANTINE",
          performedById: req && req.user ? req.user.id : null,
          performedAt: new Date(),
          comment: `Автоматический карантин: ${reason}`,
        },
        { transaction: t }
      );

      // Попытка создать NC через межмодульную интеграцию
      let nc = null;
      try {
        nc = await this._createNC({ box, reason, source, req, transaction: t });
      } catch (e) {
        console.warn("QuarantineService: NC module unavailable, skipping NC creation:", e.message);
      }

      // Аудит
      if (req) {
        await logAudit({
          req,
          action: "QUARANTINE_AUTO",
          entity: "WarehouseBox",
          entityId: String(box.id),
          description: `Автоматический карантин коробки #${box.id}: ${reason}`,
          metadata: {
            boxId: box.id,
            previousStatus,
            source,
            ncId: nc ? nc.id : null,
          },
        });
      }

      if (isOwnTransaction) await t.commit();
      return { box, nc };
    } catch (e) {
      if (isOwnTransaction) await t.rollback();
      throw e;
    }
  }

  /**
   * Попытка создать NC через QMS NC модуль (lazy-loaded)
   */
  async _createNC({ box, reason, source, req, transaction }) {
    try {
      const NcCapaService = require("../../qms-nc/services/NcCapaService");
      if (!NcCapaService || !NcCapaService.createNC) return null;

      const ncData = {
        title: `Карантин: ${box.label} (#${box.id})`,
        source: source || "WAREHOUSE",
        description: reason,
        severity: "MAJOR",
        warehouseBoxId: box.id,
        detectedById: req && req.user ? req.user.id : null,
      };

      return await NcCapaService.createNC(req, ncData, transaction);
    } catch {
      return null;
    }
  }
}

module.exports = new QuarantineService();

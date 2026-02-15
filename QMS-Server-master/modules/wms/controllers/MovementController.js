const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const {
  WarehouseBox,
  WarehouseMovement,
  WarehouseDocument,
  Supply,
  Section,
  Team,
  User,
} = require("../../../models/index");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");
const ZoneValidationService = require("../services/ZoneValidationService");

class MovementController {

  /**
   * Внутренний хелпер: валидация зоны и статуса перед перемещением
   */
  async _validateZoneTransition(box, toZoneId, user, transaction) {
    // Lazy-load StorageZone (может быть ещё не создана миграция)
    let StorageZone;
    try {
      StorageZone = require("../../../models/index").StorageZone;
    } catch {
      return { allowed: true };
    }
    if (!StorageZone) return { allowed: true };

    let fromZone = null;
    let toZone = null;

    if (box.currentZoneId) {
      fromZone = await StorageZone.findByPk(box.currentZoneId, { transaction });
    }
    if (toZoneId) {
      toZone = await StorageZone.findByPk(toZoneId, { transaction });
    }

    // Проверка матрицы переходов
    if (fromZone && toZone) {
      const transitionResult = await ZoneValidationService.validateTransition({
        fromZone, toZone, user, transaction,
      });
      if (!transitionResult.allowed) return transitionResult;
    }

    // Проверка статуса коробки для целевой зоны
    if (toZone) {
      const statusResult = ZoneValidationService.validateBoxStatusForZone(box.status, toZone.type);
      if (!statusResult.allowed) return statusResult;
    }

    return { allowed: true };
  }

  async moveSingle(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        boxId,
        operation,
        toSectionId,
        toTeamId,
        toZoneId,
        toLocationId,
        statusAfter,
        deltaQty = 0,
        goodQty = null,
        scrapQty = null,
        comment,
        documentId,
      } = req.body;

      if (!boxId || !operation) {
        await t.rollback();
        return next(ApiError.badRequest("Не указан boxId или operation"));
      }

      const box = await WarehouseBox.findByPk(boxId, { transaction: t });
      if (!box) {
        await t.rollback();
        return next(ApiError.notFound("Коробка не найдена"));
      }

      // ISO 13485: Валидация перехода зон
      if (toZoneId !== undefined) {
        const zoneResult = await this._validateZoneTransition(box, toZoneId, req.user, t);
        if (!zoneResult.allowed) {
          await t.rollback();
          return next(ApiError.badRequest(zoneResult.reason));
        }
      }

      const fromSectionId = box.currentSectionId;
      const fromTeamId = box.currentTeamId;
      const fromZoneId = box.currentZoneId || null;

      let newQty = box.quantity;
      const delta = Number(deltaQty) || 0;

      if (delta !== 0) {
        newQty = box.quantity + delta;
        if (newQty < 0) {
          await t.rollback();
          return next(ApiError.badRequest("Количество не может быть отрицательным"));
        }
        box.quantity = newQty;
      }

      if (toSectionId !== undefined) box.currentSectionId = toSectionId || null;
      if (toTeamId !== undefined) box.currentTeamId = toTeamId || null;
      if (toZoneId !== undefined) box.currentZoneId = toZoneId || null;
      if (toLocationId !== undefined) box.storageLocationId = toLocationId || null;
      if (statusAfter) box.status = statusAfter;

      await box.save({ transaction: t });

      const movement = await WarehouseMovement.create(
        {
          boxId: box.id,
          documentId: documentId || null,
          fromSectionId,
          toSectionId: toSectionId || null,
          fromTeamId,
          toTeamId: toTeamId || null,
          fromZoneId,
          toZoneId: toZoneId || null,
          operation,
          statusAfter: box.status,
          deltaQty: delta,
          goodQty: goodQty !== undefined ? goodQty : null,
          scrapQty: scrapQty !== undefined ? scrapQty : null,
          performedAt: new Date(),
          comment: comment || null,
          performedById: req.user ? req.user.id : null,
        },
        { transaction: t }
      );

      // ISO 13485 §8.3: Автоматический карантин при scrapQty > 0
      const scrapValue = Number(scrapQty) || 0;
      if (scrapValue > 0) {
        try {
          const QuarantineService = require("../services/QuarantineService");
          await QuarantineService.autoQuarantine({
            boxId: box.id,
            reason: `Обнаружен брак: scrapQty=${scrapValue} при операции ${operation}`,
            source: "SCRAP_DETECTED",
            req,
            transaction: t,
          });
        } catch (e) {
          console.warn("Auto-quarantine failed:", e.message);
        }
      }

      await logAudit({
        req,
        action: "WAREHOUSE_MOVE",
        entity: "WarehouseMovement",
        entityId: String(movement.id),
        description: `Операция ${operation} с коробкой #${box.id}`,
        metadata: {
          boxId: box.id,
          fromSectionId,
          toSectionId,
          fromZoneId,
          toZoneId: toZoneId || null,
          deltaQty: delta,
        },
      });

      await t.commit();

      let StorageZone;
      try { StorageZone = require("../../../models/index").StorageZone; } catch { StorageZone = null; }

      const includeOpts = [
        { model: Section, as: "currentSection", attributes: ["id", "title"] },
        { model: Team, as: "currentTeam", attributes: ["id", "title"] },
        { model: Supply, as: "supply" },
      ];
      if (StorageZone) {
        includeOpts.push({ model: StorageZone, as: "currentZone", attributes: ["id", "name", "type"], required: false });
      }

      const reloadedBox = await WarehouseBox.findByPk(box.id, { include: includeOpts });

      return res.json({ box: reloadedBox, movement });
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async moveBatch(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { docNumber, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return next(ApiError.badRequest("Пустой список операций"));
      }

      let document = null;
      if (docNumber) {
        document = await WarehouseDocument.create(
          {
            boxId: null,
            number: docNumber,
            type: "MOVEMENT",
            date: new Date(),
            fileUrl: null,
            comment: null,
            createdById: req.user ? req.user.id : null,
          },
          { transaction: t }
        );
      }

      const documentId = document ? document.id : null;

      const movements = [];
      const updatedBoxes = [];

      for (const raw of items) {
        const boxId = raw.boxId || (raw.box && raw.box.id);
        if (!boxId) {
          await t.rollback();
          return next(ApiError.badRequest("В одном из элементов нет boxId"));
        }

        const {
          operation,
          toSectionId,
          toTeamId,
          toZoneId,
          toLocationId,
          statusAfter,
          deltaQty = 0,
          goodQty = null,
          scrapQty = null,
          comment,
        } = raw;

        const box = await WarehouseBox.findByPk(boxId, { transaction: t });
        if (!box) {
          await t.rollback();
          return next(ApiError.notFound(`Коробка ${boxId} не найдена`));
        }

        // ISO 13485: Валидация перехода зон
        if (toZoneId !== undefined) {
          const zoneResult = await this._validateZoneTransition(box, toZoneId, req.user, t);
          if (!zoneResult.allowed) {
            await t.rollback();
            return next(ApiError.badRequest(zoneResult.reason));
          }
        }

        const fromSectionId = box.currentSectionId;
        const fromTeamId = box.currentTeamId;
        const fromZoneId = box.currentZoneId || null;
        const delta = Number(deltaQty) || 0;

        if (delta !== 0) {
          const newQty = box.quantity + delta;
          if (newQty < 0) {
            await t.rollback();
            return next(
              ApiError.badRequest(`Отрицательное количество для коробки ${boxId}`)
            );
          }
          box.quantity = newQty;
        }

        if (toSectionId !== undefined) box.currentSectionId = toSectionId || null;
        if (toTeamId !== undefined) box.currentTeamId = toTeamId || null;
        if (toZoneId !== undefined) box.currentZoneId = toZoneId || null;
        if (toLocationId !== undefined) box.storageLocationId = toLocationId || null;
        if (statusAfter) box.status = statusAfter;

        await box.save({ transaction: t });

        const movement = await WarehouseMovement.create(
          {
            boxId: box.id,
            documentId,
            fromSectionId,
            toSectionId: toSectionId || null,
            fromTeamId,
            toTeamId: toTeamId || null,
            fromZoneId,
            toZoneId: toZoneId || null,
            operation,
            statusAfter: box.status,
            deltaQty: delta,
            goodQty: goodQty !== undefined ? goodQty : null,
            scrapQty: scrapQty !== undefined ? scrapQty : null,
            performedAt: new Date(),
            comment: comment || null,
            performedById: req.user ? req.user.id : null,
          },
          { transaction: t }
        );

        // ISO 13485 §8.3: Автоматический карантин при scrapQty > 0
        const scrapValue = Number(scrapQty) || 0;
        if (scrapValue > 0) {
          try {
            const QuarantineService = require("../services/QuarantineService");
            await QuarantineService.autoQuarantine({
              boxId: box.id,
              reason: `Обнаружен брак: scrapQty=${scrapValue} при операции ${operation}`,
              source: "SCRAP_DETECTED",
              req,
              transaction: t,
            });
          } catch (e) {
            console.warn("Auto-quarantine failed:", e.message);
          }
        }

        movements.push(movement);
        updatedBoxes.push(box);
      }

      await logAudit({
        req,
        action: "WAREHOUSE_MOVE_BATCH",
        entity: "WarehouseMovement",
        description: `Пакетное перемещение, операций: ${movements.length}`,
        metadata: {
          docNumber: docNumber || null,
          count: movements.length,
        },
      });

      await t.commit();

      return res.json({
        message: "Операции успешно выполнены",
        count: movements.length,
        document: document || null,
      });
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async getMovements(req, res, next) {
    try {
      let { page = 1, limit = 50, boxId, fromDate, toDate, zoneId } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;

      const where = {};
      if (boxId) where.boxId = boxId;
      if (zoneId) {
        where[Op.or] = [{ fromZoneId: zoneId }, { toZoneId: zoneId }];
      }

      if (fromDate || toDate) {
        where.performedAt = {};
        if (fromDate) where.performedAt[Op.gte] = new Date(fromDate);
        if (toDate) where.performedAt[Op.lte] = new Date(toDate);
      }

      const offset = (page - 1) * limit;

      let StorageZone;
      try { StorageZone = require("../../../models/index").StorageZone; } catch { StorageZone = null; }

      const includeOpts = [
        { model: Section, as: "fromSection", attributes: ["id", "title"] },
        { model: Section, as: "toSection", attributes: ["id", "title"] },
        { model: Team, as: "fromTeam", attributes: ["id", "title"] },
        { model: Team, as: "toTeam", attributes: ["id", "title"] },
        {
          model: User,
          as: "performedBy",
          attributes: ["id", "name", "surname"],
        },
      ];
      if (StorageZone) {
        includeOpts.push(
          { model: StorageZone, as: "fromZone", attributes: ["id", "name", "type"], required: false },
          { model: StorageZone, as: "toZone", attributes: ["id", "name", "type"], required: false }
        );
      }

      const { rows, count } = await WarehouseMovement.findAndCountAll({
        where,
        limit,
        offset,
        order: [["performedAt", "DESC"]],
        include: includeOpts,
      });

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async getBalance(req, res, next) {
    try {
      const { zoneId } = req.query;

      const where = {
        status: {
          [Op.notIn]: ["SCRAP", "SHIPPED"],
        },
      };

      if (zoneId) where.currentZoneId = zoneId;

      const balances = await WarehouseBox.findAll({
        attributes: [
          "label",
          "originType",
          "originId",
          "unit",
          [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
          [sequelize.fn("COUNT", sequelize.col("id")), "boxCount"],
          [sequelize.fn("MIN", sequelize.col("expiryDate")), "nearestExpiry"],
        ],
        where,
        group: ["label", "originType", "originId", "unit"],
        order: [["label", "ASC"]],
      });

      return res.json(balances);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * GET /warehouse/expiry-alerts — Коробки с истекающим сроком годности
   */
  async getExpiryAlerts(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alertDays = Number(req.query.days) || 90;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + alertDays);

      const boxes = await WarehouseBox.findAll({
        where: {
          expiryDate: {
            [Op.between]: [today, targetDate],
          },
          status: { [Op.notIn]: ["EXPIRED", "SCRAP", "SHIPPED"] },
        },
        order: [["expiryDate", "ASC"]],
      });

      return res.json(boxes);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * POST /warehouse/cron/check-expiry — Ежедневная проверка сроков годности (CRON)
   */
  async checkExpiryCron(req, res, next) {
    try {
      const ExpiryService = require("../services/ExpiryService");
      const results = await ExpiryService.checkExpiry(req);
      return res.json(results);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new MovementController();

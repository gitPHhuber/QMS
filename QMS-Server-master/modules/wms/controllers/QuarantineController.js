const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class QuarantineController {
  async getQuarantinedBoxes(req, res, next) {
    try {
      const { WarehouseBox, StorageZone, QuarantineDecision, Supply, User } =
        require("../../../models/index");

      let { page = 1, limit = 50 } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const { rows, count } = await WarehouseBox.findAndCountAll({
        where: {
          status: { [Op.in]: ["QUARANTINE", "BLOCKED", "HOLD", "EXPIRED"] },
        },
        limit,
        offset,
        order: [["updatedAt", "DESC"]],
        include: [
          { model: StorageZone, as: "currentZone", attributes: ["id", "name", "type"], required: false },
          { model: Supply, as: "supply", required: false },
        ],
      });

      // Подсчёт по статусам для дашборда
      const summary = await WarehouseBox.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          status: { [Op.in]: ["QUARANTINE", "BLOCKED", "HOLD", "EXPIRED"] },
        },
        group: ["status"],
      });

      return res.json({ rows, count, page, limit, summary });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async makeDecision(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { WarehouseBox, StorageZone, QuarantineDecision, WarehouseMovement } =
        require("../../../models/index");

      const { boxId, reason, decisionType, ncId, notes } = req.body;

      if (!boxId || !reason || !decisionType) {
        await t.rollback();
        return next(ApiError.badRequest("Не указаны boxId, reason или decisionType"));
      }

      const box = await WarehouseBox.findByPk(boxId, { transaction: t });
      if (!box) {
        await t.rollback();
        return next(ApiError.notFound("Коробка не найдена"));
      }

      const blockedStatuses = ["QUARANTINE", "BLOCKED", "HOLD", "EXPIRED"];
      if (!blockedStatuses.includes(box.status)) {
        await t.rollback();
        return next(ApiError.badRequest(`Коробка не в карантине (текущий статус: ${box.status})`));
      }

      // Создать запись решения
      const decision = await QuarantineDecision.create(
        {
          boxId,
          reason,
          decisionType,
          decidedById: req.user.id,
          decidedAt: new Date(),
          ncId: ncId || null,
          notes: notes || null,
        },
        { transaction: t }
      );

      const fromZoneId = box.currentZoneId;
      let targetZoneType;
      let newStatus;

      switch (decisionType) {
        case "RELEASE":
          targetZoneType = "MAIN";
          newStatus = "ON_STOCK";
          break;
        case "REWORK":
          targetZoneType = "MAIN";
          newStatus = "IN_WORK";
          break;
        case "SCRAP":
          targetZoneType = "DEFECT";
          newStatus = "SCRAP";
          break;
        case "RETURN_TO_SUPPLIER":
          targetZoneType = "SHIPPING";
          newStatus = "RETURN_TO_SUPPLIER";
          break;
        default:
          await t.rollback();
          return next(ApiError.badRequest(`Неизвестный тип решения: ${decisionType}`));
      }

      // Найти целевую зону
      const targetZone = await StorageZone.findOne({
        where: { type: targetZoneType, isActive: true },
        transaction: t,
      });

      box.status = newStatus;
      if (targetZone) {
        box.currentZoneId = targetZone.id;
      }
      await box.save({ transaction: t });

      // Создать movement
      await WarehouseMovement.create(
        {
          boxId: box.id,
          fromSectionId: box.currentSectionId,
          toSectionId: box.currentSectionId,
          fromZoneId,
          toZoneId: targetZone ? targetZone.id : null,
          operation: "QUARANTINE_DECISION",
          statusAfter: newStatus,
          performedById: req.user.id,
          performedAt: new Date(),
          comment: `Решение: ${decisionType}. ${reason}`,
        },
        { transaction: t }
      );

      await logAudit({
        req,
        action: "QUARANTINE_DECIDE",
        entity: "QuarantineDecision",
        entityId: String(decision.id),
        description: `Решение по карантину коробки #${boxId}: ${decisionType}`,
        metadata: {
          boxId,
          decisionType,
          previousStatus: box.status,
          newStatus,
          ncId: ncId || null,
        },
      });

      await t.commit();
      return res.json({ decision, box });
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new QuarantineController();

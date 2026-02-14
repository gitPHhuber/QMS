const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class ReturnController {
  async createReturn(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { Return, ReturnItem, WarehouseBox, StorageZone, WarehouseMovement } =
        require("../../../models/index");

      const { number, customerId, shipmentId, reason, notes, items } = req.body;

      if (!number) {
        await t.rollback();
        return next(ApiError.badRequest("Не указан номер возврата"));
      }

      const returnRecord = await Return.create(
        {
          number,
          date: new Date(),
          customerId: customerId || null,
          shipmentId: shipmentId || null,
          reason: reason || null,
          status: "RECEIVED",
          notes: notes || null,
        },
        { transaction: t }
      );

      // Создать позиции возврата и перевести коробки в карантин
      if (Array.isArray(items)) {
        for (const item of items) {
          await ReturnItem.create(
            {
              returnId: returnRecord.id,
              boxId: item.boxId || null,
              serialNumber: item.serialNumber || null,
              quantity: item.quantity || 1,
              condition: item.condition || null,
            },
            { transaction: t }
          );

          // Переместить коробку в зону QUARANTINE
          if (item.boxId) {
            const box = await WarehouseBox.findByPk(item.boxId, { transaction: t });
            if (box) {
              const fromZoneId = box.currentZoneId;
              const quarantineZone = await StorageZone.findOne({
                where: { type: "QUARANTINE", isActive: true },
                transaction: t,
              });

              box.status = "QUARANTINE";
              if (quarantineZone) box.currentZoneId = quarantineZone.id;
              await box.save({ transaction: t });

              await WarehouseMovement.create(
                {
                  boxId: box.id,
                  fromSectionId: box.currentSectionId,
                  toSectionId: box.currentSectionId,
                  fromZoneId,
                  toZoneId: quarantineZone ? quarantineZone.id : null,
                  operation: "RETURN_RECEIPT",
                  statusAfter: "QUARANTINE",
                  performedById: req.user ? req.user.id : null,
                  performedAt: new Date(),
                  comment: `Возврат ${number}: ${reason || ""}`,
                },
                { transaction: t }
              );
            }
          }
        }
      }

      // Попытка создать жалобу (lazy-loaded)
      try {
        const complaintsModule = require("../../qms-complaints/models/Complaint");
        if (complaintsModule && complaintsModule.Complaint) {
          const complaint = await complaintsModule.Complaint.create(
            {
              title: `Возврат ${number}`,
              description: reason || "Возврат продукции от покупателя",
              source: "RETURN",
              status: "NEW",
              reportedById: req.user ? req.user.id : null,
            },
            { transaction: t }
          );
          returnRecord.complaintId = complaint.id;
          await returnRecord.save({ transaction: t });
        }
      } catch {
        // Модуль жалоб недоступен
      }

      await logAudit({
        req,
        action: "RETURN_CREATE",
        entity: "Return",
        entityId: String(returnRecord.id),
        description: `Создан возврат ${number}`,
        metadata: { returnId: returnRecord.id, customerId, shipmentId },
      });

      await t.commit();
      return res.json(returnRecord);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getReturns(req, res, next) {
    try {
      const { Return, ReturnItem, User } = require("../../../models/index");

      let { page = 1, limit = 50, status } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;

      const { rows, count } = await Return.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date", "DESC"]],
        include: [{ model: ReturnItem, as: "items" }],
      });

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async inspect(req, res, next) {
    try {
      const { Return, ReturnItem } = require("../../../models/index");
      const { id } = req.params;
      const { items } = req.body; // [{itemId, condition, disposition}]

      const returnRecord = await Return.findByPk(id);
      if (!returnRecord) return next(ApiError.notFound("Возврат не найден"));

      if (Array.isArray(items)) {
        for (const item of items) {
          await ReturnItem.update(
            {
              condition: item.condition || null,
              disposition: item.disposition || null,
            },
            { where: { id: item.itemId, returnId: returnRecord.id } }
          );
        }
      }

      returnRecord.status = "INSPECTING";
      await returnRecord.save();

      return res.json(returnRecord);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async decide(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { Return, ReturnItem, WarehouseBox, StorageZone } = require("../../../models/index");
      const { id } = req.params;

      const returnRecord = await Return.findByPk(id, {
        include: [{ model: ReturnItem, as: "items" }],
        transaction: t,
      });
      if (!returnRecord) {
        await t.rollback();
        return next(ApiError.notFound("Возврат не найден"));
      }

      // Применить решения по каждой позиции
      for (const item of returnRecord.items) {
        if (!item.disposition || !item.boxId) continue;

        const box = await WarehouseBox.findByPk(item.boxId, { transaction: t });
        if (!box) continue;

        switch (item.disposition) {
          case "RESTOCK": {
            const mainZone = await StorageZone.findOne({ where: { type: "MAIN", isActive: true }, transaction: t });
            box.status = "ON_STOCK";
            if (mainZone) box.currentZoneId = mainZone.id;
            break;
          }
          case "REWORK": {
            const mainZone = await StorageZone.findOne({ where: { type: "MAIN", isActive: true }, transaction: t });
            box.status = "IN_WORK";
            if (mainZone) box.currentZoneId = mainZone.id;
            break;
          }
          case "SCRAP":
          case "DESTROY": {
            const defectZone = await StorageZone.findOne({ where: { type: "DEFECT", isActive: true }, transaction: t });
            box.status = "SCRAP";
            if (defectZone) box.currentZoneId = defectZone.id;
            break;
          }
        }
        await box.save({ transaction: t });
      }

      returnRecord.status = "DECIDED";
      await returnRecord.save({ transaction: t });

      await logAudit({
        req,
        action: "RETURN_DECIDE",
        entity: "Return",
        entityId: String(returnRecord.id),
        description: `Решение по возврату ${returnRecord.number}`,
        metadata: { returnId: returnRecord.id },
      });

      await t.commit();
      return res.json(returnRecord);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ReturnController();

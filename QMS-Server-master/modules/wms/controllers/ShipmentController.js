const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class ShipmentController {
  async createShipment(req, res, next) {
    try {
      const { Shipment } = require("../../../models/index");
      const { number, date, customerId, contractNumber, notes } = req.body;

      if (!number) return next(ApiError.badRequest("Не указан номер отгрузки"));

      const shipment = await Shipment.create({
        number,
        date: date || new Date(),
        customerId: customerId || null,
        contractNumber: contractNumber || null,
        status: "DRAFT",
        notes: notes || null,
      });

      await logAudit({
        req,
        action: "SHIPMENT_CREATE",
        entity: "Shipment",
        entityId: String(shipment.id),
        description: `Создана отгрузка ${number}`,
        metadata: { shipmentId: shipment.id, customerId },
      });

      return res.json(shipment);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getShipments(req, res, next) {
    try {
      const { Shipment, ShipmentItem, User } = require("../../../models/index");

      let { page = 1, limit = 50, status, fromDate, toDate } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) where.date[Op.gte] = fromDate;
        if (toDate) where.date[Op.lte] = toDate;
      }

      const { rows, count } = await Shipment.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date", "DESC"]],
        include: [
          { model: ShipmentItem, as: "items" },
          { model: User, as: "shippedBy", attributes: ["id", "name", "surname"], required: false },
          { model: User, as: "verifiedBy", attributes: ["id", "name", "surname"], required: false },
        ],
      });

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getShipmentById(req, res, next) {
    try {
      const { Shipment, ShipmentItem, WarehouseBox, User } = require("../../../models/index");
      const { id } = req.params;

      const shipment = await Shipment.findByPk(id, {
        include: [
          {
            model: ShipmentItem, as: "items",
            include: [{ model: WarehouseBox, as: "box", required: false }],
          },
          { model: User, as: "shippedBy", attributes: ["id", "name", "surname"], required: false },
          { model: User, as: "verifiedBy", attributes: ["id", "name", "surname"], required: false },
        ],
      });

      if (!shipment) return next(ApiError.notFound("Отгрузка не найдена"));
      return res.json(shipment);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * POST /warehouse/shipments/:id/pick — Комплектация (добавление позиций)
   * Валидация: только коробки из зоны FINISHED_GOODS
   */
  async pick(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { Shipment, ShipmentItem, WarehouseBox, StorageZone } =
        require("../../../models/index");

      const { id } = req.params;
      const { items } = req.body; // [{boxId, quantity}]

      const shipment = await Shipment.findByPk(id, { transaction: t });
      if (!shipment) {
        await t.rollback();
        return next(ApiError.notFound("Отгрузка не найдена"));
      }

      if (!["DRAFT", "PICKING"].includes(shipment.status)) {
        await t.rollback();
        return next(ApiError.badRequest("Комплектация возможна только для статусов DRAFT/PICKING"));
      }

      if (!Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return next(ApiError.badRequest("Не указаны позиции для комплектации"));
      }

      const created = [];
      for (const item of items) {
        const box = await WarehouseBox.findByPk(item.boxId, {
          include: [{ model: StorageZone, as: "currentZone", required: false }],
          transaction: t,
        });

        if (!box) {
          await t.rollback();
          return next(ApiError.notFound(`Коробка #${item.boxId} не найдена`));
        }

        // Валидация: только из зоны FINISHED_GOODS
        if (box.currentZone && box.currentZone.type !== "FINISHED_GOODS") {
          await t.rollback();
          return next(
            ApiError.badRequest(
              `Коробка #${item.boxId} находится в зоне "${box.currentZone.name}" (${box.currentZone.type}). ` +
              `Отгрузка возможна только из зоны FINISHED_GOODS`
            )
          );
        }

        const shipmentItem = await ShipmentItem.create(
          {
            shipmentId: shipment.id,
            boxId: box.id,
            quantity: item.quantity || box.quantity,
          },
          { transaction: t }
        );
        created.push(shipmentItem);
      }

      shipment.status = "PICKING";
      await shipment.save({ transaction: t });

      await logAudit({
        req,
        action: "SHIPMENT_PICK",
        entity: "Shipment",
        entityId: String(shipment.id),
        description: `Комплектация отгрузки ${shipment.number}: ${created.length} позиций`,
        metadata: { shipmentId: shipment.id, itemCount: created.length },
      });

      await t.commit();
      return res.json({ shipment, items: created });
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * POST /warehouse/shipments/:id/verify — Проверка упаковки
   */
  async verify(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { Shipment, ShipmentItem } = require("../../../models/index");
      const { id } = req.params;
      const { items } = req.body; // [{itemId, packageCondition}]

      const shipment = await Shipment.findByPk(id, { transaction: t });
      if (!shipment) {
        await t.rollback();
        return next(ApiError.notFound("Отгрузка не найдена"));
      }

      if (Array.isArray(items)) {
        for (const item of items) {
          await ShipmentItem.update(
            {
              packageCondition: item.packageCondition || "OK",
              verifiedAt: new Date(),
            },
            { where: { id: item.itemId, shipmentId: shipment.id }, transaction: t }
          );
        }
      }

      shipment.status = "PACKED";
      shipment.verifiedById = req.user.id;
      await shipment.save({ transaction: t });

      await logAudit({
        req,
        action: "SHIPMENT_VERIFY",
        entity: "Shipment",
        entityId: String(shipment.id),
        description: `Проверка упаковки отгрузки ${shipment.number} завершена`,
        metadata: { shipmentId: shipment.id },
      });

      await t.commit();
      return res.json(shipment);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * POST /warehouse/shipments/:id/ship — Подтверждение отгрузки
   * Перемещает коробки в зону SHIPPING, статус SHIPPED
   */
  async ship(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { Shipment, ShipmentItem, WarehouseBox, StorageZone, WarehouseMovement } =
        require("../../../models/index");

      const { id } = req.params;

      const shipment = await Shipment.findByPk(id, {
        include: [{ model: ShipmentItem, as: "items" }],
        transaction: t,
      });

      if (!shipment) {
        await t.rollback();
        return next(ApiError.notFound("Отгрузка не найдена"));
      }

      if (shipment.status !== "PACKED") {
        await t.rollback();
        return next(ApiError.badRequest("Отгрузка возможна только после проверки упаковки (PACKED)"));
      }

      const shippingZone = await StorageZone.findOne({
        where: { type: "SHIPPING", isActive: true },
        transaction: t,
      });

      // Переместить все коробки в зону SHIPPING, статус SHIPPED
      for (const item of shipment.items) {
        const box = await WarehouseBox.findByPk(item.boxId, { transaction: t });
        if (!box) continue;

        const fromZoneId = box.currentZoneId;
        box.status = "SHIPPED";
        if (shippingZone) box.currentZoneId = shippingZone.id;
        await box.save({ transaction: t });

        await WarehouseMovement.create(
          {
            boxId: box.id,
            fromSectionId: box.currentSectionId,
            toSectionId: box.currentSectionId,
            fromZoneId,
            toZoneId: shippingZone ? shippingZone.id : null,
            operation: "SHIPMENT",
            statusAfter: "SHIPPED",
            performedById: req.user.id,
            performedAt: new Date(),
            comment: `Отгрузка ${shipment.number}`,
          },
          { transaction: t }
        );
      }

      shipment.status = "SHIPPED";
      shipment.shippedById = req.user.id;
      await shipment.save({ transaction: t });

      await logAudit({
        req,
        action: "SHIPMENT_SHIP",
        entity: "Shipment",
        entityId: String(shipment.id),
        description: `Отгрузка ${shipment.number} подтверждена: ${shipment.items.length} позиций`,
        metadata: {
          shipmentId: shipment.id,
          itemCount: shipment.items.length,
        },
      });

      await t.commit();
      return res.json(shipment);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ShipmentController();

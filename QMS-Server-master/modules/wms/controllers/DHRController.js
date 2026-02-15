const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class DHRController {
  /**
   * GET /warehouse/dhr/:serialNumber — Полная история устройства
   * Возвращает DHR + компоненты (с данными коробок, поставщиков) + записи + перемещения
   */
  async getDHR(req, res, next) {
    try {
      const {
        DeviceHistoryRecord, DHRComponent, DHRRecord,
        WarehouseBox, WarehouseMovement, Supply, User,
      } = require("../../../models/index");

      const { serialNumber } = req.params;

      const dhr = await DeviceHistoryRecord.findOne({
        where: { serialNumber },
        include: [
          {
            model: DHRComponent,
            as: "components",
            include: [
              {
                model: WarehouseBox,
                as: "box",
                include: [{ model: Supply, as: "supply" }],
                required: false,
              },
            ],
          },
          {
            model: DHRRecord,
            as: "records",
            include: [
              { model: User, as: "recordedBy", attributes: ["id", "name", "surname"], required: false },
            ],
            order: [["recordedAt", "ASC"]],
          },
        ],
      });

      if (!dhr) return next(ApiError.notFound("DHR с указанным серийным номером не найден"));

      // Получить все перемещения связанных коробок
      const componentBoxIds = dhr.components
        .filter((c) => c.boxId)
        .map((c) => c.boxId);

      let movements = [];
      if (componentBoxIds.length > 0) {
        movements = await WarehouseMovement.findAll({
          where: { boxId: { [Op.in]: componentBoxIds } },
          order: [["performedAt", "ASC"]],
          include: [
            { model: User, as: "performedBy", attributes: ["id", "name", "surname"], required: false },
          ],
        });
      }

      return res.json({ dhr, movements });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * GET /warehouse/dhr/trace-back/:batchNumber — Обратная прослеживаемость
   * По номеру партии комплектующего → все устройства, в которых он использован
   */
  async traceBack(req, res, next) {
    try {
      const { DeviceHistoryRecord, DHRComponent, WarehouseBox } =
        require("../../../models/index");

      const { batchNumber } = req.params;

      // Найти коробки с данной партией
      const boxes = await WarehouseBox.findAll({
        where: { batchName: batchNumber },
        attributes: ["id", "label", "batchName"],
      });

      const boxIds = boxes.map((b) => b.id);

      // Найти все DHR, содержащие эти коробки как комплектующие
      let dhrs = [];
      if (boxIds.length > 0) {
        const components = await DHRComponent.findAll({
          where: { boxId: { [Op.in]: boxIds } },
          attributes: ["dhrId", "boxId", "componentName", "supplierLot"],
        });

        const dhrIds = [...new Set(components.map((c) => c.dhrId))];

        if (dhrIds.length > 0) {
          dhrs = await DeviceHistoryRecord.findAll({
            where: { id: { [Op.in]: dhrIds } },
            include: [{ model: DHRComponent, as: "components" }],
          });
        }
      }

      // Также поиск по supplierLot
      const componentsByLot = await DHRComponent.findAll({
        where: { supplierLot: batchNumber },
        attributes: ["dhrId", "boxId", "componentName", "supplierLot"],
      });

      const additionalDhrIds = componentsByLot
        .map((c) => c.dhrId)
        .filter((id) => !dhrs.some((d) => d.id === id));

      if (additionalDhrIds.length > 0) {
        const additionalDhrs = await DeviceHistoryRecord.findAll({
          where: { id: { [Op.in]: additionalDhrIds } },
          include: [{ model: DHRComponent, as: "components" }],
        });
        dhrs = dhrs.concat(additionalDhrs);
      }

      return res.json({
        batchNumber,
        affectedBoxes: boxes,
        affectedDevices: dhrs,
        totalDevices: dhrs.length,
      });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createDHR(req, res, next) {
    try {
      const { DeviceHistoryRecord } = require("../../../models/index");
      const { productId, serialNumber, batchNumber, manufacturingDate } = req.body;

      if (!serialNumber) {
        return next(ApiError.badRequest("Не указан серийный номер"));
      }

      const existing = await DeviceHistoryRecord.findOne({ where: { serialNumber } });
      if (existing) {
        return next(ApiError.badRequest(`DHR с серийным номером "${serialNumber}" уже существует`));
      }

      const dhr = await DeviceHistoryRecord.create({
        productId: productId || null,
        serialNumber,
        batchNumber: batchNumber || null,
        status: "IN_PRODUCTION",
        manufacturingDate: manufacturingDate || new Date(),
      });

      await logAudit({
        req,
        action: "DHR_CREATE",
        entity: "DeviceHistoryRecord",
        entityId: String(dhr.id),
        description: `Создан DHR: серийный номер ${serialNumber}`,
        metadata: { serialNumber, batchNumber, productId },
      });

      return res.json(dhr);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async addComponents(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { DeviceHistoryRecord, DHRComponent } = require("../../../models/index");
      const { id } = req.params;
      const { components } = req.body;

      const dhr = await DeviceHistoryRecord.findByPk(id, { transaction: t });
      if (!dhr) {
        await t.rollback();
        return next(ApiError.notFound("DHR не найден"));
      }

      if (!Array.isArray(components) || components.length === 0) {
        await t.rollback();
        return next(ApiError.badRequest("Не указаны комплектующие"));
      }

      const created = await DHRComponent.bulkCreate(
        components.map((c) => ({
          dhrId: dhr.id,
          boxId: c.boxId || null,
          componentName: c.componentName,
          quantity: c.quantity || 1,
          supplierLot: c.supplierLot || null,
          certificateRef: c.certificateRef || null,
        })),
        { transaction: t }
      );

      await logAudit({
        req,
        action: "DHR_COMPONENT_ADD",
        entity: "DeviceHistoryRecord",
        entityId: String(dhr.id),
        description: `Добавлено ${created.length} комплектующих к DHR ${dhr.serialNumber}`,
        metadata: { dhrId: dhr.id, componentCount: created.length },
      });

      await t.commit();
      return res.json(created);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async addRecord(req, res, next) {
    try {
      const { DeviceHistoryRecord, DHRRecord } = require("../../../models/index");
      const { id } = req.params;
      const { recordType, referenceId, description } = req.body;

      const dhr = await DeviceHistoryRecord.findByPk(id);
      if (!dhr) return next(ApiError.notFound("DHR не найден"));

      const record = await DHRRecord.create({
        dhrId: dhr.id,
        recordType,
        referenceId: referenceId || null,
        description: description || null,
        recordedAt: new Date(),
        recordedById: req.user ? req.user.id : null,
      });

      await logAudit({
        req,
        action: "DHR_RECORD_ADD",
        entity: "DeviceHistoryRecord",
        entityId: String(dhr.id),
        description: `Добавлена запись ${recordType} к DHR ${dhr.serialNumber}`,
        metadata: { dhrId: dhr.id, recordType, referenceId },
      });

      return res.json(record);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateDHRStatus(req, res, next) {
    try {
      const { DeviceHistoryRecord } = require("../../../models/index");
      const { id } = req.params;
      const { status, releaseDate } = req.body;

      const dhr = await DeviceHistoryRecord.findByPk(id);
      if (!dhr) return next(ApiError.notFound("DHR не найден"));

      const previousStatus = dhr.status;
      if (status) dhr.status = status;
      if (releaseDate) dhr.releaseDate = releaseDate;
      if (status === "RELEASED" && !dhr.releaseDate) dhr.releaseDate = new Date();

      await dhr.save();

      await logAudit({
        req,
        action: "DHR_STATUS_CHANGE",
        entity: "DeviceHistoryRecord",
        entityId: String(dhr.id),
        description: `Статус DHR ${dhr.serialNumber}: ${previousStatus} → ${status}`,
        metadata: { previousStatus, newStatus: status },
      });

      return res.json(dhr);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new DHRController();

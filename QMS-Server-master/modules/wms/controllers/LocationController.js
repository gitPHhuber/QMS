const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

class LocationController {
  async createLocation(req, res, next) {
    try {
      const { StorageLocation } = require("../../../models/index");
      const { zoneId, rack, shelf, cell, barcode, capacity } = req.body;

      if (!zoneId || !rack || !shelf) {
        return next(ApiError.badRequest("Не указаны zoneId, rack или shelf"));
      }

      const generatedBarcode = barcode || `${rack}-${shelf}${cell ? `-${cell}` : ""}`;

      const existing = await StorageLocation.findOne({ where: { barcode: generatedBarcode } });
      if (existing) {
        return next(ApiError.badRequest(`Ячейка с адресом "${generatedBarcode}" уже существует`));
      }

      const location = await StorageLocation.create({
        zoneId,
        rack,
        shelf,
        cell: cell || null,
        barcode: generatedBarcode,
        capacity: capacity || null,
        isOccupied: false,
        isActive: true,
      });

      await logAudit({
        req,
        action: "LOCATION_CREATE",
        entity: "StorageLocation",
        entityId: String(location.id),
        description: `Создана ячейка ${generatedBarcode}`,
        metadata: { zoneId, rack, shelf, cell },
      });

      return res.json(location);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getLocations(req, res, next) {
    try {
      const { StorageLocation, StorageZone } = require("../../../models/index");

      const where = { isActive: true };
      if (req.query.zoneId) where.zoneId = req.query.zoneId;

      const locations = await StorageLocation.findAll({
        where,
        order: [["rack", "ASC"], ["shelf", "ASC"], ["cell", "ASC"]],
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"], required: false },
        ],
      });

      return res.json(locations);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { StorageLocation } = require("../../../models/index");
      const { id } = req.params;

      const location = await StorageLocation.findByPk(id);
      if (!location) return next(ApiError.notFound("Ячейка не найдена"));

      const { capacity, isActive } = req.body;
      if (capacity !== undefined) location.capacity = capacity;
      if (isActive !== undefined) location.isActive = isActive;

      await location.save();

      await logAudit({
        req,
        action: "LOCATION_UPDATE",
        entity: "StorageLocation",
        entityId: String(location.id),
        description: `Обновлена ячейка ${location.barcode}`,
        metadata: req.body,
      });

      return res.json(location);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getByBarcode(req, res, next) {
    try {
      const { StorageLocation, StorageZone, WarehouseBox } = require("../../../models/index");
      const { barcode } = req.params;

      const location = await StorageLocation.findOne({
        where: { barcode },
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"], required: false },
        ],
      });

      if (!location) return next(ApiError.notFound("Ячейка не найдена"));

      // Получить содержимое ячейки
      const boxes = await WarehouseBox.findAll({
        where: { storageLocationId: location.id },
      });

      return res.json({ location, boxes });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getOccupancy(req, res, next) {
    try {
      const { StorageLocation, StorageZone, WarehouseBox } = require("../../../models/index");
      const sequelize = require("../../../db");

      const where = { isActive: true };
      if (req.query.zoneId) where.zoneId = req.query.zoneId;

      const locations = await StorageLocation.findAll({
        where,
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"], required: false },
        ],
      });

      // Подсчёт коробок на каждой ячейке
      const occupancy = await Promise.all(
        locations.map(async (loc) => {
          const boxCount = await WarehouseBox.count({
            where: { storageLocationId: loc.id },
          });
          return {
            ...loc.toJSON(),
            boxCount,
            isOccupied: boxCount > 0,
          };
        })
      );

      return res.json(occupancy);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new LocationController();

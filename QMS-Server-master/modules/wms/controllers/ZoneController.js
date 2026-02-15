const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class ZoneController {
  async createZone(req, res, next) {
    try {
      const { StorageZone } = require("../../../models/index");
      const { name, type, parentZoneId, conditions, capacity } = req.body;

      if (!name || !type) {
        return next(ApiError.badRequest("Не указаны name или type зоны"));
      }

      const zone = await StorageZone.create({
        name,
        type,
        parentZoneId: parentZoneId || null,
        conditions: conditions || null,
        capacity: capacity || null,
        isActive: true,
      });

      await logAudit({
        req,
        action: "ZONE_CREATE",
        entity: "StorageZone",
        entityId: String(zone.id),
        description: `Создана зона "${name}" (${type})`,
        metadata: { zoneId: zone.id, type },
      });

      return res.json(zone);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getZones(req, res, next) {
    try {
      const { StorageZone, WarehouseBox } = require("../../../models/index");

      const zones = await StorageZone.findAll({
        where: { isActive: true },
        order: [["type", "ASC"], ["name", "ASC"]],
      });

      // Подсчёт количества коробок в каждой зоне
      const zonesWithCounts = await Promise.all(
        zones.map(async (zone) => {
          const boxCount = await WarehouseBox.count({
            where: { currentZoneId: zone.id },
          });
          return { ...zone.toJSON(), boxCount };
        })
      );

      return res.json(zonesWithCounts);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateZone(req, res, next) {
    try {
      const { StorageZone } = require("../../../models/index");
      const { id } = req.params;
      const { name, type, parentZoneId, conditions, capacity, isActive } = req.body;

      const zone = await StorageZone.findByPk(id);
      if (!zone) return next(ApiError.notFound("Зона не найдена"));

      if (name !== undefined) zone.name = name;
      if (type !== undefined) zone.type = type;
      if (parentZoneId !== undefined) zone.parentZoneId = parentZoneId;
      if (conditions !== undefined) zone.conditions = conditions;
      if (capacity !== undefined) zone.capacity = capacity;
      if (isActive !== undefined) zone.isActive = isActive;

      await zone.save();

      await logAudit({
        req,
        action: "ZONE_UPDATE",
        entity: "StorageZone",
        entityId: String(zone.id),
        description: `Обновлена зона "${zone.name}" (${zone.type})`,
        metadata: req.body,
      });

      return res.json(zone);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getTransitionRules(req, res, next) {
    try {
      const { ZoneTransitionRule } = require("../../../models/index");

      const rules = await ZoneTransitionRule.findAll({
        order: [["fromZoneType", "ASC"], ["toZoneType", "ASC"]],
      });

      return res.json(rules);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateTransitionRule(req, res, next) {
    try {
      const { ZoneTransitionRule } = require("../../../models/index");
      const { id } = req.params;
      const { requiresApproval, requiredRole, isActive } = req.body;

      const rule = await ZoneTransitionRule.findByPk(id);
      if (!rule) return next(ApiError.notFound("Правило не найдено"));

      if (requiresApproval !== undefined) rule.requiresApproval = requiresApproval;
      if (requiredRole !== undefined) rule.requiredRole = requiredRole;
      if (isActive !== undefined) rule.isActive = isActive;

      await rule.save();

      await logAudit({
        req,
        action: "ZONE_UPDATE",
        entity: "ZoneTransitionRule",
        entityId: String(rule.id),
        description: `Обновлено правило перехода ${rule.fromZoneType} → ${rule.toZoneType}`,
        metadata: req.body,
      });

      return res.json(rule);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ZoneController();

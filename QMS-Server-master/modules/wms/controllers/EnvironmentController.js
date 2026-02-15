const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

class EnvironmentController {
  /**
   * POST /warehouse/environment — Запись показаний температуры/влажности
   * Автоматическая проверка лимитов из zone.conditions, создание алертов при отклонении
   */
  async createReading(req, res, next) {
    try {
      const { EnvironmentReading, EnvironmentAlert, StorageZone } =
        require("../../../models/index");

      const { zoneId, temperature, humidity, equipmentId, notes } = req.body;

      if (!zoneId) return next(ApiError.badRequest("Не указан zoneId"));

      const zone = await StorageZone.findByPk(zoneId);
      if (!zone) return next(ApiError.notFound("Зона не найдена"));

      // Проверка лимитов из zone.conditions
      let isWithinLimits = true;
      const alerts = [];

      if (zone.conditions) {
        const c = zone.conditions;
        if (temperature != null) {
          if (c.temp_max != null && temperature > c.temp_max) {
            isWithinLimits = false;
            alerts.push("TEMP_HIGH");
          }
          if (c.temp_min != null && temperature < c.temp_min) {
            isWithinLimits = false;
            alerts.push("TEMP_LOW");
          }
        }
        if (humidity != null) {
          if (c.humidity_max != null && humidity > c.humidity_max) {
            isWithinLimits = false;
            alerts.push("HUMIDITY_HIGH");
          }
          if (c.humidity_min != null && humidity < c.humidity_min) {
            isWithinLimits = false;
            alerts.push("HUMIDITY_LOW");
          }
        }
      }

      const reading = await EnvironmentReading.create({
        zoneId,
        temperature: temperature != null ? temperature : null,
        humidity: humidity != null ? humidity : null,
        measuredAt: new Date(),
        measuredById: req.user.id,
        equipmentId: equipmentId || null,
        isWithinLimits,
        notes: notes || null,
      });

      // Создать алерты при отклонении
      const createdAlerts = [];
      for (const alertType of alerts) {
        const alert = await EnvironmentAlert.create({
          zoneId,
          readingId: reading.id,
          alertType,
        });
        createdAlerts.push(alert);
      }

      if (!isWithinLimits) {
        await logAudit({
          req,
          action: "ENVIRONMENT_ALERT",
          entity: "EnvironmentReading",
          entityId: String(reading.id),
          description: `Отклонение условий хранения в зоне "${zone.name}": ${alerts.join(", ")}`,
          metadata: { zoneId, temperature, humidity, alerts },
        });
      }

      await logAudit({
        req,
        action: "ENVIRONMENT_READING",
        entity: "EnvironmentReading",
        entityId: String(reading.id),
        description: `Показания: t=${temperature}°C, h=${humidity}%, зона "${zone.name}"`,
        metadata: { zoneId, temperature, humidity, isWithinLimits },
      });

      return res.json({ reading, alerts: createdAlerts });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * GET /warehouse/environment — Журнал показаний с фильтрами
   */
  async getReadings(req, res, next) {
    try {
      const { EnvironmentReading, StorageZone, User } = require("../../../models/index");

      let { page = 1, limit = 50, zoneId, fromDate, toDate } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const where = {};
      if (zoneId) where.zoneId = zoneId;
      if (fromDate || toDate) {
        where.measuredAt = {};
        if (fromDate) where.measuredAt[Op.gte] = new Date(fromDate);
        if (toDate) where.measuredAt[Op.lte] = new Date(toDate);
      }

      const { rows, count } = await EnvironmentReading.findAndCountAll({
        where,
        limit,
        offset,
        order: [["measuredAt", "DESC"]],
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"], required: false },
          { model: User, as: "measuredBy", attributes: ["id", "name", "surname"], required: false },
        ],
      });

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * GET /warehouse/environment/alerts — Активные (неподтверждённые) алерты
   */
  async getAlerts(req, res, next) {
    try {
      const { EnvironmentAlert, StorageZone, EnvironmentReading } =
        require("../../../models/index");

      const where = { acknowledgedAt: null };
      if (req.query.zoneId) where.zoneId = req.query.zoneId;

      const alerts = await EnvironmentAlert.findAll({
        where,
        order: [["createdAt", "DESC"]],
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"], required: false },
          { model: EnvironmentReading, as: "reading", required: false },
        ],
      });

      return res.json(alerts);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * PUT /warehouse/environment/alerts/:id/acknowledge — Подтверждение алерта
   */
  async acknowledgeAlert(req, res, next) {
    try {
      const { EnvironmentAlert } = require("../../../models/index");
      const { id } = req.params;
      const { actionTaken } = req.body;

      const alert = await EnvironmentAlert.findByPk(id);
      if (!alert) return next(ApiError.notFound("Алерт не найден"));

      alert.acknowledgedById = req.user.id;
      alert.acknowledgedAt = new Date();
      alert.actionTaken = actionTaken || null;
      await alert.save();

      await logAudit({
        req,
        action: "ENVIRONMENT_ALERT_ACK",
        entity: "EnvironmentAlert",
        entityId: String(alert.id),
        description: `Подтверждён алерт ${alert.alertType} для зоны #${alert.zoneId}`,
        metadata: { alertId: alert.id, alertType: alert.alertType, actionTaken },
      });

      return res.json(alert);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  /**
   * GET /warehouse/environment/report — Сводка для экспорта
   */
  async getReport(req, res, next) {
    try {
      const { EnvironmentReading, StorageZone } = require("../../../models/index");

      const { fromDate, toDate } = req.query;
      const where = {};
      if (fromDate || toDate) {
        where.measuredAt = {};
        if (fromDate) where.measuredAt[Op.gte] = new Date(fromDate);
        if (toDate) where.measuredAt[Op.lte] = new Date(toDate);
      }

      const readings = await EnvironmentReading.findAll({
        where,
        order: [["measuredAt", "ASC"]],
        include: [
          { model: StorageZone, as: "zone", attributes: ["id", "name", "type"] },
        ],
      });

      // Группировка по зонам и дням
      const report = {};
      for (const r of readings) {
        const zoneName = r.zone ? r.zone.name : `Zone #${r.zoneId}`;
        const day = r.measuredAt.toISOString().slice(0, 10);

        if (!report[zoneName]) report[zoneName] = {};
        if (!report[zoneName][day]) {
          report[zoneName][day] = {
            readings: [],
            minTemp: null,
            maxTemp: null,
            minHumidity: null,
            maxHumidity: null,
            hasDeviations: false,
          };
        }

        const d = report[zoneName][day];
        d.readings.push(r);
        if (r.temperature != null) {
          d.minTemp = d.minTemp === null ? r.temperature : Math.min(d.minTemp, r.temperature);
          d.maxTemp = d.maxTemp === null ? r.temperature : Math.max(d.maxTemp, r.temperature);
        }
        if (r.humidity != null) {
          d.minHumidity = d.minHumidity === null ? r.humidity : Math.min(d.minHumidity, r.humidity);
          d.maxHumidity = d.maxHumidity === null ? r.humidity : Math.max(d.maxHumidity, r.humidity);
        }
        if (!r.isWithinLimits) d.hasDeviations = true;
      }

      return res.json(report);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new EnvironmentController();

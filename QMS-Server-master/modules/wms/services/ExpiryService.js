const { Op } = require("sequelize");
const { logAudit } = require("../../core/utils/auditLogger");

/**
 * ExpiryService — Контроль сроков годности и FEFO (ISO 13485 §7.5.5, §7.5.9)
 * Ежедневная проверка, алерты, автоматическая блокировка просроченных
 */
class ExpiryService {
  /**
   * Ежедневная проверка сроков годности (вызывается из CRON)
   * 1. Находит коробки с истекающим сроком (90/60/30/7 дней)
   * 2. Создаёт алерты
   * 3. Автоматически блокирует просроченные (expiryDate < today)
   */
  async checkExpiry(req) {
    const { WarehouseBox, ExpiryAlert } = require("../../../models/index");
    const QuarantineService = require("./QuarantineService");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = { expired: [], alerts: [] };

    // 1. Найти и заблокировать просроченные
    const expiredBoxes = await WarehouseBox.findAll({
      where: {
        expiryDate: { [Op.lt]: today },
        status: { [Op.notIn]: ["EXPIRED", "SCRAP", "SHIPPED"] },
        expiryDate: { [Op.ne]: null },
      },
    });

    for (const box of expiredBoxes) {
      try {
        await QuarantineService.autoQuarantine({
          boxId: box.id,
          reason: `Срок годности истёк: ${box.expiryDate}`,
          source: "EXPIRY",
          req,
        });

        // Обновить статус на EXPIRED (поверх QUARANTINE)
        box.status = "EXPIRED";
        await box.save();
        results.expired.push(box.id);
      } catch (e) {
        console.error(`ExpiryService: ошибка при блокировке коробки ${box.id}:`, e.message);
      }
    }

    // 2. Создать алерты для приближающихся сроков
    const alertDays = [90, 60, 30, 7];

    for (const days of alertDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);

      const boxesExpiringSoon = await WarehouseBox.findAll({
        where: {
          expiryDate: {
            [Op.between]: [today, targetDate],
          },
          status: { [Op.notIn]: ["EXPIRED", "SCRAP", "SHIPPED"] },
        },
      });

      for (const box of boxesExpiringSoon) {
        if (!ExpiryAlert) continue;

        const existingAlert = await ExpiryAlert.findOne({
          where: {
            boxId: box.id,
            alertDays: days,
          },
        });

        if (!existingAlert) {
          await ExpiryAlert.create({
            boxId: box.id,
            alertDays: days,
            notifiedAt: new Date(),
            acknowledged: false,
          });
          results.alerts.push({ boxId: box.id, days });
        }
      }
    }

    if (req) {
      await logAudit({
        req,
        action: "EXPIRY_CHECK",
        entity: "WarehouseBox",
        description: `Проверка сроков годности: ${results.expired.length} просрочено, ${results.alerts.length} алертов`,
        metadata: results,
      });
    }

    return results;
  }

  /**
   * FEFO-сортировка: вернуть коробки отсортированные по ближайшему сроку годности
   * First Expired, First Out — приоритет выдачи по ближайшему сроку
   */
  async getBoxesFEFO({ label, originType, originId, limit = 10 }) {
    const { WarehouseBox } = require("../../../models/index");

    const where = {
      status: { [Op.notIn]: ["EXPIRED", "SCRAP", "SHIPPED", "QUARANTINE", "BLOCKED"] },
      expiryDate: { [Op.ne]: null },
    };

    if (label) where.label = label;
    if (originType) where.originType = originType;
    if (originId) where.originId = originId;

    return WarehouseBox.findAll({
      where,
      order: [["expiryDate", "ASC"]],
      limit,
    });
  }
}

module.exports = new ExpiryService();

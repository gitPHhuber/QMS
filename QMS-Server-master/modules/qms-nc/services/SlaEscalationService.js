/**
 * SlaEscalationService.js — Автоэскалация по SLA для NC/CAPA
 *
 * ISO 8.5.2 / 8.5.3: Контроль сроков и уведомления при просрочке.
 *
 * Уровни эскалации:
 *   Level 0: Просрочка < 3 дней  → уведомление ответственному (WARNING)
 *   Level 1: Просрочка 3–6 дней  → уведомление ответственному + владельцу процесса (WARNING)
 *   Level 2: Просрочка ≥ 7 дней  → уведомление руководству (CRITICAL)
 *
 * Вызывается по cron или через API: POST /api/nc/escalation/check
 */

const { Op } = require("sequelize");
const { Nonconformity, Capa, CapaAction, NC_STATUSES, CAPA_STATUSES } = require("../models/NcCapa");
const { Notification } = require("../../core/models/Notification");
const { User, Role } = require("../../../models/index");
const { logAudit, AUDIT_ACTIONS } = require("../../core/utils/auditLogger");

// SLA пороги (дни)
const SLA_THRESHOLDS = {
  LEVEL_0: 0, // сразу при просрочке
  LEVEL_1: 3, // +3 дня — эскалация
  LEVEL_2: 7, // +7 дней — критическая эскалация
};

// Минимальный интервал между повторными уведомлениями (часы)
const NOTIFICATION_COOLDOWN_HOURS = 24;

class SlaEscalationService {
  /**
   * Основной метод: проверяет все просроченные NC/CAPA и создаёт уведомления.
   * @returns {Object} Сводка по созданным уведомлениям
   */
  async checkAndEscalate() {
    const now = new Date();
    const results = {
      overdueNCs: [],
      overdueCAPAs: [],
      overdueActions: [],
      notificationsCreated: 0,
    };

    // 1. Просроченные NC
    const overdueNCs = await Nonconformity.findAll({
      where: {
        status: { [Op.notIn]: [NC_STATUSES.CLOSED] },
        dueDate: { [Op.lt]: now, [Op.ne]: null },
      },
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: User, as: "reportedBy", attributes: ["id", "name", "surname"] },
      ],
    });

    for (const nc of overdueNCs) {
      const overdueDays = this._daysDiff(nc.dueDate, now);
      const level = this._getEscalationLevel(overdueDays);
      const created = await this._escalateNC(nc, overdueDays, level);
      results.overdueNCs.push({
        id: nc.id,
        number: nc.number,
        overdueDays,
        level,
        notified: created,
      });
      results.notificationsCreated += created;
    }

    // 2. Просроченные CAPA
    const overdueCAPAs = await Capa.findAll({
      where: {
        status: { [Op.notIn]: [CAPA_STATUSES.CLOSED, CAPA_STATUSES.EFFECTIVE] },
        dueDate: { [Op.lt]: now, [Op.ne]: null },
      },
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: User, as: "initiatedBy", attributes: ["id", "name", "surname"] },
        { model: Nonconformity, as: "nonconformity", attributes: ["id", "number"] },
      ],
    });

    for (const capa of overdueCAPAs) {
      const overdueDays = this._daysDiff(capa.dueDate, now);
      const level = this._getEscalationLevel(overdueDays);
      const created = await this._escalateCAPA(capa, overdueDays, level);
      results.overdueCAPAs.push({
        id: capa.id,
        number: capa.number,
        overdueDays,
        level,
        notified: created,
      });
      results.notificationsCreated += created;
    }

    // 3. Просроченные действия CAPA
    const overdueActions = await CapaAction.findAll({
      where: {
        status: { [Op.notIn]: ["COMPLETED", "CANCELLED"] },
        dueDate: { [Op.lt]: now, [Op.ne]: null },
      },
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: Capa, as: "capa", attributes: ["id", "number"] },
      ],
    });

    for (const action of overdueActions) {
      const overdueDays = this._daysDiff(action.dueDate, now);
      const level = this._getEscalationLevel(overdueDays);
      const created = await this._escalateCapaAction(action, overdueDays, level);
      results.overdueActions.push({
        id: action.id,
        capaNumber: action.capa?.number,
        overdueDays,
        level,
        notified: created,
      });
      results.notificationsCreated += created;
    }

    // Логируем результат в аудит
    if (results.notificationsCreated > 0) {
      await logAudit({
        action: AUDIT_ACTIONS.SYSTEM_EVENT,
        description: `SLA-эскалация: создано ${results.notificationsCreated} уведомлений (NC: ${results.overdueNCs.length}, CAPA: ${results.overdueCAPAs.length}, Actions: ${results.overdueActions.length})`,
        metadata: {
          overdueNCs: results.overdueNCs.length,
          overdueCAPAs: results.overdueCAPAs.length,
          overdueActions: results.overdueActions.length,
          notificationsCreated: results.notificationsCreated,
        },
      });
    }

    return results;
  }

  /**
   * Получить все просроченные элементы с информацией об эскалации.
   */
  async getOverdueItems() {
    const now = new Date();

    const [overdueNCs, overdueCAPAs, overdueActions] = await Promise.all([
      Nonconformity.findAll({
        where: {
          status: { [Op.notIn]: [NC_STATUSES.CLOSED] },
          dueDate: { [Op.lt]: now, [Op.ne]: null },
        },
        include: [
          { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        ],
        order: [["dueDate", "ASC"]],
      }),
      Capa.findAll({
        where: {
          status: { [Op.notIn]: [CAPA_STATUSES.CLOSED, CAPA_STATUSES.EFFECTIVE] },
          dueDate: { [Op.lt]: now, [Op.ne]: null },
        },
        include: [
          { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
          { model: Nonconformity, as: "nonconformity", attributes: ["id", "number"] },
        ],
        order: [["dueDate", "ASC"]],
      }),
      CapaAction.findAll({
        where: {
          status: { [Op.notIn]: ["COMPLETED", "CANCELLED"] },
          dueDate: { [Op.lt]: now, [Op.ne]: null },
        },
        include: [
          { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
          { model: Capa, as: "capa", attributes: ["id", "number"] },
        ],
        order: [["dueDate", "ASC"]],
      }),
    ]);

    return {
      overdueNCs: overdueNCs.map(nc => ({
        ...nc.toJSON(),
        overdueDays: this._daysDiff(nc.dueDate, now),
        escalationLevel: this._getEscalationLevel(this._daysDiff(nc.dueDate, now)),
      })),
      overdueCAPAs: overdueCAPAs.map(capa => ({
        ...capa.toJSON(),
        overdueDays: this._daysDiff(capa.dueDate, now),
        escalationLevel: this._getEscalationLevel(this._daysDiff(capa.dueDate, now)),
      })),
      overdueActions: overdueActions.map(a => ({
        ...a.toJSON(),
        overdueDays: this._daysDiff(a.dueDate, now),
        escalationLevel: this._getEscalationLevel(this._daysDiff(a.dueDate, now)),
      })),
    };
  }

  // ═══ PRIVATE ═══

  _daysDiff(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }

  _getEscalationLevel(overdueDays) {
    if (overdueDays >= SLA_THRESHOLDS.LEVEL_2) return 2;
    if (overdueDays >= SLA_THRESHOLDS.LEVEL_1) return 1;
    return 0;
  }

  async _escalateNC(nc, overdueDays, level) {
    let created = 0;
    const severity = level >= 2 ? "CRITICAL" : "WARNING";
    const type = level >= 1 ? "NC_ESCALATED" : "NC_OVERDUE";

    // Уведомление ответственному
    if (nc.assignedToId) {
      const sent = await this._createNotificationIfNew({
        userId: nc.assignedToId,
        type,
        title: `NC ${nc.number} просрочена (${overdueDays} дн.)`,
        message: `Несоответствие "${nc.title}" просрочено на ${overdueDays} дней. Срок: ${nc.dueDate}. Уровень эскалации: ${level}.`,
        severity,
        entityType: "nc",
        entityId: nc.id,
        link: `/qms/nc/${nc.id}`,
      });
      if (sent) created++;
    }

    // Level 1+: уведомить того, кто создал NC
    if (level >= 1 && nc.reportedById && nc.reportedById !== nc.assignedToId) {
      const sent = await this._createNotificationIfNew({
        userId: nc.reportedById,
        type,
        title: `[Эскалация] NC ${nc.number} просрочена (${overdueDays} дн.)`,
        message: `Несоответствие "${nc.title}" просрочено на ${overdueDays} дней и требует внимания.`,
        severity,
        entityType: "nc",
        entityId: nc.id,
        link: `/qms/nc/${nc.id}`,
      });
      if (sent) created++;
    }

    // Level 2: уведомить руководство (QMS_DIRECTOR)
    if (level >= 2) {
      created += await this._notifyRole("QMS_DIRECTOR", {
        type: "NC_ESCALATED",
        title: `[КРИТИЧНО] NC ${nc.number} просрочена ${overdueDays} дней`,
        message: `Несоответствие "${nc.title}" критически просрочено (${overdueDays} дн.). Требуется немедленное вмешательство руководства.`,
        severity: "CRITICAL",
        entityType: "nc",
        entityId: nc.id,
        link: `/qms/nc/${nc.id}`,
      });
    }

    return created;
  }

  async _escalateCAPA(capa, overdueDays, level) {
    let created = 0;
    const severity = level >= 2 ? "CRITICAL" : "WARNING";
    const type = level >= 1 ? "CAPA_ESCALATED" : "CAPA_OVERDUE";

    // Уведомление ответственному
    if (capa.assignedToId) {
      const sent = await this._createNotificationIfNew({
        userId: capa.assignedToId,
        type,
        title: `CAPA ${capa.number} просрочена (${overdueDays} дн.)`,
        message: `Корректирующее действие "${capa.title}" просрочено на ${overdueDays} дней. Срок: ${capa.dueDate}. Уровень эскалации: ${level}.`,
        severity,
        entityType: "capa",
        entityId: capa.id,
        link: `/qms/capa/${capa.id}`,
      });
      if (sent) created++;
    }

    // Level 1+: уведомить инициатора
    if (level >= 1 && capa.initiatedById && capa.initiatedById !== capa.assignedToId) {
      const sent = await this._createNotificationIfNew({
        userId: capa.initiatedById,
        type,
        title: `[Эскалация] CAPA ${capa.number} просрочена (${overdueDays} дн.)`,
        message: `CAPA "${capa.title}" просрочена на ${overdueDays} дней и требует внимания.`,
        severity,
        entityType: "capa",
        entityId: capa.id,
        link: `/qms/capa/${capa.id}`,
      });
      if (sent) created++;
    }

    // Level 2: уведомить руководство
    if (level >= 2) {
      created += await this._notifyRole("QMS_DIRECTOR", {
        type: "CAPA_ESCALATED",
        title: `[КРИТИЧНО] CAPA ${capa.number} просрочена ${overdueDays} дней`,
        message: `CAPA "${capa.title}" критически просрочена (${overdueDays} дн.). Требуется немедленное вмешательство руководства.`,
        severity: "CRITICAL",
        entityType: "capa",
        entityId: capa.id,
        link: `/qms/capa/${capa.id}`,
      });
    }

    return created;
  }

  async _escalateCapaAction(action, overdueDays, level) {
    let created = 0;

    if (action.assignedToId) {
      const sent = await this._createNotificationIfNew({
        userId: action.assignedToId,
        type: "CAPA_ACTION_OVERDUE",
        title: `Действие CAPA ${action.capa?.number || ""} просрочено (${overdueDays} дн.)`,
        message: `Действие "${action.description?.substring(0, 100)}" просрочено на ${overdueDays} дней.`,
        severity: level >= 2 ? "CRITICAL" : "WARNING",
        entityType: "capa_action",
        entityId: action.id,
        link: `/qms/capa/${action.capaId}`,
      });
      if (sent) created++;
    }

    return created;
  }

  /**
   * Уведомить всех пользователей с определённой ролью.
   * Возвращает количество созданных уведомлений.
   */
  async _notifyRole(roleCode, notificationData) {
    let created = 0;
    try {
      const role = await Role.findOne({ where: { code: roleCode } });
      if (!role) return 0;

      const users = await role.getUsers({ attributes: ["id"] });
      for (const user of users) {
        const sent = await this._createNotificationIfNew({
          ...notificationData,
          userId: user.id,
        });
        if (sent) created++;
      }
    } catch (e) {
      console.error(`[SlaEscalation] Ошибка уведомления роли ${roleCode}:`, e.message);
    }
    return created;
  }

  /**
   * Создаёт уведомление если нет аналогичного за последние N часов.
   * Предотвращает спам при частом запуске проверки.
   */
  async _createNotificationIfNew({ userId, type, title, message, severity, entityType, entityId, link }) {
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() - NOTIFICATION_COOLDOWN_HOURS);

    // Проверяем нет ли аналогичного уведомления за период cooldown
    const existing = await Notification.count({
      where: {
        userId,
        type,
        entityType,
        entityId,
        createdAt: { [Op.gte]: cooldownDate },
      },
    });

    if (existing > 0) return false;

    await Notification.create({ userId, type, title, message, severity, entityType, entityId, link });
    return true;
  }
}

module.exports = new SlaEscalationService();

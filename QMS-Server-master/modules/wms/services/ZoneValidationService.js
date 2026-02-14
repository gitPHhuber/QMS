const ApiError = require("../../../error/ApiError");

/**
 * ZoneValidationService — Валидация переходов между складскими зонами
 * ISO 13485 §7.5.5: продукция может перемещаться только по разрешённым маршрутам
 */
class ZoneValidationService {
  /**
   * Проверить допустимость перехода из одной зоны в другую
   * @param {object} params
   * @param {object} params.fromZone - Зона-источник (StorageZone instance)
   * @param {object} params.toZone - Зона-назначение (StorageZone instance)
   * @param {object} params.user - Текущий пользователь (req.user)
   * @param {object} [params.transaction] - Sequelize transaction
   * @returns {Promise<{allowed: boolean, reason?: string}>}
   */
  async validateTransition({ fromZone, toZone, user, transaction }) {
    const { ZoneTransitionRule } = require("../../../models/index");

    if (!fromZone || !toZone) {
      return { allowed: true };
    }

    if (fromZone.id === toZone.id) {
      return { allowed: true };
    }

    const rule = await ZoneTransitionRule.findOne({
      where: {
        fromZoneType: fromZone.type,
        toZoneType: toZone.type,
        isActive: true,
      },
      transaction,
    });

    if (!rule) {
      return {
        allowed: false,
        reason: `Переход из зоны "${fromZone.name}" (${fromZone.type}) в зону "${toZone.name}" (${toZone.type}) не разрешён`,
      };
    }

    if (rule.requiresApproval && rule.requiredRole) {
      const hasRole = await this._checkUserAbility(user, rule.requiredRole);
      if (!hasRole) {
        return {
          allowed: false,
          reason: `Переход требует роль "${rule.requiredRole}". У пользователя нет необходимых полномочий`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Проверить что коробка с данным статусом может быть перемещена в целевую зону
   * Карантинные/заблокированные коробки не могут попасть в MAIN/FINISHED_GOODS/SHIPPING
   */
  validateBoxStatusForZone(boxStatus, toZoneType) {
    const blockedStatuses = ["QUARANTINE", "BLOCKED", "HOLD", "EXPIRED"];
    const restrictedZones = ["MAIN", "FINISHED_GOODS", "SHIPPING"];

    if (blockedStatuses.includes(boxStatus) && restrictedZones.includes(toZoneType)) {
      return {
        allowed: false,
        reason: `Коробка со статусом "${boxStatus}" не может быть перемещена в зону типа "${toZoneType}"`,
      };
    }

    return { allowed: true };
  }

  /**
   * Проверить ability пользователя (lazy-loaded через RBAC)
   */
  async _checkUserAbility(user, abilityCode) {
    if (!user || !user.id) return false;

    try {
      const { RoleAbility, UserRole } = require("../../../models/index");
      if (!RoleAbility || !UserRole) return true; // RBAC не подключён → разрешаем

      const userRoles = await UserRole.findAll({
        where: { userId: user.id },
        attributes: ["roleId"],
      });

      if (!userRoles.length) return false;

      const roleIds = userRoles.map((ur) => ur.roleId);
      const ability = await RoleAbility.findOne({
        where: {
          roleId: roleIds,
          abilityCode: abilityCode,
        },
      });

      return !!ability;
    } catch {
      return true; // если RBAC модуль недоступен → разрешаем
    }
  }
}

module.exports = new ZoneValidationService();

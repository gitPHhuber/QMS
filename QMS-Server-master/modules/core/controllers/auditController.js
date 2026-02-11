/**
 * auditController.js — Расширенный контроллер аудита с верификацией
 * 
 * ЗАМЕНА: controllers/auditController.js
 * 
 * Добавлено:
 *   - GET /audit/verify       — быстрая проверка (последние 100 записей)
 *   - GET /audit/verify/full  — полная проверка всей цепочки
 *   - GET /audit/report       — отчёт для инспекции (ISO 13485)
 *   - GET /audit/stats        — статистика по severity/entity/period
 *   - GET /audit/:id          — детали одной записи с chain-контекстом
 * 
 * Существующий endpoint GET /audit/ — без изменений (обратная совместимость).
 */

const { AuditLog, User } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");
const { Op } = require("sequelize");
const { verifyChain, quickVerify, generateInspectionReport } = require("../utils/auditVerifier");

class AuditController {
  /**
   * GET /audit/
   * Получение логов с пагинацией и фильтрами.
   * 100% обратная совместимость со старым API.
   */
  async getLogs(req, res, next) {
    try {
      let { page, limit, action, entity, userId, dateFrom, dateTo, severity, search } = req.query;

      page = Number(page) || 1;
      limit = Math.min(Number(limit) || 50, 200);
      const offset = page * limit - limit;

      const where = {};

      if (action) {
        where.action = { [Op.like]: `%${action}%` };
      }

      if (entity) {
        where.entity = entity;
      }

      if (userId) {
        const parsedUserId = Number(userId);
        if (!Number.isNaN(parsedUserId)) {
          where.userId = parsedUserId;
        }
      }

      // Новый фильтр: severity
      if (severity) {
        where.severity = severity;
      }

      // Новый фильтр: полнотекстовый поиск по description
      if (search) {
        where.description = { [Op.iLike]: `%${search}%` };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) {
          const to = new Date(dateTo);
          to.setDate(to.getDate() + 1);
          where.createdAt[Op.lt] = to;
        }
      }

      const logs = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "login", "name", "surname"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return res.json(logs);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  /**
   * GET /audit/:id
   * Детали одной записи с контекстом цепочки (предыдущая/следующая).
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const record = await AuditLog.findByPk(id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "login", "name", "surname"],
            required: false,
          },
        ],
      });

      if (!record) {
        return next(ApiError.notFound("Запись аудита не найдена"));
      }

      // Получаем chain-контекст
      let chainContext = null;
      if (record.chainIndex) {
        const [prev, next_] = await Promise.all([
          AuditLog.findOne({
            where: { chainIndex: Number(record.chainIndex) - 1 },
            attributes: ["id", "chainIndex", "currentHash", "action", "createdAt"],
            raw: true,
          }),
          AuditLog.findOne({
            where: { chainIndex: Number(record.chainIndex) + 1 },
            attributes: ["id", "chainIndex", "prevHash", "action", "createdAt"],
            raw: true,
          }),
        ]);

        // Проверяем linkage
        const prevLinkValid = prev
          ? prev.currentHash === record.prevHash
          : record.prevHash === "0".repeat(64);

        const nextLinkValid = next_
          ? next_.prevHash === record.currentHash
          : true; // нет следующей — ОК

        chainContext = {
          previous: prev,
          next: next_,
          prevLinkValid,
          nextLinkValid,
          chainValid: prevLinkValid && nextLinkValid,
        };
      }

      return res.json({
        ...record.toJSON(),
        chainContext,
      });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  /**
   * GET /audit/verify
   * Быстрая проверка целостности (последние 100 записей).
   * Для dashboard-виджета и мониторинга.
   */
  async quickVerify(req, res, next) {
    try {
      const count = Math.min(Number(req.query.count) || 100, 1000);
      const report = await quickVerify(count);
      return res.json(report);
    } catch (e) {
      next(ApiError.internal(`Ошибка верификации: ${e.message}`));
    }
  }

  /**
   * GET /audit/verify/full
   * Полная верификация всей цепочки. Может занять время.
   * Доступ: только уполномоченный по качеству (qms.audit.verify).
   */
  async fullVerify(req, res, next) {
    try {
      const { fromIndex, toIndex } = req.query;
      const report = await verifyChain({
        fromIndex: fromIndex ? Number(fromIndex) : undefined,
        toIndex: toIndex ? Number(toIndex) : undefined,
      });
      return res.json(report);
    } catch (e) {
      next(ApiError.internal(`Ошибка полной верификации: ${e.message}`));
    }
  }

  /**
   * GET /audit/report
   * Отчёт для инспекции по ISO 13485.
   * Включает: целостность цепочки, статистику severity, помесячную активность.
   */
  async inspectionReport(req, res, next) {
    try {
      const report = await generateInspectionReport();
      return res.json(report);
    } catch (e) {
      next(ApiError.internal(`Ошибка генерации отчёта: ${e.message}`));
    }
  }

  /**
   * GET /audit/stats
   * Агрегированная статистика для дашборда.
   */
  async getStats(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

      const [bySeverity, byEntity, byAction, total, chainedTotal] = await Promise.all([
        // По severity
        AuditLog.findAll({
          attributes: ["severity", [require("sequelize").fn("COUNT", "*"), "count"]],
          where: { createdAt: { [Op.gte]: since } },
          group: ["severity"],
          raw: true,
        }),
        // По entity (топ-10)
        AuditLog.findAll({
          attributes: ["entity", [require("sequelize").fn("COUNT", "*"), "count"]],
          where: { createdAt: { [Op.gte]: since }, entity: { [Op.ne]: null } },
          group: ["entity"],
          order: [[require("sequelize").fn("COUNT", "*"), "DESC"]],
          limit: 10,
          raw: true,
        }),
        // По action (топ-10)
        AuditLog.findAll({
          attributes: ["action", [require("sequelize").fn("COUNT", "*"), "count"]],
          where: { createdAt: { [Op.gte]: since } },
          group: ["action"],
          order: [[require("sequelize").fn("COUNT", "*"), "DESC"]],
          limit: 10,
          raw: true,
        }),
        // Всего записей
        AuditLog.count({ where: { createdAt: { [Op.gte]: since } } }),
        // Записей с hash-chain
        AuditLog.count({
          where: {
            createdAt: { [Op.gte]: since },
            chainIndex: { [Op.ne]: null },
          },
        }),
      ]);

      return res.json({
        period: { days: Number(days), since: since.toISOString() },
        total,
        chainedTotal,
        chainCoverage: total > 0 ? Math.round((chainedTotal / total) * 100) : 0,
        bySeverity,
        byEntity,
        byAction,
      });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new AuditController();

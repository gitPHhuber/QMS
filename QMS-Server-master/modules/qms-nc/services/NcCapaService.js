/**
 * NcCapaService.js — Бизнес-логика NC и CAPA
 * НОВЫЙ ФАЙЛ: services/NcCapaService.js
 */

const { Op } = require("sequelize");
const sequelize = require("../../../db");
const {
  Nonconformity, NcAttachment, Capa, CapaAction, CapaVerification,
  NC_STATUSES, CAPA_STATUSES,
} = require("../models/NcCapa");
const { User } = require("../../../models/index");
const { logNonconformity, logCapa } = require("../../core/utils/auditLogger");

class NcCapaService {
  // ═══ NONCONFORMITY ═══

  async createNC(req, data) {
    const t = await sequelize.transaction();
    try {
      const lastNc = await Nonconformity.findOne({ order: [["id", "DESC"]], attributes: ["id"], transaction: t });
      const num = (lastNc?.id || 0) + 1;
      const number = `NC-${String(num).padStart(4, "0")}`;

      // CRITICAL автоматически требует CAPA
      const capaRequired = data.classification === "CRITICAL" ? true : (data.capaRequired || false);

      const nc = await Nonconformity.create({
        ...data,
        number,
        status: NC_STATUSES.OPEN,
        reportedById: req.user.id,
        detectedAt: data.detectedAt || new Date(),
        capaRequired,
      }, { transaction: t });

      await t.commit();
      await logNonconformity(req, nc, "create");
      return nc;
    } catch (e) { await t.rollback(); throw e; }
  }

  async updateNC(req, id, data) {
    const nc = await Nonconformity.findByPk(id);
    if (!nc) throw new Error("NC не найдена");
    if (nc.status === NC_STATUSES.CLOSED) throw new Error("Нельзя редактировать закрытую NC");

    const oldStatus = nc.status;
    await nc.update(data);

    if (data.status && data.status !== oldStatus) {
      const actionMap = {
        INVESTIGATING: "investigate",
        DISPOSITION: "disposition",
        CLOSED: "close",
        REOPENED: "reopen",
      };
      await logNonconformity(req, nc, actionMap[data.status] || "update");
    } else {
      await logNonconformity(req, nc, "update");
    }

    return nc;
  }

  async closeNC(req, id, { closingComment }) {
    const t = await sequelize.transaction();
    try {
      const nc = await Nonconformity.findByPk(id, { transaction: t });
      if (!nc) throw new Error("NC не найдена");

      // Проверяем что CAPA закрыты
      if (nc.capaRequired) {
        const openCapas = await Capa.count({
          where: { nonconformityId: id, status: { [Op.notIn]: ["CLOSED", "EFFECTIVE"] } },
          transaction: t,
        });
        if (openCapas > 0) throw new Error(`Невозможно закрыть: ${openCapas} CAPA ещё не завершены`);
      }

      await nc.update({
        status: NC_STATUSES.CLOSED,
        closedById: req.user.id,
        closedAt: new Date(),
      }, { transaction: t });

      await t.commit();
      await logNonconformity(req, nc, "close", { closingComment });
      return nc;
    } catch (e) { await t.rollback(); throw e; }
  }

  async getNCList({ page = 1, limit = 20, status, source, classification, assignedToId, search, dateFrom, dateTo }) {
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (classification) where.classification = classification;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where[Op.or] = [
        { number: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (dateFrom || dateTo) {
      where.detectedAt = {};
      if (dateFrom) where.detectedAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.detectedAt[Op.lte] = new Date(dateTo);
    }

    return Nonconformity.findAndCountAll({
      where,
      include: [
        { model: User, as: "reportedBy", attributes: ["id", "name", "surname"] },
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
      ],
      order: [["detectedAt", "DESC"]],
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
    });
  }

  async getNCDetail(id) {
    return Nonconformity.findByPk(id, {
      include: [
        { model: User, as: "reportedBy", attributes: ["id", "name", "surname"] },
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: User, as: "closedBy", attributes: ["id", "name", "surname"] },
        { model: NcAttachment, as: "attachments", include: [{ model: User, as: "uploadedBy", attributes: ["id", "name", "surname"] }] },
        {
          model: Capa, as: "capas",
          attributes: ["id", "number", "type", "status", "title", "dueDate"],
          include: [{ model: User, as: "assignedTo", attributes: ["id", "name", "surname"] }],
        },
      ],
    });
  }

  // ═══ CAPA ═══

  async createCAPA(req, data) {
    const t = await sequelize.transaction();
    try {
      const lastCapa = await Capa.findOne({ order: [["id", "DESC"]], attributes: ["id"], transaction: t });
      const num = (lastCapa?.id || 0) + 1;
      const number = `CAPA-${String(num).padStart(4, "0")}`;

      // Рассчитываем дату проверки эффективности
      let effectivenessCheckDate = null;
      const checkDays = data.effectivenessCheckDays || 90;
      if (data.dueDate) {
        const d = new Date(data.dueDate);
        d.setDate(d.getDate() + checkDays);
        effectivenessCheckDate = d;
      }

      const capa = await Capa.create({
        ...data,
        number,
        status: CAPA_STATUSES.INITIATED,
        initiatedById: req.user.id,
        effectivenessCheckDate,
        effectivenessCheckDays: checkDays,
      }, { transaction: t });

      // Создаём actions если переданы
      if (data.actions?.length) {
        for (let i = 0; i < data.actions.length; i++) {
          await CapaAction.create({
            capaId: capa.id,
            order: i + 1,
            ...data.actions[i],
          }, { transaction: t });
        }
      }

      await t.commit();
      await logCapa(req, capa, "create");
      return capa;
    } catch (e) { await t.rollback(); throw e; }
  }

  async updateCAPAStatus(req, id, { status, comment }) {
    const capa = await Capa.findByPk(id);
    if (!capa) throw new Error("CAPA не найдена");

    const updates = { status };
    const actionMap = {
      PLAN_APPROVED: "planApprove",
      IMPLEMENTING: "implement",
      VERIFYING: "verify",
      CLOSED: "close",
    };

    if (status === "PLAN_APPROVED") {
      updates.approvedById = req.user.id;
      updates.planApprovedAt = new Date();
    } else if (status === "IMPLEMENTING") {
      updates.implementedAt = new Date();
    } else if (status === "CLOSED") {
      updates.closedAt = new Date();
    }

    await capa.update(updates);
    await logCapa(req, capa, actionMap[status] || "update", { comment });
    return capa;
  }

  async addCapaAction(req, capaId, data) {
    const capa = await Capa.findByPk(capaId);
    if (!capa) throw new Error("CAPA не найдена");

    const maxOrder = await CapaAction.max("order", { where: { capaId } }) || 0;
    return CapaAction.create({ capaId, order: maxOrder + 1, ...data });
  }

  async updateCapaAction(req, actionId, data) {
    const action = await CapaAction.findByPk(actionId);
    if (!action) throw new Error("Действие не найдено");
    if (data.status === "COMPLETED") data.completedAt = new Date();
    return action.update(data);
  }

  async verifyCapaEffectiveness(req, capaId, { isEffective, evidence, comment }) {
    const t = await sequelize.transaction();
    try {
      const capa = await Capa.findByPk(capaId, { transaction: t });
      if (!capa) throw new Error("CAPA не найдена");

      const verification = await CapaVerification.create({
        capaId,
        verifiedById: req.user.id,
        isEffective,
        evidence,
        comment,
      }, { transaction: t });

      await capa.update({
        status: isEffective ? CAPA_STATUSES.EFFECTIVE : CAPA_STATUSES.INEFFECTIVE,
      }, { transaction: t });

      await t.commit();
      await logCapa(req, capa, "effectivenessCheck", { isEffective });
      return verification;
    } catch (e) { await t.rollback(); throw e; }
  }

  async getCAPAList({ page = 1, limit = 20, status, type, priority, assignedToId, search }) {
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where[Op.or] = [
        { number: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return Capa.findAndCountAll({
      where,
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: User, as: "initiatedBy", attributes: ["id", "name", "surname"] },
        { model: Nonconformity, as: "nonconformity", attributes: ["id", "number", "title", "classification"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
    });
  }

  async getCAPADetail(id) {
    return Capa.findByPk(id, {
      include: [
        { model: User, as: "initiatedBy", attributes: ["id", "name", "surname"] },
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
        { model: User, as: "approvedBy", attributes: ["id", "name", "surname"] },
        { model: Nonconformity, as: "nonconformity" },
        {
          model: CapaAction, as: "actions", order: [["order", "ASC"]],
          include: [{ model: User, as: "assignedTo", attributes: ["id", "name", "surname"] }],
        },
        {
          model: CapaVerification, as: "verifications", order: [["verifiedAt", "DESC"]],
          include: [{ model: User, as: "verifiedBy", attributes: ["id", "name", "surname"] }],
        },
      ],
    });
  }

  // ═══ STATISTICS ═══

  async getStats() {
    const [ncByStatus, ncBySource, ncByClassification, capaByStatus, capaByType, overdueNc, overdueCapa] = await Promise.all([
      Nonconformity.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      Nonconformity.findAll({ attributes: ["source", [sequelize.fn("COUNT", "*"), "count"]], group: ["source"], raw: true }),
      Nonconformity.findAll({ attributes: ["classification", [sequelize.fn("COUNT", "*"), "count"]], group: ["classification"], raw: true }),
      Capa.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      Capa.findAll({ attributes: ["type", [sequelize.fn("COUNT", "*"), "count"]], group: ["type"], raw: true }),
      Nonconformity.count({ where: { status: { [Op.notIn]: ["CLOSED"] }, dueDate: { [Op.lt]: new Date() } } }),
      Capa.count({ where: { status: { [Op.notIn]: ["CLOSED", "EFFECTIVE"] }, dueDate: { [Op.lt]: new Date() } } }),
    ]);

    return { ncByStatus, ncBySource, ncByClassification, capaByStatus, capaByType, overdueNc, overdueCapa };
  }
}

module.exports = new NcCapaService();

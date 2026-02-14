const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");

class InspectionController {
  async createInspection(req, res, next) {
    try {
      const { IncomingInspection, InspectionChecklistItem, InspectionTemplate, Supply } =
        require("../../../models/index");

      const { supplyId, templateId, notes } = req.body;

      if (!supplyId) {
        return next(ApiError.badRequest("Не указан supplyId"));
      }

      const supply = await Supply.findByPk(supplyId);
      if (!supply) return next(ApiError.notFound("Поставка не найдена"));

      const inspection = await IncomingInspection.create({
        supplyId,
        inspectorId: req.user.id,
        date: new Date(),
        status: "IN_PROGRESS",
        notes: notes || null,
      });

      // Если указан шаблон — предзаполнить чек-лист
      if (templateId) {
        const template = await InspectionTemplate.findByPk(templateId);
        if (template && Array.isArray(template.items)) {
          const items = template.items.map((item, idx) => ({
            inspectionId: inspection.id,
            checkItem: item.checkItem || item.name,
            result: null,
            sortOrder: idx,
          }));
          await InspectionChecklistItem.bulkCreate(items);
        }
      }

      // Перезагрузить с чек-листом
      const full = await IncomingInspection.findByPk(inspection.id, {
        include: [
          { model: InspectionChecklistItem, as: "checklistItems" },
          { model: Supply, as: "supply" },
        ],
      });

      await logAudit({
        req,
        action: "INSPECTION_CREATE",
        entity: "IncomingInspection",
        entityId: String(inspection.id),
        description: `Создан протокол входного контроля для поставки #${supplyId}`,
        metadata: { supplyId, templateId },
      });

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getInspections(req, res, next) {
    try {
      const { IncomingInspection, InspectionChecklistItem, Supply, User } =
        require("../../../models/index");

      let { page = 1, limit = 50, supplyId, status, fromDate, toDate } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const where = {};
      if (supplyId) where.supplyId = supplyId;
      if (status) where.status = status;
      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) where.date[Op.gte] = fromDate;
        if (toDate) where.date[Op.lte] = toDate;
      }

      const { rows, count } = await IncomingInspection.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date", "DESC"]],
        include: [
          { model: Supply, as: "supply" },
          { model: User, as: "inspector", attributes: ["id", "name", "surname"] },
          { model: InspectionChecklistItem, as: "checklistItems" },
        ],
      });

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateInspection(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { IncomingInspection, InspectionChecklistItem } = require("../../../models/index");
      const { id } = req.params;
      const { status, overallResult, notes, checklistItems } = req.body;

      const inspection = await IncomingInspection.findByPk(id, { transaction: t });
      if (!inspection) {
        await t.rollback();
        return next(ApiError.notFound("Протокол ВК не найден"));
      }

      if (status !== undefined) inspection.status = status;
      if (overallResult !== undefined) inspection.overallResult = overallResult;
      if (notes !== undefined) inspection.notes = notes;
      await inspection.save({ transaction: t });

      // Обновить пункты чек-листа
      if (Array.isArray(checklistItems)) {
        for (const item of checklistItems) {
          if (item.id) {
            await InspectionChecklistItem.update(
              {
                result: item.result,
                value: item.value,
                comment: item.comment,
                photoUrl: item.photoUrl,
              },
              { where: { id: item.id }, transaction: t }
            );
          } else {
            await InspectionChecklistItem.create(
              {
                inspectionId: inspection.id,
                checkItem: item.checkItem,
                result: item.result || null,
                value: item.value || null,
                comment: item.comment || null,
                photoUrl: item.photoUrl || null,
                sortOrder: item.sortOrder || 0,
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();

      const full = await IncomingInspection.findByPk(id, {
        include: [{ model: InspectionChecklistItem, as: "checklistItems" }],
      });

      return res.json(full);
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async completeInspection(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { IncomingInspection, InspectionChecklistItem, WarehouseBox, StorageZone, Supply } =
        require("../../../models/index");
      const QuarantineService = require("../services/QuarantineService");

      const { id } = req.params;
      const { status, overallResult } = req.body;

      if (!["PASSED", "FAILED", "CONDITIONAL"].includes(status)) {
        await t.rollback();
        return next(ApiError.badRequest("Допустимые статусы: PASSED, FAILED, CONDITIONAL"));
      }

      const inspection = await IncomingInspection.findByPk(id, {
        include: [{ model: Supply, as: "supply" }],
        transaction: t,
      });
      if (!inspection) {
        await t.rollback();
        return next(ApiError.notFound("Протокол ВК не найден"));
      }

      inspection.status = status;
      inspection.overallResult = overallResult || null;
      await inspection.save({ transaction: t });

      // Найти все коробки этой поставки
      const boxes = await WarehouseBox.findAll({
        where: { supplyId: inspection.supplyId },
        transaction: t,
      });

      if (status === "PASSED") {
        // Переместить в зону MAIN
        const mainZone = await StorageZone.findOne({
          where: { type: "MAIN", isActive: true },
          transaction: t,
        });

        for (const box of boxes) {
          box.status = "ON_STOCK";
          if (mainZone) box.currentZoneId = mainZone.id;
          await box.save({ transaction: t });
        }
      } else if (status === "FAILED") {
        // Автоматический карантин всех коробок поставки
        for (const box of boxes) {
          await QuarantineService.autoQuarantine({
            boxId: box.id,
            reason: `Входной контроль FAILED: ${overallResult || "не соответствует"}`,
            source: "INCOMING_INSPECTION",
            req,
            transaction: t,
          });
        }
      } else if (status === "CONDITIONAL") {
        // В карантин с пометкой — ожидает решения
        const quarantineZone = await StorageZone.findOne({
          where: { type: "QUARANTINE", isActive: true },
          transaction: t,
        });

        for (const box of boxes) {
          box.status = "QUARANTINE";
          if (quarantineZone) box.currentZoneId = quarantineZone.id;
          await box.save({ transaction: t });
        }
      }

      // Попытка обновить скоринг поставщика (lazy-loaded)
      try {
        const { SupplierEvaluation } = require("../../qms-supplier/models/Supplier");
        if (SupplierEvaluation && inspection.supply && inspection.supply.supplier) {
          // Создать оценку поставщика по результатам ВК
          await SupplierEvaluation.create(
            {
              supplierId: inspection.supply.supplierId || null,
              evaluatorId: req.user.id,
              period: new Date().toISOString().slice(0, 7),
              qualityScore: status === "PASSED" ? 100 : status === "CONDITIONAL" ? 50 : 0,
              notes: `Результат ВК #${inspection.id}: ${status}`,
            },
            { transaction: t }
          );
        }
      } catch {
        // Модуль поставщиков недоступен — пропускаем
      }

      await logAudit({
        req,
        action: status === "FAILED" ? "INSPECTION_FAIL" : "INSPECTION_COMPLETE",
        entity: "IncomingInspection",
        entityId: String(inspection.id),
        description: `Входной контроль завершён: ${status}. Поставка #${inspection.supplyId}, коробок: ${boxes.length}`,
        metadata: {
          inspectionId: inspection.id,
          supplyId: inspection.supplyId,
          status,
          boxCount: boxes.length,
        },
      });

      await t.commit();
      return res.json({ inspection, boxesUpdated: boxes.length });
    } catch (e) {
      await t.rollback();
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getTemplates(req, res, next) {
    try {
      const { InspectionTemplate } = require("../../../models/index");

      const templates = await InspectionTemplate.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]],
      });

      return res.json(templates);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createTemplate(req, res, next) {
    try {
      const { InspectionTemplate } = require("../../../models/index");
      const { name, productType, items } = req.body;

      if (!name) return next(ApiError.badRequest("Не указано имя шаблона"));

      const template = await InspectionTemplate.create({
        name,
        productType: productType || null,
        items: items || [],
        isActive: true,
      });

      return res.json(template);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new InspectionController();

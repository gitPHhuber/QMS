const { AcceptanceTest, AcceptanceTestItem, AcceptanceTestTemplate } = require("../models/MesQuality");
const sequelize = require("../../../db");
const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const CertificatePdfService = require("../services/CertificatePdfService");

// ═══════════════════════════════════════════════════════════════
// Acceptance Test (PSI) CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { status, productId, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const includeOptions = [];

    // Include Product if available
    try {
      const models = require("../../../models");
      if (models.Product) {
        includeOptions.push({
          model: models.Product,
          as: "product",
          attributes: ["id", "name", "articleNumber"],
          required: false,
        });
      }
      if (models.User) {
        includeOptions.push(
          { model: models.User, as: "submittedBy", attributes: ["id", "name", "email"], required: false },
          { model: models.User, as: "tester", attributes: ["id", "name", "email"], required: false }
        );
      }
    } catch (e) {
      // Models not available — proceed without includes
    }

    const { count, rows } = await AcceptanceTest.findAndCountAll({
      where,
      include: includeOptions,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("AcceptanceTest getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const includeOptions = [
      { model: AcceptanceTestItem, as: "items", order: [["itemOrder", "ASC"]] },
      { model: AcceptanceTestTemplate, as: "template", required: false },
    ];

    try {
      const models = require("../../../models");
      if (models.Product) {
        includeOptions.push({
          model: models.Product,
          as: "product",
          attributes: ["id", "name", "articleNumber"],
          required: false,
        });
      }
    } catch (e) {
      // Product model not available
    }

    const test = await AcceptanceTest.findByPk(req.params.id, {
      include: includeOptions,
    });

    if (!test) return next(ApiError.notFound("Acceptance test not found"));
    res.json(test);
  } catch (e) {
    console.error("AcceptanceTest getOne error:", e);
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    // Auto-generate testNumber: PSI-YYYY-NNN
    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("testNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM acceptance_tests WHERE "testNumber" LIKE 'PSI-${year}-%'`,
      { transaction: t }
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const testNumber = `PSI-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const test = await AcceptanceTest.create(
      {
        ...req.body,
        testNumber,
        status: "DRAFT",
      },
      { transaction: t }
    );

    // If templateId provided, auto-create items from template.testItems JSONB
    if (req.body.templateId) {
      const template = await AcceptanceTestTemplate.findByPk(req.body.templateId, { transaction: t });
      if (template && Array.isArray(template.testItems) && template.testItems.length > 0) {
        const itemsToCreate = template.testItems.map((ti, idx) => ({
          testId: test.id,
          itemOrder: ti.order || idx + 1,
          name: ti.name,
          testType: ti.type || "OTHER",
          criteria: ti.criteria || "",
          lowerLimit: ti.lowerLimit || null,
          upperLimit: ti.upperLimit || null,
          unit: ti.unit || null,
          isCritical: ti.isCritical || false,
          result: "PENDING",
        }));
        await AcceptanceTestItem.bulkCreate(itemsToCreate, { transaction: t });
      }
    }

    await t.commit();

    await logAudit({
      req,
      action: "PSI_CREATE",
      entity: "AcceptanceTest",
      entityId: test.id,
      description: `Created acceptance test: ${testNumber}`,
    });

    // Reload with items
    const created = await AcceptanceTest.findByPk(test.id, {
      include: [{ model: AcceptanceTestItem, as: "items" }],
    });

    res.status(201).json(created);
  } catch (e) {
    await t.rollback();
    console.error("AcceptanceTest create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const test = await AcceptanceTest.findByPk(req.params.id);
    if (!test) return next(ApiError.notFound("Acceptance test not found"));
    if (test.status !== "DRAFT") return next(ApiError.badRequest("Only DRAFT tests can be edited"));

    await test.update(req.body);

    await logAudit({
      req,
      action: "PSI_UPDATE",
      entity: "AcceptanceTest",
      entityId: test.id,
      description: `Updated acceptance test: ${test.testNumber}`,
    });

    res.json(test);
  } catch (e) {
    console.error("AcceptanceTest update error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Workflow transitions
// ═══════════════════════════════════════════════════════════════

const submit = async (req, res, next) => {
  try {
    const test = await AcceptanceTest.findByPk(req.params.id);
    if (!test) return next(ApiError.notFound("Acceptance test not found"));
    if (test.status !== "DRAFT") return next(ApiError.badRequest("Only DRAFT tests can be submitted"));

    await test.update({
      status: "SUBMITTED",
      submittedById: req.user?.id,
      submittedAt: new Date(),
    });

    await logAudit({
      req,
      action: "PSI_SUBMIT",
      entity: "AcceptanceTest",
      entityId: test.id,
      description: `Submitted acceptance test: ${test.testNumber}`,
    });

    res.json(test);
  } catch (e) {
    console.error("AcceptanceTest submit error:", e);
    next(ApiError.internal(e.message));
  }
};

const startTesting = async (req, res, next) => {
  try {
    const test = await AcceptanceTest.findByPk(req.params.id);
    if (!test) return next(ApiError.notFound("Acceptance test not found"));
    if (test.status !== "SUBMITTED") return next(ApiError.badRequest("Only SUBMITTED tests can start testing"));

    await test.update({
      status: "IN_TESTING",
      testerId: req.user?.id,
      startedAt: new Date(),
    });

    res.json(test);
  } catch (e) {
    console.error("AcceptanceTest startTesting error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await AcceptanceTestItem.findByPk(req.params.itemId);
    if (!item) return next(ApiError.notFound("Test item not found"));

    const { actualValue, numericValue, result, notes, equipmentId } = req.body;

    await item.update({
      actualValue: actualValue !== undefined ? actualValue : item.actualValue,
      numericValue: numericValue !== undefined ? numericValue : item.numericValue,
      result: result !== undefined ? result : item.result,
      notes: notes !== undefined ? notes : item.notes,
      equipmentId: equipmentId !== undefined ? equipmentId : item.equipmentId,
      testedById: req.user?.id,
      testedAt: new Date(),
    });

    res.json(item);
  } catch (e) {
    console.error("AcceptanceTest updateItem error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Decision — final pass/fail/conditional determination
// ═══════════════════════════════════════════════════════════════

const decide = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const test = await AcceptanceTest.findByPk(req.params.id, {
      include: [{ model: AcceptanceTestItem, as: "items" }],
      transaction: t,
    });
    if (!test) {
      await t.rollback();
      return next(ApiError.notFound("Acceptance test not found"));
    }

    // Check all items have results
    const pendingItems = (test.items || []).filter((i) => i.result === "PENDING");
    if (pendingItems.length > 0) {
      await t.rollback();
      return next(ApiError.badRequest(`${pendingItems.length} item(s) still pending. Complete all items before deciding.`));
    }

    const criticalFailed = (test.items || []).filter((i) => i.isCritical && i.result === "FAIL");
    const allPassed = (test.items || []).every((i) => i.result === "PASS" || i.result === "N_A");

    let newStatus;
    let ncId = null;

    if (criticalFailed.length > 0) {
      // Any critical item failed → FAILED, create NC
      newStatus = "FAILED";

      try {
        const models = require("../../../models");
        if (models.Nonconformity) {
          const nc = await models.Nonconformity.create(
            {
              title: `PSI Failed: ${test.testNumber}`,
              description: `Acceptance test ${test.testNumber} failed. Critical items failed: ${criticalFailed.map((i) => i.name).join(", ")}`,
              source: "PSI",
              severity: "MAJOR",
              status: "OPEN",
              reportedById: req.user?.id,
              reportedAt: new Date(),
            },
            { transaction: t }
          );
          ncId = nc.id;
        }
      } catch (e) {
        // Nonconformity model not available — continue without NC
        console.warn("Could not create NC for failed PSI:", e.message);
      }
    } else if (allPassed) {
      newStatus = "PASSED";
    } else {
      // Some non-critical items failed — CONDITIONAL if approver accepts
      newStatus = "CONDITIONAL";
    }

    const { decisionNotes } = req.body;

    await test.update(
      {
        status: newStatus,
        decisionById: req.user?.id,
        decisionAt: new Date(),
        decisionNotes: decisionNotes || null,
        completedAt: new Date(),
        ncId,
      },
      { transaction: t }
    );

    // On PASSED: try to update DHR status to RELEASED and create DHRRecord
    if (newStatus === "PASSED") {
      try {
        const models = require("../../../models");
        if (test.dhrId && models.DeviceHistoryRecord) {
          await models.DeviceHistoryRecord.update(
            { status: "RELEASED" },
            { where: { id: test.dhrId }, transaction: t }
          );
        }
        if (test.dhrId && models.DhrProcessStep) {
          await models.DhrProcessStep.create(
            {
              dhrId: test.dhrId,
              stepOrder: 9999,
              stepName: "QC_CHECK",
              description: `Acceptance test ${test.testNumber} passed`,
              operatorId: req.user?.id,
              startedAt: test.startedAt,
              completedAt: new Date(),
              result: "PASS",
            },
            { transaction: t }
          );
        }
      } catch (e) {
        // DHR models not available — continue
        console.warn("Could not update DHR for passed PSI:", e.message);
      }
    }

    await t.commit();

    await logAudit({
      req,
      action: "PSI_DECIDE",
      entity: "AcceptanceTest",
      entityId: test.id,
      description: `Acceptance test ${test.testNumber} decision: ${newStatus}`,
    });

    // Reload
    const updated = await AcceptanceTest.findByPk(test.id, {
      include: [{ model: AcceptanceTestItem, as: "items" }],
    });

    res.json(updated);
  } catch (e) {
    await t.rollback();
    console.error("AcceptanceTest decide error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// PDF generation
// ═══════════════════════════════════════════════════════════════

const getCertificatePdf = async (req, res, next) => {
  try {
    const test = await AcceptanceTest.findByPk(req.params.id);
    if (!test) return next(ApiError.notFound("Acceptance test not found"));

    // TODO: Integrate with pdfmake for actual PDF generation
    const certificateData = await CertificatePdfService.generateCertificate(test.id);

    await test.update({ certificateGeneratedAt: new Date() });

    res.json(certificateData);
  } catch (e) {
    console.error("AcceptanceTest getCertificatePdf error:", e);
    next(ApiError.internal(e.message));
  }
};

const getProtocolPdf = async (req, res, next) => {
  try {
    const test = await AcceptanceTest.findByPk(req.params.id);
    if (!test) return next(ApiError.notFound("Acceptance test not found"));

    // TODO: Integrate with pdfmake for actual PDF generation
    const protocolData = await CertificatePdfService.generateProtocol(test.id);

    res.json(protocolData);
  } catch (e) {
    console.error("AcceptanceTest getProtocolPdf error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Journal — tests for period with status summary
// ═══════════════════════════════════════════════════════════════

const getJournal = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, productId } = req.query;
    const where = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }
    if (productId) where.productId = productId;

    const tests = await AcceptanceTest.findAll({
      where,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "testNumber", "productId", "serialNumber", "lotNumber", "status", "createdAt", "completedAt"],
    });

    // Status summary
    const summary = {
      total: tests.length,
      DRAFT: 0,
      SUBMITTED: 0,
      IN_TESTING: 0,
      PASSED: 0,
      FAILED: 0,
      CONDITIONAL: 0,
    };
    tests.forEach((t) => {
      if (summary[t.status] !== undefined) summary[t.status]++;
    });

    res.json({ summary, tests });
  } catch (e) {
    console.error("AcceptanceTest getJournal error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Template CRUD
// ═══════════════════════════════════════════════════════════════

const getTemplates = async (req, res, next) => {
  try {
    const { productId, isActive } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const templates = await AcceptanceTestTemplate.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(templates);
  } catch (e) {
    console.error("AcceptanceTest getTemplates error:", e);
    next(ApiError.internal(e.message));
  }
};

const createTemplate = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const template = await AcceptanceTestTemplate.create({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json(template);
  } catch (e) {
    console.error("AcceptanceTest createTemplate error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await AcceptanceTestTemplate.findByPk(req.params.id);
    if (!template) return next(ApiError.notFound("Template not found"));

    await template.update(req.body);

    res.json(template);
  } catch (e) {
    console.error("AcceptanceTest updateTemplate error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  submit,
  startTesting,
  updateItem,
  decide,
  getCertificatePdf,
  getProtocolPdf,
  getJournal,
  getTemplates,
  createTemplate,
  updateTemplate,
};

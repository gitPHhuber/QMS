const { Product } = require("../models/Product");
const { DmfSection } = require("../models/DmfSection");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// Product CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { productionStatus, riskClass, category, page = 1, limit = 50 } = req.query;
    const where = {};

    if (productionStatus) where.productionStatus = productionStatus;
    if (riskClass) where.riskClass = riskClass;
    if (category) where.category = category;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [["productCode", "ASC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("Product getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: DmfSection, as: "dmfSections" }],
    });
    if (!product) return next(ApiError.notFound("Изделие не найдено"));
    res.json(product);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("productCode" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM products`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const productCode = `PRD-${String(maxNum + 1).padStart(3, "0")}`;

    const product = await Product.create({
      ...req.body,
      productCode,
    });

    await logAudit({
      req,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: product.id,
      description: `Создано изделие: ${productCode} - ${product.name}`,
    });

    res.status(201).json(product);
  } catch (e) {
    console.error("Product create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return next(ApiError.notFound("Изделие не найдено"));

    await product.update(req.body);

    await logAudit({
      req,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: product.id,
      description: `Обновлено изделие: ${product.productCode}`,
    });

    res.json(product);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    const { Op } = require("sequelize");
    const total = await Product.count();
    const serial = await Product.count({ where: { productionStatus: "SERIAL" } });
    const development = await Product.count({
      where: { productionStatus: ["DEVELOPMENT", "PROTOTYPE"] },
    });

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const expiringReg = await Product.count({
      where: {
        registrationExpiry: {
          [Op.ne]: null,
          [Op.lte]: threeMonthsFromNow,
          [Op.gte]: new Date(),
        },
      },
    });

    const highRiskClass = await Product.count({
      where: { riskClass: ["2B", "3"] },
    });

    const dmfComplete = await Product.count({ where: { dmfStatus: "COMPLETE" } });

    res.json({ total, serial, development, expiringReg, highRiskClass, dmfComplete });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// DMF Sections CRUD
// ═══════════════════════════════════════════════════════════════

const getDmfSections = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return next(ApiError.badRequest("Invalid product ID"));

    const sections = await DmfSection.findAll({
      where: { productId },
      order: [["sortOrder", "ASC"], ["sectionCode", "ASC"]],
    });

    res.json({ productId, sections });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getDmfSummary = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return next(ApiError.badRequest("Invalid product ID"));

    const total = await DmfSection.count({ where: { productId } });
    const complete = await DmfSection.count({ where: { productId, status: "COMPLETE" } });
    const inProgress = await DmfSection.count({ where: { productId, status: "IN_PROGRESS" } });
    const needsUpdate = await DmfSection.count({ where: { productId, status: "NEEDS_UPDATE" } });
    const notStarted = await DmfSection.count({ where: { productId, status: "NOT_STARTED" } });

    const completenessPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

    res.json({ total, complete, inProgress, needsUpdate, notStarted, completenessPercent });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createDmfSection = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return next(ApiError.badRequest("Invalid product ID"));

    const product = await Product.findByPk(productId);
    if (!product) return next(ApiError.notFound("Изделие не найдено"));

    const section = await DmfSection.create({ ...req.body, productId });

    await logAudit({
      req,
      action: "DMF_SECTION_CREATE",
      entity: "DmfSection",
      entityId: section.id,
      description: `Создан раздел DMF: ${section.sectionCode} для ${product.productCode}`,
    });

    res.status(201).json(section);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const updateDmfSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    if (isNaN(sectionId)) return next(ApiError.badRequest("Invalid section ID"));

    const section = await DmfSection.findByPk(sectionId);
    if (!section) return next(ApiError.notFound("Раздел DMF не найден"));

    await section.update(req.body);

    await logAudit({
      req,
      action: "DMF_SECTION_UPDATE",
      entity: "DmfSection",
      entityId: section.id,
      description: `Обновлён раздел DMF: ${section.sectionCode}`,
    });

    res.json(section);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const deleteDmfSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    if (isNaN(sectionId)) return next(ApiError.badRequest("Invalid section ID"));

    const section = await DmfSection.findByPk(sectionId);
    if (!section) return next(ApiError.notFound("Раздел DMF не найден"));

    await logAudit({
      req,
      action: "DMF_SECTION_DELETE",
      entity: "DmfSection",
      entityId: section.id,
      description: `Удалён раздел DMF: ${section.sectionCode}`,
    });

    await section.destroy();
    res.json({ message: "Раздел DMF удалён" });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const initDmfSections = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return next(ApiError.badRequest("Invalid product ID"));

    const product = await Product.findByPk(productId);
    if (!product) return next(ApiError.notFound("Изделие не найдено"));

    const existing = await DmfSection.count({ where: { productId } });
    if (existing > 0) return next(ApiError.badRequest("Разделы DMF уже созданы для этого изделия"));

    const DEFAULT_SECTIONS = [
      { sectionCode: "DEVICE_DESCRIPTION",    title: "Описание изделия",              sortOrder: 1 },
      { sectionCode: "DESIGN_SPECS",          title: "Проектная документация",         sortOrder: 2 },
      { sectionCode: "MANUFACTURING",         title: "Производственная документация",  sortOrder: 3 },
      { sectionCode: "RISK_ANALYSIS",         title: "Анализ рисков (ISO 14971)",      sortOrder: 4 },
      { sectionCode: "VERIFICATION",          title: "Верификация проекта",            sortOrder: 5 },
      { sectionCode: "VALIDATION",            title: "Валидация проекта",              sortOrder: 6 },
      { sectionCode: "LABELING",              title: "Маркировка и упаковка",          sortOrder: 7 },
      { sectionCode: "IOM",                   title: "Инструкция по эксплуатации",     sortOrder: 8 },
      { sectionCode: "BIOCOMPATIBILITY",      title: "Биосовместимость (ISO 10993)",   sortOrder: 9 },
      { sectionCode: "ELECTRICAL_SAFETY",     title: "Электробезопасность (IEC 60601)", sortOrder: 10 },
      { sectionCode: "EMC",                   title: "ЭМС (IEC 60601-1-2)",           sortOrder: 11 },
      { sectionCode: "SOFTWARE",              title: "ПО (IEC 62304)",                 sortOrder: 12 },
      { sectionCode: "STERILIZATION",         title: "Стерилизация",                   sortOrder: 13 },
      { sectionCode: "CLINICAL_EVALUATION",   title: "Клиническая оценка",             sortOrder: 14 },
      { sectionCode: "POST_MARKET",           title: "Пострегистрационный мониторинг", sortOrder: 15 },
      { sectionCode: "REGULATORY_SUBMISSION", title: "Регуляторное досье",             sortOrder: 16 },
    ];

    const sections = await DmfSection.bulkCreate(
      DEFAULT_SECTIONS.map((s) => ({ ...s, productId }))
    );

    await logAudit({
      req,
      action: "DMF_INIT",
      entity: "Product",
      entityId: productId,
      description: `Инициализированы разделы DMF (${sections.length}) для ${product.productCode}`,
    });

    res.status(201).json({ sections });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll, getOne, create, update, getStats,
  getDmfSections, getDmfSummary, createDmfSection, updateDmfSection, deleteDmfSection,
  initDmfSections,
};

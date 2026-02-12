const { Product } = require("../models/Product");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

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
    const product = await Product.findByPk(req.params.id);
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

    res.json({ total, serial, development, expiringReg, highRiskClass });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getOne, create, update, getStats };

/**
 * exportRouter.js — Excel export endpoints for all QMS modules
 *
 * All exports return .xlsx files using ExcelJS.
 * Mounted at /api/export/... and also inline in module routers.
 */

const Router = require("express");
const router = new Router();
const ExportService = require("../services/ExportService");
const models = require("../models/index");
const authMiddleware = require("../modules/core/middleware/authMiddleware");
const syncUserMiddleware = require("../modules/core/middleware/syncUserMiddleware");
const checkAbility = require("../modules/core/middleware/checkAbilityMiddleware");
const { logAudit } = require("../modules/core/utils/auditLogger");

const protect = [authMiddleware, syncUserMiddleware];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("ru-RU") : "—";
const fmtPerson = (p) => p ? `${p.surname || ""} ${p.name || ""}`.trim() : "—";

const sendExcel = (res, buffer, filename) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ═══════════════════════════════════════════════════════
// RISKS (Risk Register)
// ═══════════════════════════════════════════════════════
router.get("/risks", ...protect, checkAbility("risk.read"), async (req, res, next) => {
  try {
    const { RiskRegister } = models;
    if (!RiskRegister) return res.status(404).json({ message: "Module not available" });

    const User = models.User;
    const rows = await RiskRegister.findAll({
      include: [{ model: User, as: "owner", attributes: ["id", "name", "surname"] }],
      order: [["initialRiskLevel", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      riskNumber: r.riskNumber,
      title: r.title,
      description: r.description || "",
      category: r.category,
      initialP: r.initialProbability,
      initialS: r.initialSeverity,
      initialLevel: r.initialRiskLevel,
      initialClass: r.initialRiskClass,
      residualP: r.residualProbability ?? "",
      residualS: r.residualSeverity ?? "",
      residualLevel: r.residualRiskLevel ?? "",
      residualClass: r.residualRiskClass ?? "",
      status: r.status,
      owner: fmtPerson(r.owner),
      isoClause: r.isoClause || "",
      reviewDate: fmtDate(r.reviewDate),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Реестр рисков",
      title: "Реестр рисков — ISO 14971 / ISO 13485 §7.1",
      columns: [
        { header: "Номер", key: "riskNumber", width: 16 },
        { header: "Название", key: "title", width: 35 },
        { header: "Описание", key: "description", width: 40 },
        { header: "Категория", key: "category", width: 16 },
        { header: "P (нач.)", key: "initialP", width: 10 },
        { header: "S (нач.)", key: "initialS", width: 10 },
        { header: "Уровень (нач.)", key: "initialLevel", width: 14 },
        { header: "Класс (нач.)", key: "initialClass", width: 14 },
        { header: "P (ост.)", key: "residualP", width: 10 },
        { header: "S (ост.)", key: "residualS", width: 10 },
        { header: "Уровень (ост.)", key: "residualLevel", width: 14 },
        { header: "Класс (ост.)", key: "residualClass", width: 14 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Владелец", key: "owner", width: 22 },
        { header: "Пункт ISO", key: "isoClause", width: 12 },
        { header: "Пересмотр", key: "reviewDate", width: 14 },
      ],
      rows: data,
    });

    await logAudit(req, "export.risks", "risk_register", null, { count: data.length });
    sendExcel(res, buffer, `Risks_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export risks error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// AUDITS (Internal Audits)
// ═══════════════════════════════════════════════════════
router.get("/audits", ...protect, checkAbility("audit.read"), async (req, res, next) => {
  try {
    const { AuditSchedule, AuditPlan } = models;
    if (!AuditSchedule) return res.status(404).json({ message: "Module not available" });

    const rows = await AuditSchedule.findAll({
      include: [
        { model: AuditPlan, as: "auditPlan", attributes: ["id", "title", "year"] },
      ],
      order: [["plannedDate", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      auditNumber: r.auditNumber,
      title: r.title,
      plan: r.auditPlan?.title || "",
      scope: r.scope || "",
      isoClause: r.isoClause || "",
      plannedDate: fmtDate(r.plannedDate),
      actualDate: fmtDate(r.actualDate),
      status: r.status,
      conclusion: r.conclusion || "",
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Внутренние аудиты",
      title: "Внутренние аудиты — ISO 13485 §8.2.4",
      columns: [
        { header: "Номер", key: "auditNumber", width: 16 },
        { header: "Название", key: "title", width: 35 },
        { header: "План", key: "plan", width: 25 },
        { header: "Область", key: "scope", width: 30 },
        { header: "Пункт ISO", key: "isoClause", width: 12 },
        { header: "План. дата", key: "plannedDate", width: 14 },
        { header: "Факт. дата", key: "actualDate", width: 14 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Заключение", key: "conclusion", width: 35 },
      ],
      rows: data,
    });

    await logAudit(req, "export.audits", "audit_schedule", null, { count: data.length });
    sendExcel(res, buffer, `Audits_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export audits error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════
router.get("/training", ...protect, checkAbility("training.read"), async (req, res, next) => {
  try {
    const { TrainingRecord } = models;
    if (!TrainingRecord) return res.status(404).json({ message: "Module not available" });

    const User = models.User;
    const rows = await TrainingRecord.findAll({
      include: [
        { model: User, as: "trainee", attributes: ["id", "name", "surname"] },
      ],
      order: [["trainingDate", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      title: r.title,
      type: r.type,
      trainee: fmtPerson(r.trainee),
      trainingDate: fmtDate(r.trainingDate),
      duration: r.duration ? `${r.duration} ч` : "",
      assessmentMethod: r.assessmentMethod || "",
      score: r.assessmentScore ?? "",
      passed: r.passed === true ? "Да" : r.passed === false ? "Нет" : "",
      status: r.status,
      expiryDate: fmtDate(r.expiryDate),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Обучение",
      title: "Записи обучения — ISO 13485 §6.2",
      columns: [
        { header: "Тема", key: "title", width: 35 },
        { header: "Тип", key: "type", width: 16 },
        { header: "Обучаемый", key: "trainee", width: 22 },
        { header: "Дата", key: "trainingDate", width: 14 },
        { header: "Длительность", key: "duration", width: 14 },
        { header: "Метод оценки", key: "assessmentMethod", width: 16 },
        { header: "Оценка", key: "score", width: 10 },
        { header: "Сдано", key: "passed", width: 8 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Срок", key: "expiryDate", width: 14 },
      ],
      rows: data,
    });

    await logAudit(req, "export.training", "training_record", null, { count: data.length });
    sendExcel(res, buffer, `Training_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export training error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════════════════
router.get("/equipment", ...protect, checkAbility("equipment.read"), async (req, res, next) => {
  try {
    const { Equipment } = models;
    if (!Equipment) return res.status(404).json({ message: "Module not available" });

    const User = models.User;
    const rows = await Equipment.findAll({
      include: [{ model: User, as: "responsible", attributes: ["id", "name", "surname"] }],
      order: [["nextCalibrationDate", "ASC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      inventoryNumber: r.inventoryNumber,
      name: r.name,
      manufacturer: r.manufacturer || "",
      model: r.model || "",
      serialNumber: r.serialNumber || "",
      type: r.type,
      location: r.location || "",
      responsible: fmtPerson(r.responsible),
      status: r.status,
      calibrationType: r.calibrationType || "",
      lastCalibration: fmtDate(r.lastCalibrationDate),
      nextCalibration: fmtDate(r.nextCalibrationDate),
      calibrationInterval: r.calibrationInterval ? `${r.calibrationInterval} дн.` : "",
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Оборудование",
      title: "Реестр оборудования — ISO 13485 §7.6",
      columns: [
        { header: "Инв. номер", key: "inventoryNumber", width: 16 },
        { header: "Наименование", key: "name", width: 30 },
        { header: "Производитель", key: "manufacturer", width: 20 },
        { header: "Модель", key: "model", width: 18 },
        { header: "С/Н", key: "serialNumber", width: 18 },
        { header: "Тип", key: "type", width: 14 },
        { header: "Расположение", key: "location", width: 18 },
        { header: "Ответственный", key: "responsible", width: 22 },
        { header: "Статус", key: "status", width: 16 },
        { header: "Тип калибровки", key: "calibrationType", width: 16 },
        { header: "Посл. калибровка", key: "lastCalibration", width: 16 },
        { header: "След. калибровка", key: "nextCalibration", width: 16 },
        { header: "Интервал", key: "calibrationInterval", width: 12 },
      ],
      rows: data,
    });

    await logAudit(req, "export.equipment", "equipment", null, { count: data.length });
    sendExcel(res, buffer, `Equipment_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export equipment error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════════════════
router.get("/complaints", ...protect, checkAbility("complaint.read"), async (req, res, next) => {
  try {
    const { Complaint } = models;
    if (!Complaint) return res.status(404).json({ message: "Module not available" });

    const rows = await Complaint.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      complaintNumber: r.complaintNumber || r.number || `C-${r.id}`,
      title: r.title || r.subject || "",
      source: r.source || "",
      severity: r.severity || "",
      status: r.status,
      productName: r.productName || "",
      description: r.description || "",
      receivedDate: fmtDate(r.receivedDate || r.createdAt),
      closedDate: fmtDate(r.closedAt),
      rootCause: r.rootCause || "",
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Жалобы",
      title: "Жалобы потребителей — ISO 13485 §8.2.2",
      columns: [
        { header: "Номер", key: "complaintNumber", width: 16 },
        { header: "Тема", key: "title", width: 35 },
        { header: "Источник", key: "source", width: 16 },
        { header: "Серьёзность", key: "severity", width: 14 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Продукт", key: "productName", width: 22 },
        { header: "Описание", key: "description", width: 40 },
        { header: "Дата получения", key: "receivedDate", width: 14 },
        { header: "Дата закрытия", key: "closedDate", width: 14 },
        { header: "Корневая причина", key: "rootCause", width: 30 },
      ],
      rows: data,
    });

    await logAudit(req, "export.complaints", "complaint", null, { count: data.length });
    sendExcel(res, buffer, `Complaints_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export complaints error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// CHANGE CONTROL
// ═══════════════════════════════════════════════════════
router.get("/changes", ...protect, checkAbility("change.read"), async (req, res, next) => {
  try {
    const { ChangeRequest } = models;
    if (!ChangeRequest) return res.status(404).json({ message: "Module not available" });

    const User = models.User;
    const rows = await ChangeRequest.findAll({
      include: [
        { model: User, as: "initiator", attributes: ["id", "name", "surname"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      ecrNumber: r.ecrNumber || r.number || `ECR-${r.id}`,
      title: r.title,
      type: r.type || "",
      priority: r.priority || "",
      status: r.status,
      initiator: fmtPerson(r.initiator),
      description: r.description || "",
      justification: r.justification || "",
      createdAt: fmtDate(r.createdAt),
      closedAt: fmtDate(r.closedAt),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Управление изменениями",
      title: "Запросы на изменение — ISO 13485 §7.3.9",
      columns: [
        { header: "Номер", key: "ecrNumber", width: 16 },
        { header: "Название", key: "title", width: 35 },
        { header: "Тип", key: "type", width: 14 },
        { header: "Приоритет", key: "priority", width: 12 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Инициатор", key: "initiator", width: 22 },
        { header: "Описание", key: "description", width: 40 },
        { header: "Обоснование", key: "justification", width: 30 },
        { header: "Создан", key: "createdAt", width: 14 },
        { header: "Закрыт", key: "closedAt", width: 14 },
      ],
      rows: data,
    });

    await logAudit(req, "export.changes", "change_request", null, { count: data.length });
    sendExcel(res, buffer, `Changes_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export changes error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════
router.get("/validation", ...protect, checkAbility("validation.read"), async (req, res, next) => {
  try {
    const ValidationProtocol = models.ProcessValidation || models.ValidationProtocol;
    if (!ValidationProtocol) return res.status(404).json({ message: "Module not available" });

    const rows = await ValidationProtocol.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      validationNumber: r.validationNumber || `PV-${r.id}`,
      processName: r.processName || "",
      processOwner: r.processOwner || "",
      status: r.status,
      iqStatus: r.iqStatus || "",
      oqStatus: r.oqStatus || "",
      pqStatus: r.pqStatus || "",
      validatedAt: fmtDate(r.validatedAt),
      nextRevalidation: fmtDate(r.nextRevalidationDate),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Валидация",
      title: "Валидация процессов — ISO 13485 §7.5.6",
      columns: [
        { header: "Номер", key: "validationNumber", width: 16 },
        { header: "Процесс", key: "processName", width: 30 },
        { header: "Владелец процесса", key: "processOwner", width: 22 },
        { header: "Статус", key: "status", width: 18 },
        { header: "IQ", key: "iqStatus", width: 14 },
        { header: "OQ", key: "oqStatus", width: 14 },
        { header: "PQ", key: "pqStatus", width: 14 },
        { header: "Валидирован", key: "validatedAt", width: 14 },
        { header: "След. ревалидация", key: "nextRevalidation", width: 18 },
      ],
      rows: data,
    });

    await logAudit(req, "export.validation", "validation_protocol", null, { count: data.length });
    sendExcel(res, buffer, `Validation_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export validation error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════
router.get("/products", ...protect, checkAbility("product.read"), async (req, res, next) => {
  try {
    const { Product } = models;
    if (!Product) return res.status(404).json({ message: "Module not available" });

    const rows = await Product.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      code: r.productCode || r.code || "",
      name: r.name || "",
      model: r.model || "",
      riskClass: r.riskClass || "",
      category: r.category || "",
      productionStatus: r.productionStatus || "",
      registrationNumber: r.registrationNumber || "",
      registrationExpiry: fmtDate(r.registrationExpiry),
      description: r.description || "",
      createdAt: fmtDate(r.createdAt),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Реестр изделий",
      title: "Реестр медицинских изделий",
      columns: [
        { header: "Код", key: "code", width: 16 },
        { header: "Наименование", key: "name", width: 35 },
        { header: "Модель", key: "model", width: 18 },
        { header: "Класс риска", key: "riskClass", width: 12 },
        { header: "Категория", key: "category", width: 16 },
        { header: "Статус производства", key: "productionStatus", width: 20 },
        { header: "Рег. номер", key: "registrationNumber", width: 20 },
        { header: "Срок РУ", key: "registrationExpiry", width: 14 },
        { header: "Описание", key: "description", width: 40 },
        { header: "Создан", key: "createdAt", width: 14 },
      ],
      rows: data,
    });

    await logAudit(req, "export.products", "product", null, { count: data.length });
    sendExcel(res, buffer, `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export products error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// MANAGEMENT REVIEWS
// ═══════════════════════════════════════════════════════
router.get("/reviews", ...protect, checkAbility("review.read"), async (req, res, next) => {
  try {
    const { ManagementReview } = models;
    if (!ManagementReview) return res.status(404).json({ message: "Module not available" });

    const rows = await ManagementReview.findAll({
      order: [["reviewDate", "DESC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      reviewNumber: r.reviewNumber,
      title: r.title,
      reviewDate: fmtDate(r.reviewDate),
      periodFrom: fmtDate(r.periodFrom),
      periodTo: fmtDate(r.periodTo),
      status: r.status,
      qmsEffectiveness: r.qmsEffectiveness || "",
      conclusion: r.conclusion || "",
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Анализ руководства",
      title: "Анализ со стороны руководства — ISO 13485 §5.6",
      columns: [
        { header: "Номер", key: "reviewNumber", width: 16 },
        { header: "Название", key: "title", width: 35 },
        { header: "Дата", key: "reviewDate", width: 14 },
        { header: "Период с", key: "periodFrom", width: 14 },
        { header: "Период по", key: "periodTo", width: 14 },
        { header: "Статус", key: "status", width: 14 },
        { header: "Результативность", key: "qmsEffectiveness", width: 20 },
        { header: "Заключение", key: "conclusion", width: 40 },
      ],
      rows: data,
    });

    await logAudit(req, "export.reviews", "management_review", null, { count: data.length });
    sendExcel(res, buffer, `Reviews_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export reviews error:", e);
    next(e);
  }
});

// ═══════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════
router.get("/suppliers", ...protect, checkAbility("supplier.read"), async (req, res, next) => {
  try {
    const { Supplier } = models;
    if (!Supplier) return res.status(404).json({ message: "Module not available" });

    const rows = await Supplier.findAll({
      order: [["name", "ASC"]],
      limit: 5000,
    });

    const data = rows.map((r) => ({
      code: r.code,
      name: r.name,
      legalName: r.legalName || "",
      inn: r.inn || "",
      category: r.category,
      criticality: r.criticality,
      qualificationStatus: r.qualificationStatus,
      contactPerson: r.contactPerson || "",
      phone: r.phone || "",
      email: r.email || "",
      overallScore: r.overallScore ?? "",
      hasCertISO9001: r.hasCertISO9001 ? "Да" : "Нет",
      hasCertISO13485: r.hasCertISO13485 ? "Да" : "Нет",
      nextEvaluation: fmtDate(r.nextEvaluationDate),
    }));

    const buffer = await ExportService.generateExcel({
      sheetName: "Поставщики",
      title: "Реестр поставщиков — ISO 13485 §7.4",
      columns: [
        { header: "Код", key: "code", width: 12 },
        { header: "Наименование", key: "name", width: 30 },
        { header: "Юр. лицо", key: "legalName", width: 30 },
        { header: "ИНН", key: "inn", width: 14 },
        { header: "Категория", key: "category", width: 16 },
        { header: "Критичность", key: "criticality", width: 14 },
        { header: "Статус квалификации", key: "qualificationStatus", width: 20 },
        { header: "Контакт", key: "contactPerson", width: 20 },
        { header: "Телефон", key: "phone", width: 16 },
        { header: "Email", key: "email", width: 22 },
        { header: "Оценка", key: "overallScore", width: 10 },
        { header: "ISO 9001", key: "hasCertISO9001", width: 10 },
        { header: "ISO 13485", key: "hasCertISO13485", width: 10 },
        { header: "След. оценка", key: "nextEvaluation", width: 14 },
      ],
      rows: data,
    });

    await logAudit(req, "export.suppliers", "supplier", null, { count: data.length });
    sendExcel(res, buffer, `Suppliers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    console.error("Export suppliers error:", e);
    next(e);
  }
});

module.exports = router;

const {
  RiskManagementPlan,
  Hazard,
  BenefitRiskAnalysis,
  RiskControlTraceability,
} = require("../models/RiskManagement");
const { RiskRegister, RiskMitigation } = require("../models/Risk");
const { User } = require("../../../models/index");
const RiskMatrixService = require("../services/RiskMatrixService");
const { logAudit } = require("../../core/utils/auditLogger");
const { Op } = require("sequelize");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");

// =================================================================
// RISK MANAGEMENT PLAN — ISO 14971 §4.4
// =================================================================

const RMP_UPDATABLE_FIELDS = [
  "title", "version", "productName", "productDescription",
  "intendedUse", "intendedPatientPopulation", "scope",
  "riskAcceptabilityCriteria", "verificationPlanSummary",
  "lifecyclePhase", "responsiblePersonId", "nextReviewDate",
  "relatedProductId",
];

const getAllPlans = async (req, res, next) => {
  try {
    const { status, lifecyclePhase, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (lifecyclePhase) where.lifecyclePhase = lifecyclePhase;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await RiskManagementPlan.findAndCountAll({
      where,
      include: [
        { model: User, as: "responsiblePerson", attributes: ["id", "name", "surname"] },
        { model: Hazard, as: "hazards", attributes: ["id"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("RMP getAllPlans error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOnePlan = async (req, res, next) => {
  try {
    const plan = await RiskManagementPlan.findByPk(req.params.id, {
      include: [
        { model: User, as: "responsiblePerson", attributes: ["id", "name", "surname"] },
        {
          model: Hazard,
          as: "hazards",
          include: [
            { model: RiskControlTraceability, as: "controlMeasures" },
            { model: BenefitRiskAnalysis, as: "benefitRiskAnalyses" },
          ],
          order: [["hazardNumber", "ASC"]],
        },
        { model: BenefitRiskAnalysis, as: "benefitRiskAnalyses" },
        { model: RiskControlTraceability, as: "controlTraceability" },
      ],
    });

    if (!plan) return next(ApiError.notFound("Plan menedzhmenta riskov ne nayden"));
    res.json(plan);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createPlan = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const {
      title, productName, productDescription, intendedUse,
      intendedPatientPopulation, scope, riskAcceptabilityCriteria,
      verificationPlanSummary, lifecyclePhase, responsiblePersonId,
      nextReviewDate, relatedProductId,
    } = req.body;

    // Autogeneratsiya nomera
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("planNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM risk_management_plans`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const seq = (maxResult?.max_num || 0) + 1;
    const year = new Date().getFullYear();
    const planNumber = `RMP-${year}-${String(seq).padStart(3, "0")}`;

    const plan = await RiskManagementPlan.create({
      planNumber,
      title,
      productName,
      productDescription,
      intendedUse,
      intendedPatientPopulation,
      scope,
      riskAcceptabilityCriteria,
      verificationPlanSummary,
      lifecyclePhase: lifecyclePhase || "CONCEPT",
      responsiblePersonId: responsiblePersonId || req.user.id,
      nextReviewDate,
      relatedProductId,
      status: "DRAFT",
    });

    await logAudit(req, "risk_management.plan.create", "risk_management_plan", plan.id, { planNumber });
    res.status(201).json(plan);
  } catch (e) {
    console.error("RMP create error:", e);
    next(ApiError.internal(e.message));
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await RiskManagementPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    if (plan.status === "ARCHIVED") {
      return next(ApiError.badRequest("Nel'zya redaktirovat' arkhivnyy plan"));
    }

    const updateData = {};
    for (const field of RMP_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    await plan.update(updateData);
    await logAudit(req, "risk_management.plan.update", "risk_management_plan", plan.id, updateData);
    res.json(plan);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const approvePlan = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const plan = await RiskManagementPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    if (plan.status !== "REVIEW") {
      return next(ApiError.badRequest(`Utverdit' mozhno tol'ko plan v statuse REVIEW. Tekushchiy: ${plan.status}`));
    }

    plan.status = "APPROVED";
    plan.approvedBy = req.user.id;
    plan.approvedAt = new Date();
    await plan.save();

    await logAudit(req, "risk_management.plan.approve", "risk_management_plan", plan.id, { severity: "WARNING" });
    res.json(plan);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const submitPlanForReview = async (req, res, next) => {
  try {
    const plan = await RiskManagementPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    if (plan.status !== "DRAFT" && plan.status !== "REVISION") {
      return next(ApiError.badRequest(`Otpravit' na rassmotreniye mozhno tol'ko iz DRAFT/REVISION. Tekushchiy: ${plan.status}`));
    }

    plan.status = "REVIEW";
    await plan.save();

    await logAudit(req, "risk_management.plan.submit_review", "risk_management_plan", plan.id);
    res.json(plan);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// =================================================================
// HAZARD ANALYSIS — ISO 14971 §5
// =================================================================

const HAZARD_UPDATABLE_FIELDS = [
  "hazardCategory", "hazardDescription", "foreseeableSequence",
  "hazardousSituation", "harm", "severityOfHarm", "probabilityOfOccurrence",
  "probabilityOfHarm", "isoClause", "notes", "linkedRiskRegisterId",
];

const getAllHazards = async (req, res, next) => {
  try {
    const { riskManagementPlanId, hazardCategory, status, riskClass, page = 1, limit = 50 } = req.query;
    const where = {};

    if (riskManagementPlanId) where.riskManagementPlanId = riskManagementPlanId;
    if (hazardCategory) where.hazardCategory = hazardCategory;
    if (status) where.status = status;
    if (riskClass) where.riskClass = riskClass;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Hazard.findAndCountAll({
      where,
      include: [
        { model: RiskManagementPlan, attributes: ["id", "planNumber", "productName"] },
        { model: RiskControlTraceability, as: "controlMeasures" },
      ],
      order: [["riskLevel", "DESC"], ["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("Hazard getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOneHazard = async (req, res, next) => {
  try {
    const hazard = await Hazard.findByPk(req.params.hazardId, {
      include: [
        { model: RiskManagementPlan, attributes: ["id", "planNumber", "productName", "title"] },
        { model: RiskControlTraceability, as: "controlMeasures", order: [["controlPriority", "ASC"]] },
        { model: BenefitRiskAnalysis, as: "benefitRiskAnalyses" },
      ],
    });

    if (!hazard) return next(ApiError.notFound("Opasnost' ne naydena"));
    res.json(hazard);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createHazard = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const plan = await RiskManagementPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    const {
      hazardCategory, hazardDescription, foreseeableSequence,
      hazardousSituation, harm, severityOfHarm, probabilityOfOccurrence,
      probabilityOfHarm, isoClause, notes, linkedRiskRegisterId,
    } = req.body;

    // Autogeneratsiya nomera
    const hazardCount = await Hazard.count({ where: { riskManagementPlanId: plan.id } });
    const hazardNumber = `HAZ-${String(hazardCount + 1).padStart(3, "0")}`;

    // Raschyot riska
    const { level, riskClass } = RiskMatrixService.calculate(probabilityOfOccurrence, severityOfHarm);

    const hazard = await Hazard.create({
      riskManagementPlanId: plan.id,
      hazardNumber,
      hazardCategory,
      hazardDescription,
      foreseeableSequence,
      hazardousSituation,
      harm,
      severityOfHarm,
      probabilityOfOccurrence,
      probabilityOfHarm,
      riskLevel: level,
      riskClass,
      isoClause,
      notes,
      linkedRiskRegisterId,
      status: "IDENTIFIED",
    });

    await logAudit(req, "risk_management.hazard.create", "hazard", hazard.id, { hazardNumber, riskClass });
    res.status(201).json(hazard);
  } catch (e) {
    console.error("Hazard create error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateHazard = async (req, res, next) => {
  try {
    const hazard = await Hazard.findByPk(req.params.hazardId);
    if (!hazard) return next(ApiError.notFound("Opasnost' ne naydena"));

    const updateData = {};
    for (const field of HAZARD_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    // Pereschet riska
    const prob = updateData.probabilityOfOccurrence || hazard.probabilityOfOccurrence;
    const sev = updateData.severityOfHarm || hazard.severityOfHarm;
    const { level, riskClass } = RiskMatrixService.calculate(prob, sev);
    updateData.riskLevel = level;
    updateData.riskClass = riskClass;

    await hazard.update(updateData);
    await logAudit(req, "risk_management.hazard.update", "hazard", hazard.id, updateData);
    res.json(hazard);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const updateHazardResidualRisk = async (req, res, next) => {
  try {
    const hazard = await Hazard.findByPk(req.params.hazardId);
    if (!hazard) return next(ApiError.notFound("Opasnost' ne naydena"));

    const { residualSeverity, residualProbability } = req.body;
    if (!residualSeverity || !residualProbability) {
      return next(ApiError.badRequest("residualSeverity i residualProbability obyazatel'ny"));
    }

    const { level, riskClass } = RiskMatrixService.calculate(residualProbability, residualSeverity);

    await hazard.update({
      residualSeverity,
      residualProbability,
      residualRiskLevel: level,
      residualRiskClass: riskClass,
    });

    // Proverka priyemlemosti po planu
    const plan = await RiskManagementPlan.findByPk(hazard.riskManagementPlanId);
    const criteria = plan?.riskAcceptabilityCriteria || {};
    const acceptable = (criteria.acceptableRiskClasses || ["LOW"]).includes(riskClass) ||
      (criteria.conditionallyAcceptableRiskClasses || ["MEDIUM"]).includes(riskClass);

    if (acceptable && hazard.status === "CONTROLLED") {
      hazard.status = "VERIFIED";
      await hazard.save();
    }

    await logAudit(req, "risk_management.hazard.residual_update", "hazard", hazard.id, { residualRiskClass: riskClass });
    res.json({ hazard, residualRiskAcceptable: acceptable });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// =================================================================
// BENEFIT-RISK ANALYSIS — ISO 14971 §6.5
// =================================================================

const getAllBenefitRisk = async (req, res, next) => {
  try {
    const { riskManagementPlanId, benefitOutweighsRisk, page = 1, limit = 50 } = req.query;
    const where = {};

    if (riskManagementPlanId) where.riskManagementPlanId = riskManagementPlanId;
    if (benefitOutweighsRisk !== undefined) where.benefitOutweighsRisk = benefitOutweighsRisk === "true";

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await BenefitRiskAnalysis.findAndCountAll({
      where,
      include: [
        { model: Hazard, attributes: ["id", "hazardNumber", "hazardDescription", "harm"] },
        { model: User, as: "assessor", attributes: ["id", "name", "surname"] },
      ],
      order: [["assessmentDate", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createBenefitRisk = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const plan = await RiskManagementPlan.findByPk(req.params.id);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    const {
      hazardId, residualRiskDescription, residualRiskClass,
      clinicalBenefitDescription, benefitJustification, benefitOutweighsRisk,
      stateOfTheArt, alternativeSolutions, literatureReferences, conclusion,
    } = req.body;

    // Proverka hazard prinadlezhit planu
    if (hazardId) {
      const hazard = await Hazard.findByPk(hazardId);
      if (!hazard || hazard.riskManagementPlanId !== plan.id) {
        return next(ApiError.badRequest("Opasnost' ne prinadlezhit dannomu planu"));
      }
    }

    // Autogeneratsiya nomera
    const braCount = await BenefitRiskAnalysis.count({ where: { riskManagementPlanId: plan.id } });
    const analysisNumber = `BRA-${String(braCount + 1).padStart(3, "0")}`;

    const analysis = await BenefitRiskAnalysis.create({
      riskManagementPlanId: plan.id,
      hazardId,
      analysisNumber,
      residualRiskDescription,
      residualRiskClass,
      clinicalBenefitDescription,
      benefitJustification,
      benefitOutweighsRisk,
      stateOfTheArt,
      alternativeSolutions,
      literatureReferences,
      conclusion,
      assessorId: req.user.id,
    });

    await logAudit(req, "risk_management.benefit_risk.create", "benefit_risk_analysis", analysis.id, {
      analysisNumber,
      benefitOutweighsRisk,
    });
    res.status(201).json(analysis);
  } catch (e) {
    console.error("BRA create error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateBenefitRisk = async (req, res, next) => {
  try {
    const analysis = await BenefitRiskAnalysis.findByPk(req.params.braId);
    if (!analysis) return next(ApiError.notFound("Analiz pol'zy/riska ne nayden"));

    const updatableFields = [
      "residualRiskDescription", "residualRiskClass",
      "clinicalBenefitDescription", "benefitJustification", "benefitOutweighsRisk",
      "stateOfTheArt", "alternativeSolutions", "literatureReferences", "conclusion",
    ];

    const updateData = {};
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    await analysis.update(updateData);
    await logAudit(req, "risk_management.benefit_risk.update", "benefit_risk_analysis", analysis.id, updateData);
    res.json(analysis);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const reviewBenefitRisk = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const analysis = await BenefitRiskAnalysis.findByPk(req.params.braId);
    if (!analysis) return next(ApiError.notFound("Analiz ne nayden"));

    analysis.reviewedBy = req.user.id;
    analysis.reviewedAt = new Date();
    await analysis.save();

    await logAudit(req, "risk_management.benefit_risk.review", "benefit_risk_analysis", analysis.id);
    res.json(analysis);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// =================================================================
// RISK CONTROL TRACEABILITY — ISO 14971 §7, §8
// =================================================================

const getAllTraceability = async (req, res, next) => {
  try {
    const { riskManagementPlanId, hazardId, controlType, implementationStatus, page = 1, limit = 50 } = req.query;
    const where = {};

    if (riskManagementPlanId) where.riskManagementPlanId = riskManagementPlanId;
    if (hazardId) where.hazardId = hazardId;
    if (controlType) where.controlType = controlType;
    if (implementationStatus) where.implementationStatus = implementationStatus;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await RiskControlTraceability.findAndCountAll({
      where,
      include: [
        { model: Hazard, attributes: ["id", "hazardNumber", "hazardDescription", "riskClass"] },
      ],
      order: [["controlPriority", "ASC"], ["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createTraceability = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const hazard = await Hazard.findByPk(req.params.hazardId);
    if (!hazard) return next(ApiError.notFound("Opasnost' ne naydena"));

    const {
      controlMeasureDescription, controlType, controlPriority,
      verificationMethod, verificationCriteria, linkedMitigationId,
    } = req.body;

    // Autogeneratsiya nomera
    const rctCount = await RiskControlTraceability.count({
      where: { riskManagementPlanId: hazard.riskManagementPlanId },
    });
    const traceNumber = `RCT-${String(rctCount + 1).padStart(3, "0")}`;

    const trace = await RiskControlTraceability.create({
      riskManagementPlanId: hazard.riskManagementPlanId,
      hazardId: hazard.id,
      traceNumber,
      controlMeasureDescription,
      controlType,
      controlPriority: controlPriority || 1,
      verificationMethod,
      verificationCriteria,
      linkedMitigationId,
      implementationStatus: "PLANNED",
      verificationResult: "PENDING",
    });

    // Obnovit' status opasnosti
    if (hazard.status === "IDENTIFIED" || hazard.status === "ANALYZED") {
      hazard.status = "CONTROLLED";
      await hazard.save();
    }

    await logAudit(req, "risk_management.traceability.create", "risk_control_traceability", trace.id, {
      traceNumber,
      controlType,
    });
    res.status(201).json(trace);
  } catch (e) {
    console.error("Traceability create error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateTraceability = async (req, res, next) => {
  try {
    const trace = await RiskControlTraceability.findByPk(req.params.traceId);
    if (!trace) return next(ApiError.notFound("Zapis' proslezhivayemosti ne naydena"));

    const updatableFields = [
      "controlMeasureDescription", "controlType", "controlPriority",
      "implementationStatus", "verificationMethod", "verificationCriteria",
      "linkedMitigationId",
    ];

    const updateData = {};
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    if (updateData.implementationStatus === "IMPLEMENTED") {
      updateData.implementedDate = new Date();
      updateData.implementedBy = req.user?.id;
    }

    await trace.update(updateData);
    await logAudit(req, "risk_management.traceability.update", "risk_control_traceability", trace.id, updateData);
    res.json(trace);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const verifyTraceability = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Trebuetsya avtorizatsiya"));

    const trace = await RiskControlTraceability.findByPk(req.params.traceId);
    if (!trace) return next(ApiError.notFound("Zapis' ne naydena"));

    if (trace.implementationStatus !== "IMPLEMENTED") {
      return next(ApiError.badRequest(
        `Verificirovat' mozhno tol'ko realizovannuyu meru. Tekushchiy status: ${trace.implementationStatus}`
      ));
    }

    const { verificationResult, verificationEvidence, residualRiskAcceptable, newHazardsIntroduced, newHazardDescription } = req.body;

    if (!verificationResult) {
      return next(ApiError.badRequest("verificationResult obyazatelen (PASS/FAIL/PARTIAL)"));
    }

    trace.verificationResult = verificationResult;
    trace.verificationEvidence = verificationEvidence;
    trace.verificationDate = new Date();
    trace.verifiedById = req.user.id;
    trace.residualRiskAcceptable = residualRiskAcceptable;
    trace.newHazardsIntroduced = newHazardsIntroduced || false;
    trace.newHazardDescription = newHazardDescription;
    trace.implementationStatus = verificationResult === "PASS" ? "VERIFIED" : "INEFFECTIVE";
    await trace.save();

    await logAudit(req, "risk_management.traceability.verify", "risk_control_traceability", trace.id, {
      verificationResult,
      residualRiskAcceptable,
    });
    res.json(trace);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// =================================================================
// TRACEABILITY MATRIX — ISO 14971 §8
// Svodnaya matritsa proslezhivayemosti
// =================================================================

const getTraceabilityMatrix = async (req, res, next) => {
  try {
    const { riskManagementPlanId } = req.params;

    const plan = await RiskManagementPlan.findByPk(riskManagementPlanId);
    if (!plan) return next(ApiError.notFound("Plan ne nayden"));

    const hazards = await Hazard.findAll({
      where: { riskManagementPlanId },
      include: [
        {
          model: RiskControlTraceability,
          as: "controlMeasures",
          order: [["controlPriority", "ASC"]],
        },
        {
          model: BenefitRiskAnalysis,
          as: "benefitRiskAnalyses",
        },
      ],
      order: [["hazardNumber", "ASC"]],
    });

    // Formirovaniye matritsy
    const matrix = hazards.map(h => ({
      hazardId: h.id,
      hazardNumber: h.hazardNumber,
      hazardDescription: h.hazardDescription,
      hazardousSituation: h.hazardousSituation,
      harm: h.harm,
      initialRisk: {
        severity: h.severityOfHarm,
        probability: h.probabilityOfOccurrence,
        level: h.riskLevel,
        class: h.riskClass,
      },
      controlMeasures: h.controlMeasures.map(cm => ({
        id: cm.id,
        traceNumber: cm.traceNumber,
        description: cm.controlMeasureDescription,
        type: cm.controlType,
        status: cm.implementationStatus,
        verificationResult: cm.verificationResult,
        residualRiskAcceptable: cm.residualRiskAcceptable,
        newHazardsIntroduced: cm.newHazardsIntroduced,
      })),
      residualRisk: {
        severity: h.residualSeverity,
        probability: h.residualProbability,
        level: h.residualRiskLevel,
        class: h.residualRiskClass,
      },
      benefitRiskAnalysis: h.benefitRiskAnalyses.length > 0
        ? {
            id: h.benefitRiskAnalyses[0].id,
            benefitOutweighsRisk: h.benefitRiskAnalyses[0].benefitOutweighsRisk,
            conclusion: h.benefitRiskAnalyses[0].conclusion,
          }
        : null,
      hazardStatus: h.status,
    }));

    // Statistika
    const stats = {
      totalHazards: hazards.length,
      byRiskClass: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      byResidualRiskClass: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, NOT_ASSESSED: 0 },
      byHazardStatus: {},
      controlMeasuresTotal: 0,
      controlMeasuresVerified: 0,
      benefitRiskCompleted: 0,
    };

    hazards.forEach(h => {
      if (h.riskClass) stats.byRiskClass[h.riskClass]++;
      if (h.residualRiskClass) stats.byResidualRiskClass[h.residualRiskClass]++;
      else stats.byResidualRiskClass.NOT_ASSESSED++;
      stats.byHazardStatus[h.status] = (stats.byHazardStatus[h.status] || 0) + 1;
      stats.controlMeasuresTotal += h.controlMeasures.length;
      stats.controlMeasuresVerified += h.controlMeasures.filter(cm => cm.implementationStatus === "VERIFIED").length;
      if (h.benefitRiskAnalyses.length > 0) stats.benefitRiskCompleted++;
    });

    res.json({ plan: { id: plan.id, planNumber: plan.planNumber, productName: plan.productName }, matrix, stats });
  } catch (e) {
    console.error("Traceability matrix error:", e);
    next(ApiError.internal(e.message));
  }
};

// =================================================================
// SUMMARY STATISTICS — ISO 14971 Risk Management File overview
// =================================================================

const getRiskManagementStats = async (req, res, next) => {
  try {
    const [planCount, hazardCount, braCount, rctCount] = await Promise.all([
      RiskManagementPlan.count(),
      Hazard.count(),
      BenefitRiskAnalysis.count(),
      RiskControlTraceability.count(),
    ]);

    const [plansByStatus, hazardsByClass, hazardsByStatus, unverifiedControls] = await Promise.all([
      RiskManagementPlan.findAll({
        attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      }),
      Hazard.findAll({
        attributes: ["riskClass", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["riskClass"],
        raw: true,
      }),
      Hazard.findAll({
        attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      }),
      RiskControlTraceability.count({
        where: { implementationStatus: { [Op.notIn]: ["VERIFIED"] } },
      }),
    ]);

    res.json({
      plans: { total: planCount, byStatus: plansByStatus },
      hazards: { total: hazardCount, byClass: hazardsByClass, byStatus: hazardsByStatus },
      benefitRiskAnalyses: { total: braCount },
      controlTraceability: { total: rctCount, unverified: unverifiedControls },
    });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  // Plans
  getAllPlans,
  getOnePlan,
  createPlan,
  updatePlan,
  approvePlan,
  submitPlanForReview,
  // Hazards
  getAllHazards,
  getOneHazard,
  createHazard,
  updateHazard,
  updateHazardResidualRisk,
  // Benefit-Risk
  getAllBenefitRisk,
  createBenefitRisk,
  updateBenefitRisk,
  reviewBenefitRisk,
  // Traceability
  getAllTraceability,
  createTraceability,
  updateTraceability,
  verifyTraceability,
  // Matrix & Stats
  getTraceabilityMatrix,
  getRiskManagementStats,
};

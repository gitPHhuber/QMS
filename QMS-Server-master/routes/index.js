// routes/index.js
const Router = require("express");
const router = new Router();

const userRouter = require("./userRouter");
const sessionRouter = require("./sessionRouter");
const pcRouter = require("./pcRouter");

const rbacRouter = require("./rbacRouter");
const structureRouter = require("./structureRouter");
const auditRouter = require("./auditRouter");

const warehouseRouter = require("./warehouseRouter");

const taskRouter = require("./taskRouter");
const projectRouter = require("./projectRouter");

// ═══ QMS модули ═══
const documentRouter = require("./documentRouter");
const ncCapaRouter = require("./ncCapaRouter");
const riskRouter = require("./riskRouter");

// ─────────────────────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────────────────────
router.use("/users", userRouter);
router.use("/sessions", sessionRouter);
router.use("/pcs", pcRouter);

router.use("/rbac", rbacRouter);
router.use("/structure", structureRouter);
router.use("/audit", auditRouter);

// ─────────────────────────────────────────────────────────────
// Warehouse / Projects
// ─────────────────────────────────────────────────────────────
router.use("/warehouse", warehouseRouter);

router.use("/tasks", taskRouter);
router.use("/projects", projectRouter);

// ─────────────────────────────────────────────────────────────
// QMS
// ─────────────────────────────────────────────────────────────
// Document Management
router.use("/documents", documentRouter);
// Nonconformity + CAPA
router.use("/nc", ncCapaRouter);
// Risk Management
router.use("/risks", riskRouter);

// TODO: подключить по мере создания контроллеров:
// router.use("/suppliers", supplierRouter);
// router.use("/internal-audits", internalAuditRouter);
// router.use("/training", trainingRouter);
// router.use("/equipment", equipmentRouter);
// router.use("/management-review", managementReviewRouter);

module.exports = router;

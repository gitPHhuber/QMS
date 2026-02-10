const Router = require("express");
const router = new Router();
const { moduleManager } = require("../config/modules");
const checkModule = require("../middleware/checkModuleMiddleware");

// ─── Core (always) ───
const userRouter = require("./userRouter");
const sessionRouter = require("./sessionRouter");
const pcRouter = require("./pcRouter");
const rbacRouter = require("./rbacRouter");
const structureRouter = require("./structureRouter");
const auditRouter = require("./auditRouter");
const taskRouter = require("./taskRouter");
const projectRouter = require("./projectRouter");

router.use("/users", userRouter);
router.use("/sessions", sessionRouter);
router.use("/pcs", pcRouter);
router.use("/rbac", rbacRouter);
router.use("/structure", structureRouter);
router.use("/audit", auditRouter);
router.use("/tasks", taskRouter);
router.use("/projects", projectRouter);

// ─── QMS (conditional) ───
if (moduleManager.isEnabled('qms.dms')) {
  const documentRouter = require("./documentRouter");
  router.use("/documents", checkModule('qms.dms'), documentRouter);
}

if (moduleManager.isEnabled('qms.nc') || moduleManager.isEnabled('qms.capa')) {
  const ncCapaRouter = require("./ncCapaRouter");
  router.use("/nc", checkModule('qms.nc'), ncCapaRouter);
}

if (moduleManager.isEnabled('qms.risk')) {
  const riskRouter = require("./riskRouter");
  router.use("/risks", checkModule('qms.risk'), riskRouter);
}

// TODO: uncomment as routers are created
// if (moduleManager.isEnabled('qms.supplier')) {
//   router.use("/suppliers", checkModule('qms.supplier'), require("./supplierRouter"));
// }
// if (moduleManager.isEnabled('qms.audit')) {
//   router.use("/internal-audits", checkModule('qms.audit'), require("./internalAuditRouter"));
// }
// if (moduleManager.isEnabled('qms.training')) {
//   router.use("/training", checkModule('qms.training'), require("./trainingRouter"));
// }
// if (moduleManager.isEnabled('qms.equipment')) {
//   router.use("/equipment", checkModule('qms.equipment'), require("./equipmentRouter"));
// }
// if (moduleManager.isEnabled('qms.review')) {
//   router.use("/reviews", checkModule('qms.review'), require("./reviewRouter"));
// }
// if (moduleManager.isEnabled('qms.complaints')) {
//   router.use("/complaints", checkModule('qms.complaints'), require("./complaintsRouter"));
// }
// if (moduleManager.isEnabled('qms.changes')) {
//   router.use("/changes", checkModule('qms.changes'), require("./changesRouter"));
// }

// ─── WMS (conditional) ───
if (moduleManager.isEnabled('wms')) {
  const warehouseRouter = require("./warehouseRouter");
  router.use("/warehouse", checkModule('wms.warehouse'), warehouseRouter);
}

// ─── MES (conditional, future) ───
// if (moduleManager.isEnabled('mes')) {
//   router.use("/production", checkModule('mes.routes'), require("./productionRouter"));
// }

// ─── Feature Flags (admin) ───
const featureFlagRouter = require("./featureFlagRouter");
router.use("/feature-flags", featureFlagRouter);

// ─── System API (always) ───
router.get("/system/modules", (req, res) => {
  res.json(moduleManager.toClientConfig());
});

module.exports = router;

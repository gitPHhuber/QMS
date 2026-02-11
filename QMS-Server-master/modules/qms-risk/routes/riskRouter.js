const Router = require("express");
const router = new Router();
const riskController = require("../controllers/riskController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes FIRST
router.get("/matrix",    ...protect, checkAbility("risk.read"),    riskController.getMatrix);
router.get("/stats",     ...protect, checkAbility("risk.read"),    riskController.getStats);

// Реестр рисков
router.get("/",          ...protect, checkAbility("risk.read"),    riskController.getAll);
router.get("/:id",       ...protect, checkAbility("risk.read"),    riskController.getOne);
router.post("/",         ...protect, checkAbility("risk.create"),  riskController.create);
router.put("/:id",       ...protect, checkAbility("risk.update"),  riskController.update);

// Оценка
router.post("/:id/assess",    ...protect, checkAbility("risk.assess"),  riskController.addAssessment);
router.post("/:id/accept",    ...protect, checkAbility("risk.accept"),  riskController.acceptRisk);

// Меры снижения
router.post("/:id/mitigation",                         ...protect, checkAbility("risk.update"),   riskController.addMitigation);
router.put("/mitigation/:mitigationId/complete",        ...protect, checkAbility("risk.update"),   riskController.completeMitigation);
router.put("/mitigation/:mitigationId/verify",          ...protect, checkAbility("risk.verify"),   riskController.verifyMitigation);

module.exports = router;

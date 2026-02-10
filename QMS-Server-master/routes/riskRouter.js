const Router = require("express");
const router = new Router();
const riskController = require("../controllers/riskController");
const authMiddleware = require("../middleware/authMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

// Реестр рисков
router.get("/",          authMiddleware, checkAbility("risk.read"),    riskController.getAll);
router.get("/matrix",    authMiddleware, checkAbility("risk.read"),    riskController.getMatrix);
router.get("/stats",     authMiddleware, checkAbility("risk.read"),    riskController.getStats);
router.get("/:id",       authMiddleware, checkAbility("risk.read"),    riskController.getOne);
router.post("/",         authMiddleware, checkAbility("risk.create"),  riskController.create);
router.put("/:id",       authMiddleware, checkAbility("risk.update"),  riskController.update);

// Оценка
router.post("/:id/assess",    authMiddleware, checkAbility("risk.assess"),  riskController.addAssessment);
router.post("/:id/accept",    authMiddleware, checkAbility("risk.accept"),  riskController.acceptRisk);

// Меры снижения
router.post("/:id/mitigation",                         authMiddleware, checkAbility("risk.update"),   riskController.addMitigation);
router.put("/mitigation/:mitigationId/complete",        authMiddleware, checkAbility("risk.update"),   riskController.completeMitigation);
router.put("/mitigation/:mitigationId/verify",          authMiddleware, checkAbility("risk.verify"),   riskController.verifyMitigation);

module.exports = router;

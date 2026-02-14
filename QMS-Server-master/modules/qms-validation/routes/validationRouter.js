const Router = require("express");
const router = new Router();
const validationController = require("../controllers/validationController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/stats", ...protect, checkAbility("validation.read"), validationController.getStats);

// Protocol Templates
router.get("/templates",     ...protect, checkAbility("validation.read"),   validationController.getTemplates);
router.post("/templates",    ...protect, checkAbility("validation.manage"), validationController.createTemplate);
router.get("/templates/:id", ...protect, checkAbility("validation.read"),   validationController.getTemplateOne);
router.put("/templates/:id", ...protect, checkAbility("validation.manage"), validationController.updateTemplate);

// Checklist item update (static path before parameterized)
router.put("/checklists/items/:itemId", ...protect, checkAbility("validation.manage"), validationController.updateChecklistItem);
router.put("/checklists/:clId/complete", ...protect, checkAbility("validation.manage"), validationController.completeChecklist);

// Process Validations CRUD
router.get("/", ...protect, checkAbility("validation.read"), validationController.getAll);
router.post("/", ...protect, checkAbility("validation.manage"), validationController.create);

// Process Validation by ID + nested checklists
router.get("/:id/checklists", ...protect, checkAbility("validation.read"), validationController.getChecklists);
router.post("/:id/checklists/from-template", ...protect, checkAbility("validation.manage"), validationController.createChecklistFromTemplate);
router.get("/:id", ...protect, checkAbility("validation.read"), validationController.getOne);
router.put("/:id", ...protect, checkAbility("validation.manage"), validationController.update);

module.exports = router;

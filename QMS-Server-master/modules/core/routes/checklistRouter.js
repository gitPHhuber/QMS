const Router = require("express");
const router = new Router({ mergeParams: true });
const ChecklistController = require("../controllers/ChecklistController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/",                         ...protect, ChecklistController.getChecklists);
router.post("/",                        ...protect, checkAbility("users.manage"), ChecklistController.createChecklist);
router.patch("/:checklistId",           ...protect, checkAbility("users.manage"), ChecklistController.updateChecklist);
router.delete("/:checklistId",          ...protect, checkAbility("users.manage"), ChecklistController.deleteChecklist);
router.post("/:checklistId/items",      ...protect, checkAbility("users.manage"), ChecklistController.createItem);
router.patch("/:checklistId/items/:itemId", ...protect, checkAbility("users.manage"), ChecklistController.updateItem);
router.delete("/:checklistId/items/:itemId", ...protect, checkAbility("users.manage"), ChecklistController.deleteItem);

module.exports = router;

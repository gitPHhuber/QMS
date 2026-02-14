const Router = require("express");
const router = new Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/stats", ...protect, checkAbility("product.read"), productController.getStats);

router.get("/", ...protect, checkAbility("product.read"), productController.getAll);
router.get("/:id", ...protect, checkAbility("product.read"), productController.getOne);
router.post("/", ...protect, checkAbility("product.manage"), productController.create);
router.put("/:id", ...protect, checkAbility("product.manage"), productController.update);

// DMF (Device Master File) routes
router.get("/:id/dmf", ...protect, checkAbility("product.read"), productController.getDmfSections);
router.get("/:id/dmf/summary", ...protect, checkAbility("product.read"), productController.getDmfSummary);
router.post("/:id/dmf", ...protect, checkAbility("product.manage"), productController.createDmfSection);
router.post("/:id/dmf/init", ...protect, checkAbility("product.manage"), productController.initDmfSections);
router.put("/dmf/:sectionId", ...protect, checkAbility("product.manage"), productController.updateDmfSection);
router.delete("/dmf/:sectionId", ...protect, checkAbility("product.manage"), productController.deleteDmfSection);

module.exports = router;

const Router = require("express");
const router = new Router();
const DefectSystemController = require("../controllers/defectSystemController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.get("/categories", ...protect, DefectSystemController.getCategories);


router.post(
  "/categories",
  ...protect,
  checkAbility("defect.manage"),
  DefectSystemController.createCategory
);


router.put(
  "/categories/:id",
  ...protect,
  checkAbility("defect.manage"),
  DefectSystemController.updateCategory
);


router.delete(
  "/categories/:id",
  ...protect,
  checkAbility("defect.manage"),
  DefectSystemController.deleteCategory
);


router.get("/", ...protect, DefectSystemController.getDefects);


router.get("/statistics", ...protect, DefectSystemController.getStatistics);


router.get("/:id", ...protect, DefectSystemController.getDefectById);


router.post(
  "/",
  ...protect,
  checkAbility("defect.create"),
  DefectSystemController.createDefect
);


router.patch(
  "/:id/status",
  ...protect,
  checkAbility("defect.update"),
  DefectSystemController.updateDefectStatus
);


router.get(
  "/:defectId/repairs",
  ...protect,
  DefectSystemController.getRepairHistory
);


router.post(
  "/:defectId/repairs",
  ...protect,
  checkAbility("defect.repair"),
  DefectSystemController.addRepairAction
);


router.post(
  "/:id/repaired",
  ...protect,
  checkAbility("defect.repair"),
  DefectSystemController.markAsRepaired
);


router.post(
  "/:id/scrap",
  ...protect,
  checkAbility("defect.scrap"),
  DefectSystemController.markAsScrapped
);


router.post(
  "/:id/verify",
  ...protect,
  checkAbility("defect.verify"),
  DefectSystemController.verifyRepair
);

module.exports = router;

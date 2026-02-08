

const Router = require("express");
const router = new Router();
const controller = require("../controllers/productionOutputController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.get("/operation-types", ...protect, controller.getOperationTypes);


router.post("/operation-types", ...protect, checkAbility("recipe.manage"), controller.createOperationType);
router.put("/operation-types/:id", ...protect, checkAbility("recipe.manage"), controller.updateOperationType);
router.delete("/operation-types/:id", ...protect, checkAbility("recipe.manage"), controller.deleteOperationType);


router.get("/outputs", ...protect, controller.getOutputs);


router.get("/outputs/:id", ...protect, controller.getOutputById);


router.post("/outputs", ...protect, controller.createOutput);


router.put("/outputs/:id", ...protect, controller.updateOutput);


router.delete("/outputs/:id", ...protect, controller.deleteOutput);


router.get("/pending", ...protect, controller.getPendingOutputs);


router.post("/approve", ...protect, controller.approveOutputs);


router.post("/reject", ...protect, controller.rejectOutputs);


router.get("/summary/:userId", ...protect, controller.getUserSummary);


router.get("/matrix", ...protect, controller.getMatrix);


router.get("/my-team", ...protect, controller.getMyTeamMembers);

module.exports = router;

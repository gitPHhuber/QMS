const Router = require("express");
const router = new Router();
const validationController = require("../controllers/validationController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/stats", ...protect, validationController.getStats);

router.get("/", ...protect, validationController.getAll);
router.get("/:id", ...protect, validationController.getOne);
router.post("/", ...protect, validationController.create);
router.put("/:id", ...protect, validationController.update);

module.exports = router;

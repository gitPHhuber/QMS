const Router = require("express");
const router = new Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/stats", ...protect, productController.getStats);

router.get("/", ...protect, productController.getAll);
router.get("/:id", ...protect, productController.getOne);
router.post("/", ...protect, productController.create);
router.put("/:id", ...protect, productController.update);

module.exports = router;

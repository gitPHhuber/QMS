

const Router = require("express");
const router = new Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  exportPassports,
  getExportStats,
  getExportPreview,
  exportSinglePassport,
  exportSelectedPassports,
  exportBatchPassports
} = require("../controllers/beryll/passportsExportController");


router.use(authMiddleware);


router.post("/", exportPassports);


router.get("/stats", getExportStats);


router.get("/preview", getExportPreview);


router.get("/single/:serverId", exportSinglePassport);


router.post("/selected", exportSelectedPassports);


router.get("/batch/:batchId", exportBatchPassports);

module.exports = router;

const Router = require("express");
const router = new Router();
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");


const protect = [
    authMiddleware,
    syncUserMiddleware,
    checkAbility("rbac.manage")
];

router.get("/", ...protect, auditController.getLogs);

module.exports = router;

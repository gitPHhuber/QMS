const Router = require("express");
const router = new Router();
const DefectController915 = require("../controllers/defect915Controller");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.post(
    "/",
    ...protect,
    checkAbility("defect.manage"),
    DefectController915.postDefect
);

router.get("/", DefectController915.getDefects);


router.put(
    "/",
    ...protect,
    checkAbility("defect.manage"),
    DefectController915.updateDefect
);


router.delete(
    "/:id",
    ...protect,
    checkAbility("defect.manage"),
    DefectController915.deleteDefect
);

module.exports = router;

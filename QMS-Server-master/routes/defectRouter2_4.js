const Router = require("express");
const router = new Router();
const DefectController2_4 = require("../controllers/defect2_4Controller");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.post(
    "/",
    ...protect,
    checkAbility("defect.manage"),
    DefectController2_4.postDefect
);


router.get("/", DefectController2_4.getDefects);


router.put(
    "/",
    ...protect,
    checkAbility("defect.manage"),
    DefectController2_4.updateDefect
);


router.delete(
    "/:id",
    ...protect,
    checkAbility("defect.manage"),
    DefectController2_4.deleteDefect
);

module.exports = router;

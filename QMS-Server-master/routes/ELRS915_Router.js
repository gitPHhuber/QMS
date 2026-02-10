const Router = require("express");
const router = new Router();
const ELRS915_Controller = require("../controllers/ELRS915_Controller");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.post(
    "/",
    ...protect,
    checkAbility("firmware.flash"),
    ELRS915_Controller.postBoard
);

router.post(
    "/addManyDefect915",
    ...protect,
    checkAbility("firmware.flash"),
    ELRS915_Controller.postManyDefect915
);


router.post(
    "/deleteManyDefect915",
    ...protect,
    checkAbility("defect.manage"),
    ELRS915_Controller.deleteManyDefect915
);

router.delete(
    "/byDBid/:id",
    ...protect,
    checkAbility("defect.manage"),
    ELRS915_Controller.deleteBoardByDBid
);


router.get(
    "/",
    ...protect,
    checkAbility("devices.view"),
    ELRS915_Controller.getBoards
);


router.put(
    "/",
    ...protect,
    checkAbility("defect.manage"),
    ELRS915_Controller.updateBoard
);

module.exports = router;

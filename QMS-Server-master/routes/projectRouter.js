const Router = require("express");
const router = new Router();
const controller = require("../controllers/ProjectController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.post(
    "/",
    ...protect,
    checkAbility("recipe.manage"),
    controller.create
);


router.get(
    "/",
    ...protect,
    controller.getAll
);


router.delete(
    "/:id",
    ...protect,
    checkAbility("recipe.manage"),
    controller.delete
);

module.exports = router;

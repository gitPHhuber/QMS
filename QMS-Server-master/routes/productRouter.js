const Router = require("express");
const router = new Router();
const ProductController = require("../controllers/product_componentController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];


router.post(
    "/products",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.createProduct
);

router.put(
    "/products/:id",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.updateProduct
);

router.delete(
    "/products/:id",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.deleteProduct
);


router.get(
    "/products",
    ...protect,
    ProductController.getProducts
);

router.get(
    "/products/:id",
    ...protect,
    ProductController.getProductById
);


router.post(
    "/components",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.createComponent
);

router.put(
    "/components/:id",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.updateComponent
);

router.delete(
    "/components/:id",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.deleteComponent
);

router.get(
    "/components",
    ...protect,
    ProductController.getComponents
);


router.post(
    "/statuses",
    ...protect,
    checkAbility("recipe.manage"),
    ProductController.createStatus
);

router.get(
    "/statuses",
    ...protect,
    ProductController.getStatuses
);

module.exports = router;

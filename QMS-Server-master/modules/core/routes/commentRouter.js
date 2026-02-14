const Router = require("express");
const router = new Router({ mergeParams: true });
const CommentController = require("../controllers/CommentController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/", ...protect, CommentController.getComments);
router.post("/", ...protect, CommentController.createComment);
router.patch("/:commentId", ...protect, CommentController.updateComment);
router.delete("/:commentId", ...protect, CommentController.deleteComment);

module.exports = router;

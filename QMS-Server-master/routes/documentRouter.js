/**
 * documentRouter.js — Роуты системы управления документами
 * 
 * НОВЫЙ ФАЙЛ: routes/documentRouter.js
 * 
 * Подключение в routes/index.js:
 *   const documentRouter = require("./documentRouter");
 *   router.use("/documents", documentRouter);
 * 
 * Права доступа (abilities):
 *   dms.view     — просмотр реестра и документов
 *   dms.create   — создание документов и версий
 *   dms.approve  — согласование и утверждение
 *   dms.manage   — введение в действие, рассылка, управление
 */

const Router = require("express");
const router = new Router();
const documentController = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// ── Чтение (dms.view) ──
router.get("/",        ...protect, checkAbility("dms.view"), documentController.getAll);
router.get("/stats",   ...protect, checkAbility("dms.view"), documentController.getStats);
router.get("/pending", ...protect, documentController.getPending); // Только свои
router.get("/overdue", ...protect, checkAbility("dms.manage"), documentController.getOverdue);
router.get("/:id",     ...protect, checkAbility("dms.view"), documentController.getOne);

// ── Создание (dms.create) ──
router.post("/",                       ...protect, checkAbility("dms.create"), documentController.create);
router.post("/:id/versions",          ...protect, checkAbility("dms.create"), documentController.createVersion);
router.post("/versions/:id/upload",   ...protect, checkAbility("dms.create"), documentController.uploadFile);

// ── Согласование (dms.approve) ──
router.post("/versions/:id/submit",   ...protect, checkAbility("dms.create"), documentController.submitForReview);
router.post("/approvals/:id/decide",  ...protect, documentController.decide); // Проверка assignedTo внутри

// ── Управление (dms.manage) ──
router.post("/versions/:id/effective",  ...protect, checkAbility("dms.manage"), documentController.makeEffective);
router.post("/versions/:id/distribute", ...protect, checkAbility("dms.manage"), documentController.distribute);

// ── Ознакомление (для всех авторизованных) ──
router.post("/distributions/:id/ack", ...protect, documentController.acknowledge);

module.exports = router;

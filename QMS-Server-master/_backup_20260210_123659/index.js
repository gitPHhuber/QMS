
const Router = require("express");
const router = new Router();


const userRouter = require("./userRouter");
const sessionRouter = require("./sessionRouter");
const pcRouter = require("./pcRouter");


const rbacRouter = require("./rbacRouter");
const structureRouter = require("./structureRouter");
const auditRouter = require("./auditRouter");


const warehouseRouter = require("./warehouseRouter");


const assemblyRouter = require("./assemblyRouter");
const assemblyRecipeRouter = require("./assemblyRecipeRouter");


const taskRouter = require("./taskRouter");
const projectRouter = require("./projectRouter");


const fcRouter = require("./fcRouter");
const ELRS915_Router = require("./ELRS915_Router");
const ELRS2_4_Router = require("./ELRS2_4_Router");
const coralB_router = require("./CoralBRouter");
const passportsExportRouter = require("./passportsExportRoutes");

const defectRouter = require("./defectRouter");
const defectRouter915 = require("./defectRouter915");
const defectRouter2_4 = require("./defectRouter2_4");
const defectRouter_CoralB = require("./defectRouterCoralB");


const beryllRouter = require("./beryllRouter");
const beryllExtendedRouter = require("./beryllExtendedRouter");


const defectSystemRouter = require("./defectSystemRouter");

const productionOutputRouter = require("./productionOutputRouter");

// QMS модули
const documentRouter = require("./documentRouter");
const ncCapaRouter = require("./ncCapaRouter");


router.use("/users", userRouter);
router.use("/sessions", sessionRouter);
router.use("/pcs", pcRouter);


router.use("/rbac", rbacRouter);
router.use("/structure", structureRouter);
router.use("/audit", auditRouter);


router.use("/warehouse", warehouseRouter);


router.use("/assembly", assemblyRouter);
router.use("/assembly/recipes", assemblyRecipeRouter);


router.use("/tasks", taskRouter);
router.use("/projects", projectRouter);


router.use("/fcs", fcRouter);
router.use("/ELRS915", ELRS915_Router);
router.use("/ELRS2-4", ELRS2_4_Router);
router.use("/Coral-B", coralB_router);


router.use("/defectsFC", defectRouter);
router.use("/defects915", defectRouter915);
router.use("/defects2-4", defectRouter2_4);
router.use("/defects-Coral-B", defectRouter_CoralB);


router.use("/beryll", beryllRouter);
router.use("/beryll", beryllExtendedRouter);
router.use("/beryll/export/passports", passportsExportRouter);


router.use("/defects", defectSystemRouter);

router.use("/production", productionOutputRouter);

// QMS: Document Management System
router.use("/documents", documentRouter);
// QMS: Nonconformity + CAPA
router.use("/nc", ncCapaRouter);

module.exports = router;

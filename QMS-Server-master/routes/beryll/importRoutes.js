

const Router = require("express");
const router = new Router();

const ImportController = require("../controllers/ImportController");
const authMiddleware = require("../../../middleware/authMiddleware");
const checkAbilityMiddleware = require("../../../middleware/checkAbilityMiddleware");


router.post("/server-components",
    authMiddleware,
    checkAbilityMiddleware("beryll_admin"),
    ImportController.importServerComponents
);


router.post("/defect-records",
    authMiddleware,
    checkAbilityMiddleware("beryll_admin"),
    ImportController.importDefectRecords
);


router.get("/template/server-components",
    authMiddleware,
    ImportController.downloadServerComponentsTemplate
);

router.get("/template/defect-records",
    authMiddleware,
    ImportController.downloadDefectRecordsTemplate
);

module.exports = router;

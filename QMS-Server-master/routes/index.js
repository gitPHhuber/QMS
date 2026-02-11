const Router = require("express");
const path = require("path");
const fs = require("fs");
const router = new Router();
const { moduleManager } = require("../config/modules");
const checkModule = require("../middleware/checkModuleMiddleware");

// 1. Core routes (always)
const coreModule = require("../modules/core");
coreModule.register(router);

// 2. Conditional module routes
const MODULE_DIRS = {
  'qms.dms':       'qms-dms',
  'qms.nc':        'qms-nc',
  'qms.risk':      'qms-risk',
  'qms.supplier':  'qms-supplier',
  'qms.audit':     'qms-audit',
  'qms.training':  'qms-training',
  'qms.equipment': 'qms-equipment',
  'qms.review':    'qms-review',
  'wms.warehouse': 'wms',
};

const loadedDirs = new Set();

for (const [moduleCode, dirName] of Object.entries(MODULE_DIRS)) {
  if (loadedDirs.has(dirName)) continue;
  if (moduleManager.isEnabled(moduleCode)) {
    const indexPath = path.join(__dirname, '..', 'modules', dirName, 'index.js');
    if (fs.existsSync(indexPath)) {
      const mod = require(indexPath);
      if (typeof mod.register === 'function') {
        mod.register(router);
        console.log(`  Routes: ${dirName}`);
      }
      loadedDirs.add(dirName);
    }
  }
}

// 3. System API (always)
router.get("/system/modules", (req, res) => {
  res.json(moduleManager.toClientConfig());
});

module.exports = router;

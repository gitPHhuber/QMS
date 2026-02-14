const path = require('path');
const fs = require('fs');
const { moduleManager } = require('../config/modules');

const modulesDir = path.join(__dirname, '..', 'modules');
const allModels = {};

// 1. Load Core models (always)
const coreModule = require('../modules/core');
Object.assign(allModels, coreModule.getModels());

// 2. Load enabled module models
const MODULE_DIRS = {
  'qms.dms':        'qms-dms',
  'qms.nc':         'qms-nc',
  'qms.capa':       'qms-nc',       // CAPA shares folder with NC
  'qms.risk':       'qms-risk',
  'qms.design':     'qms-design',
  'qms.supplier':   'qms-supplier',
  'qms.audit':      'qms-audit',
  'qms.training':   'qms-training',
  'qms.equipment':  'qms-equipment',
  'qms.review':     'qms-review',
  'qms.complaints': 'qms-complaints',
  'qms.changes':    'qms-change',
  'qms.validation': 'qms-validation',
  'qms.product':    'qms-product',
  'qms.dashboard':  'qms-dashboard',
  'core.esign':     'core-esign',
  'mes.dhr':        'mes-dhr',
  'mes.dmr':        'mes-dmr',
  'mes.routes':     'mes-routes',
  'mes.orders':     'mes-orders',
  'mes.quality':    'mes-quality',
  'mes.kpi':        'mes-kpi',
  'wms.warehouse':  'wms',
};

const loadedDirs = new Set();

for (const [moduleCode, dirName] of Object.entries(MODULE_DIRS)) {
  if (loadedDirs.has(dirName)) continue;
  if (moduleManager.isEnabled(moduleCode)) {
    const indexPath = path.join(modulesDir, dirName, 'index.js');
    if (fs.existsSync(indexPath)) {
      const mod = require(indexPath);
      if (typeof mod.getModels === 'function') {
        Object.assign(allModels, mod.getModels());
      }
      loadedDirs.add(dirName);
    }
  }
}

// 3. Setup associations — core first, then modules
coreModule.setupAssociations(allModels);

for (const dirName of loadedDirs) {
  const indexPath = path.join(modulesDir, dirName, 'index.js');
  const mod = require(indexPath);
  if (typeof mod.setupAssociations === 'function') {
    mod.setupAssociations(allModels);
  }
}

module.exports = allModels;

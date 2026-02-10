const { moduleManager } = require('../config/modules');
const ApiError = require('../error/ApiError');

/**
 * Middleware: blocks request if module is disabled.
 * Usage: router.use("/documents", checkModule('qms.dms'), documentRouter);
 */
module.exports = function checkModule(moduleCode) {
  return function (req, res, next) {
    if (moduleManager.isEnabled(moduleCode)) {
      return next();
    }
    return next(ApiError.forbidden(
      `Модуль "${moduleCode}" не включён в текущий тариф (${moduleManager.tier}).`
    ));
  };
};

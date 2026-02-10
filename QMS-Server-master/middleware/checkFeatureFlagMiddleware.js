const { moduleManager } = require('../config/modules');
const ApiError = require('../error/ApiError');

/**
 * Middleware: blocks request if a feature flag is disabled.
 * Works for any scope (global, module, experiment).
 *
 * Usage: router.use("/beta-feature", checkFeatureFlag('beta.new-editor'), betaRouter);
 */
module.exports = function checkFeatureFlag(flagCode) {
  return function (req, res, next) {
    if (moduleManager.flagEnabled(flagCode)) {
      return next();
    }
    return next(ApiError.forbidden(
      `Feature "${flagCode}" is not enabled.`
    ));
  };
};

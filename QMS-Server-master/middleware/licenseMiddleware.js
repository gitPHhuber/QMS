const { licenseService } = require('../services/LicenseService');
const ApiError = require('../error/ApiError');

/**
 * Middleware: blocks write operations (POST, PUT, PATCH, DELETE) when license is expired.
 * Read operations (GET, HEAD, OPTIONS) are always allowed.
 */
module.exports = function checkLicenseWrite(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  if (licenseService.isWriteAllowed()) {
    return next();
  }
  return next(ApiError.forbidden(
    'Лицензия истекла. Доступ только на чтение. Обновите лицензию для продолжения работы.'
  ));
};

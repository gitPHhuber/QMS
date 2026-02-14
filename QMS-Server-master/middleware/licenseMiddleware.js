/**
 * License middleware: enforces read-only mode when license is expired beyond grace period.
 *
 * When active, only GET/HEAD/OPTIONS requests are allowed.
 * All mutating requests (POST/PUT/PATCH/DELETE) return 403.
 */

const licenseService = require('../services/LicenseService');
const ApiError = require('../error/ApiError');

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Endpoints exempt from read-only enforcement (license activation must always work)
const EXEMPT_PATHS = [
  '/api/system/license/activate',
  '/api/auth/refresh',
  '/api/auth/logout',
];

module.exports = function licenseMiddleware(req, res, next) {
  if (!licenseService.isReadOnly) {
    return next();
  }

  // Allow read-only methods
  if (READ_ONLY_METHODS.has(req.method)) {
    return next();
  }

  // Allow exempt paths (e.g., license activation)
  if (EXEMPT_PATHS.some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  return next(ApiError.forbidden(
    'Лицензия истекла. Система работает в режиме только для чтения. Обратитесь в ASVOTECH для продления.'
  ));
};

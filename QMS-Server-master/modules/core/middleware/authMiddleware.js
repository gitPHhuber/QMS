const { auth } = require('express-oauth2-jwt-bearer');
const AUTH_MODE = process.env.AUTH_MODE || 'keycloak';

if (AUTH_MODE === 'dev-bypass') {
  // Защита от случайного включения в продакшне
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL: AUTH_MODE=dev-bypass запрещён в production. Остановка.");
    process.exit(1);
  }
  // Для локальной разработки без Keycloak
  module.exports = (req, res, next) => {
    req.auth = {
      payload: {
        sub: 'dev-user-001',
        preferred_username: process.env.DEV_USER || 'developer',
        given_name: 'Dev',
        family_name: 'User',
        realm_access: { roles: [process.env.DEV_ROLE || 'SUPER_ADMIN'] }
      }
    };
    next();
  };
} else {
  const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'QMS-Realm';

  const checkJwt = auth({
    audience: 'account',
    issuerBaseURL: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    tokenSigningAlg: 'RS256'
  });
  module.exports = checkJwt;
}

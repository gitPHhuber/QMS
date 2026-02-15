/**
 * Refresh Token Middleware
 *
 * Handles token refresh for Keycloak OIDC sessions.
 * Provides endpoints for:
 * - POST /api/auth/refresh - Exchange refresh token for new access token
 * - POST /api/auth/logout  - Revoke refresh token
 */

const axios = require("axios");
const ApiError = require("../error/ApiError");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

function getTokenEndpoint() {
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
}

function getLogoutEndpoint() {
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(ApiError.badRequest("refresh_token обязателен"));
    }

    if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
      return next(ApiError.internal("Keycloak не настроен"));
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: KEYCLOAK_CLIENT_ID,
      refresh_token: token,
    });

    if (KEYCLOAK_CLIENT_SECRET) {
      params.append("client_secret", KEYCLOAK_CLIENT_SECRET);
    }

    const response = await axios.post(getTokenEndpoint(), params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    });

    return res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      refresh_expires_in: response.data.refresh_expires_in,
      token_type: response.data.token_type,
    });
  } catch (err) {
    if (err.response?.status === 400) {
      return next(ApiError.forbidden("Refresh token истёк или недействителен"));
    }
    console.error("Token refresh error:", err.message);
    return next(ApiError.internal("Ошибка обновления токена"));
  }
}

/**
 * Logout - revoke refresh token
 */
async function logoutToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(ApiError.badRequest("refresh_token обязателен"));
    }

    if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
      return res.json({ message: "Сессия завершена" });
    }

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      refresh_token: token,
    });

    if (KEYCLOAK_CLIENT_SECRET) {
      params.append("client_secret", KEYCLOAK_CLIENT_SECRET);
    }

    await axios.post(getLogoutEndpoint(), params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    }).catch(() => {}); // Ignore errors on logout

    return res.json({ message: "Сессия завершена" });
  } catch (err) {
    console.error("Logout error:", err.message);
    return res.json({ message: "Сессия завершена" });
  }
}

module.exports = { refreshToken, logoutToken };

const fs = require('fs');
const path = require('path');
const { verify, decodeBase64url } = require('./crypto');

/**
 * Verify a license token or file
 * @param {object} options
 * @param {string} options.publicKeyPath - Path to public.key
 * @param {string} [options.token] - License token string
 * @param {string} [options.file] - Path to .lic file
 * @returns {{ valid: boolean, payload: object|null, expired: boolean, inGrace: boolean, error: string|null }}
 */
function verifyLicense(options) {
  const { publicKeyPath, token, file } = options;

  const publicKeyB64 = fs.readFileSync(path.resolve(publicKeyPath), 'utf8').trim();
  const publicKey = decodeBase64url(publicKeyB64);

  let licenseToken = token;
  if (!licenseToken && file) {
    licenseToken = fs.readFileSync(path.resolve(file), 'utf8').trim();
  }

  if (!licenseToken) {
    return { valid: false, payload: null, expired: false, inGrace: false, error: 'No token or file provided' };
  }

  const result = verify(licenseToken, publicKey);

  if (!result.valid) {
    return { valid: false, payload: null, expired: false, inGrace: false, error: result.error };
  }

  const payload = result.payload;
  const now = Math.floor(Date.now() / 1000);
  const expired = payload.exp < now;
  const graceDays = payload.grace_days || 14;
  const graceEnd = payload.exp + graceDays * 86400;
  const inGrace = expired && now < graceEnd;

  return {
    valid: !expired || inGrace,
    payload,
    expired,
    inGrace,
    error: expired && !inGrace ? 'License expired (beyond grace period)' : null,
  };
}

module.exports = { verifyLicense };

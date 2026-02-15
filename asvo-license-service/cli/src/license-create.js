const fs = require('fs');
const path = require('path');
const { sign, decodeBase64url } = require('./crypto');

/**
 * Create a signed license file
 * @param {object} options
 * @param {string} options.privateKeyPath - Path to private.key
 * @param {string} options.org - Organization name
 * @param {string} options.tier - Tier (start|standard|pro|industry|corp)
 * @param {string[]} options.modules - Enabled modules
 * @param {number} options.maxUsers - Max users
 * @param {number} options.maxStorageGb - Max storage GB
 * @param {number} options.durationDays - License duration in days
 * @param {string} [options.fingerprint] - Hardware fingerprint
 * @param {number} [options.graceDays=14] - Grace period days
 * @param {string} [options.output] - Output .lic file path
 * @returns {string} - Signed license token
 */
function createLicense(options) {
  const {
    privateKeyPath,
    org,
    tier,
    modules,
    maxUsers,
    maxStorageGb,
    durationDays,
    fingerprint,
    graceDays = 14,
    output,
  } = options;

  const privateKeyB64 = fs.readFileSync(path.resolve(privateKeyPath), 'utf8').trim();
  const secretKey = decodeBase64url(privateKeyB64);

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + durationDays * 86400;

  const payload = {
    iss: 'asvo-license-service',
    sub: org,
    iat: now,
    exp: expiry,
    lid: generateLicenseId(),
    tier,
    modules,
    limits: {
      max_users: maxUsers,
      max_storage_gb: maxStorageGb,
    },
    fingerprint: fingerprint || null,
    grace_days: graceDays,
  };

  const token = sign(payload, secretKey);

  if (output) {
    const outPath = path.resolve(output);
    fs.writeFileSync(outPath, token, 'utf8');
    console.log(`License file written: ${outPath}`);
  }

  return token;
}

function generateLicenseId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'lic_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { createLicense };

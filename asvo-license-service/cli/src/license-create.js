const fs = require('fs');
const path = require('path');
const { sign, decodeBase64url } = require('./crypto');

const TIER_PRESETS = {
  start: {
    modules: ['qms.dms', 'qms.nc'],
    max_users: 5,
    max_storage_gb: 5,
  },
  standard: {
    modules: ['qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes', 'qms.complaints'],
    max_users: 15,
    max_storage_gb: 20,
  },
  pro: {
    modules: [
      'qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes',
      'qms.complaints', 'qms.supplier', 'qms.audit', 'qms.training',
      'qms.equipment', 'qms.review', 'qms.pms', 'qms.dashboard',
      'wms.warehouse', 'wms.movements', 'wms.inventory',
      'addon.mobile', 'addon.pdf',
    ],
    max_users: 50,
    max_storage_gb: 100,
  },
  industry: {
    modules: [
      'qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes',
      'qms.complaints', 'qms.supplier', 'qms.audit', 'qms.training',
      'qms.equipment', 'qms.review', 'qms.design', 'qms.validation',
      'qms.pms', 'qms.dashboard',
      'wms.warehouse', 'wms.movements', 'wms.inventory', 'wms.traceability',
      'mes.routes', 'mes.orders', 'mes.quality', 'mes.dhr',
      'addon.mobile', 'addon.pdf', 'addon.api',
    ],
    max_users: 200,
    max_storage_gb: 500,
  },
  corp: {
    modules: ['*'],
    max_users: 99999,
    max_storage_gb: 99999,
  },
};

/**
 * Create a signed license file
 * @param {object} options
 * @param {string} options.privateKeyPath - Path to private.key
 * @param {string} options.org - Organization name
 * @param {string} options.tier - Tier (start|standard|pro|industry|corp)
 * @param {string[]} [options.modules] - Enabled modules (auto-filled from tier preset if omitted)
 * @param {number} [options.maxUsers] - Max users (auto-filled from tier preset if omitted)
 * @param {number} [options.maxStorageGb] - Max storage GB (auto-filled from tier preset if omitted)
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
    durationDays,
    fingerprint,
    graceDays = 14,
    output,
  } = options;

  const preset = TIER_PRESETS[tier];
  if (!preset) {
    throw new Error(`Unknown tier: ${tier}. Available: ${Object.keys(TIER_PRESETS).join(', ')}`);
  }

  const modules = options.modules || preset.modules;
  const maxUsers = options.maxUsers != null ? options.maxUsers : preset.max_users;
  const maxStorageGb = options.maxStorageGb != null ? options.maxStorageGb : preset.max_storage_gb;

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

module.exports = { createLicense, TIER_PRESETS };

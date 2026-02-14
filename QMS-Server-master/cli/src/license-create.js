/**
 * als-cli license create — create a signed license key.
 */

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { signLicense, decodeKey } = require('./crypto');

const TIER_PRESETS = require('../../config/modules').TIER_PRESETS;

const TIER_DEFAULTS = {
  start:    { maxUsers: 5,   maxStorageGb: 5 },
  standard: { maxUsers: 15,  maxStorageGb: 20 },
  pro:      { maxUsers: 50,  maxStorageGb: 100 },
  industry: { maxUsers: 200, maxStorageGb: 500 },
  corp:     { maxUsers: 9999, maxStorageGb: 9999 },
};

function createLicense(options) {
  // Validate required options
  if (!options.key) {
    console.error('Error: --key <path-to-private.key> is required');
    process.exit(1);
  }
  if (!options.tier) {
    console.error('Error: --tier <start|standard|pro|industry|corp> is required');
    process.exit(1);
  }

  // Read private key
  const secretKeyB64 = fs.readFileSync(options.key, 'utf-8').trim();
  const secretKey = decodeKey(secretKeyB64);

  const tier = options.tier;
  const tierDefaults = TIER_DEFAULTS[tier] || TIER_DEFAULTS.corp;

  // Resolve modules: explicit list or from tier preset
  let modules;
  if (options.modules) {
    modules = options.modules.split(',').map(m => m.trim());
  } else if (TIER_PRESETS[tier]) {
    modules = [...TIER_PRESETS[tier]];
  } else {
    console.error(`Error: unknown tier "${tier}" and no --modules specified`);
    process.exit(1);
  }

  // Build payload
  const now = Math.floor(Date.now() / 1000);
  const months = parseInt(options.months, 10) || 12;
  const exp = now + months * 30 * 24 * 60 * 60;

  const payload = {
    exp,
    fingerprint: options.fingerprint || null,
    grace_days: parseInt(options.graceDays, 10) || 30,
    iat: now,
    iss: 'asvo-license-service',
    lid: uuidv4(),
    limits: {
      max_storage_gb: parseInt(options.storageGb, 10) || tierDefaults.maxStorageGb,
      max_users: parseInt(options.maxUsers, 10) || tierDefaults.maxUsers,
    },
    modules: modules.sort(),
    sub: options.org || 'unknown',
    tier,
  };

  // Sign
  const licenseKey = signLicense(payload, secretKey);

  // Output
  if (options.output) {
    fs.writeFileSync(options.output, licenseKey, 'utf-8');
    console.log(`License created: ${options.output}`);
  } else {
    console.log(licenseKey);
  }

  // Print summary
  const validUntil = new Date(exp * 1000).toISOString().split('T')[0];
  console.log('');
  console.log('License details:');
  console.log(`  ID:          ${payload.lid}`);
  console.log(`  Org:         ${payload.sub}`);
  console.log(`  Tier:        ${tier}`);
  console.log(`  Modules:     ${modules.length} modules`);
  console.log(`  Max users:   ${payload.limits.max_users}`);
  console.log(`  Storage:     ${payload.limits.max_storage_gb} GB`);
  console.log(`  Valid until: ${validUntil}`);
  console.log(`  Grace days:  ${payload.grace_days}`);
  if (payload.fingerprint) {
    console.log(`  Fingerprint: ${payload.fingerprint}`);
  }
}

module.exports = createLicense;

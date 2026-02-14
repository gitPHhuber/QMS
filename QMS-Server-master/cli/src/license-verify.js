/**
 * als-cli license verify — verify a .lic file and print its contents.
 */

const fs = require('fs');
const { verifyLicense, decodeKey } = require('./crypto');

const TIER_NAMES = {
  start: 'Старт',
  standard: 'Стандарт',
  pro: 'Про',
  industry: 'Индустрия',
  corp: 'Корпорация',
};

function verify(options) {
  if (!options.file) {
    console.error('Error: --file <path-to-license.lic> is required');
    process.exit(1);
  }
  if (!options.pubkey) {
    console.error('Error: --pubkey <path-to-public.key> is required');
    process.exit(1);
  }

  // Read files
  const licenseStr = fs.readFileSync(options.file, 'utf-8').trim();
  const publicKeyB64 = fs.readFileSync(options.pubkey, 'utf-8').trim();
  const publicKey = decodeKey(publicKeyB64);

  // Verify
  const payload = verifyLicense(licenseStr, publicKey);

  if (!payload) {
    console.error('INVALID: License signature verification failed.');
    process.exit(1);
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  const expDate = new Date(payload.exp * 1000);
  const graceDays = payload.grace_days || 30;
  const graceExp = payload.exp + graceDays * 24 * 60 * 60;
  const daysRemaining = Math.ceil((payload.exp - now) / (24 * 60 * 60));
  const graceRemaining = Math.ceil((graceExp - now) / (24 * 60 * 60));

  let status;
  if (now < payload.exp) {
    status = 'ACTIVE';
  } else if (now < graceExp) {
    status = 'GRACE PERIOD';
  } else {
    status = 'EXPIRED';
  }

  console.log('License verification: VALID');
  console.log('');
  console.log(`  Status:       ${status}`);
  console.log(`  ID:           ${payload.lid}`);
  console.log(`  Org:          ${payload.sub}`);
  console.log(`  Tier:         ${TIER_NAMES[payload.tier] || payload.tier}`);
  console.log(`  Modules:      ${payload.modules.join(', ')}`);
  console.log(`  Max users:    ${payload.limits.max_users}`);
  console.log(`  Storage:      ${payload.limits.max_storage_gb} GB`);
  console.log(`  Issued:       ${new Date(payload.iat * 1000).toISOString().split('T')[0]}`);
  console.log(`  Expires:      ${expDate.toISOString().split('T')[0]}`);
  console.log(`  Grace days:   ${graceDays}`);
  console.log(`  Days left:    ${daysRemaining > 0 ? daysRemaining : `${graceRemaining} (grace)`}`);

  if (payload.fingerprint) {
    console.log(`  Fingerprint:  ${payload.fingerprint}`);
  }

  if (status === 'EXPIRED') {
    process.exit(2);
  }
}

module.exports = verify;

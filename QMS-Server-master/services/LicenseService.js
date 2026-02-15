const nacl = require('tweetnacl');
const fs = require('fs');
const path = require('path');

// --- Ed25519 crypto helpers (compatible with asvo-license-service CLI/backend) ---

function encodeBase64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64url(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function verifyToken(token, publicKey) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, payload: null, error: 'Invalid token format' };
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = decodeBase64url(signatureB64);
    const isValid = nacl.sign.detached.verify(messageBytes, signature, publicKey);
    if (!isValid) {
      return { valid: false, payload: null, error: 'Invalid signature' };
    }
    const payload = JSON.parse(Buffer.from(decodeBase64url(payloadB64)).toString('utf8'));
    return { valid: true, payload, error: null };
  } catch (err) {
    return { valid: false, payload: null, error: err.message };
  }
}

// --- LicenseService ---

class LicenseService {
  constructor() {
    this._state = {
      valid: false,
      tier: null,
      modules: [],
      limits: { max_users: 0, max_storage_gb: 0 },
      expired: false,
      inGrace: false,
      daysUntilExpiry: 0,
      payload: null,
      error: null,
    };
    this._publicKey = null;
    this._licenseFilePath = null;
    this._publicKeyPath = null;
  }

  async init() {
    this._licenseFilePath = process.env.LICENSE_FILE_PATH || path.join(process.cwd(), 'license.lic');
    this._publicKeyPath = process.env.LICENSE_PUBLIC_KEY_PATH || path.join(process.cwd(), 'keys', 'public.key');

    // Load public key
    try {
      const keyB64 = fs.readFileSync(this._publicKeyPath, 'utf8').trim();
      this._publicKey = new Uint8Array(decodeBase64url(keyB64));
    } catch (err) {
      console.warn(`[LicenseService] Public key not found at ${this._publicKeyPath}: ${err.message}`);
      console.warn('[LicenseService] Running in unlicensed mode (all modules available via MODULES_TIER)');
      this._state.error = 'Public key not found';
      return;
    }

    // Load and verify license
    this._loadLicense();
  }

  _loadLicense() {
    try {
      if (!fs.existsSync(this._licenseFilePath)) {
        console.warn(`[LicenseService] License file not found at ${this._licenseFilePath}`);
        console.warn('[LicenseService] Running in unlicensed mode');
        this._state = {
          valid: false, tier: null, modules: [], limits: { max_users: 0, max_storage_gb: 0 },
          expired: false, inGrace: false, daysUntilExpiry: 0, payload: null,
          error: 'License file not found',
        };
        return;
      }

      const token = fs.readFileSync(this._licenseFilePath, 'utf8').trim();
      const result = verifyToken(token, this._publicKey);

      if (!result.valid) {
        console.error(`[LicenseService] License verification failed: ${result.error}`);
        this._state = {
          valid: false, tier: null, modules: [], limits: { max_users: 0, max_storage_gb: 0 },
          expired: false, inGrace: false, daysUntilExpiry: 0, payload: null,
          error: result.error,
        };
        return;
      }

      const payload = result.payload;
      const now = Math.floor(Date.now() / 1000);
      const graceDays = payload.grace_days || 14;
      const graceEnd = payload.exp + graceDays * 86400;
      const expired = now > payload.exp;
      const inGrace = expired && now <= graceEnd;
      const fullyExpired = now > graceEnd;
      const daysUntilExpiry = Math.ceil((payload.exp - now) / 86400);

      this._state = {
        valid: !fullyExpired,
        tier: payload.tier,
        modules: payload.modules || [],
        limits: payload.limits || { max_users: 0, max_storage_gb: 0 },
        expired,
        inGrace,
        daysUntilExpiry,
        payload,
        error: fullyExpired ? 'License fully expired (past grace period)' : null,
      };

      if (fullyExpired) {
        console.error('[LicenseService] License has fully expired (past grace period). Read-only mode.');
      } else if (inGrace) {
        console.warn(`[LicenseService] License expired but in grace period. ${Math.ceil((graceEnd - now) / 86400)} grace days remaining.`);
      } else {
        console.log(`[LicenseService] License valid: tier=${payload.tier}, expires in ${daysUntilExpiry} days`);
      }
    } catch (err) {
      console.error(`[LicenseService] Error loading license: ${err.message}`);
      this._state = {
        valid: false, tier: null, modules: [], limits: { max_users: 0, max_storage_gb: 0 },
        expired: false, inGrace: false, daysUntilExpiry: 0, payload: null,
        error: err.message,
      };
    }
  }

  reload() {
    this._loadLicense();
  }

  getState() {
    return { ...this._state };
  }

  isModuleAllowed(moduleCode) {
    if (!this._state.valid && !this._state.payload) {
      // No license loaded — fall back to env-based modules (backward compatibility)
      return true;
    }
    if (this._state.modules.includes('*')) return true;
    return this._state.modules.includes(moduleCode);
  }

  isWriteAllowed() {
    if (!this._state.payload) {
      // No license loaded — allow writes (backward compatibility, unlicensed mode)
      return true;
    }
    return this._state.valid;
  }

  saveLicenseFile(fileBuffer) {
    const dir = path.dirname(this._licenseFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this._licenseFilePath, fileBuffer);
    this._loadLicense();
    return this.getState();
  }
}

const licenseService = new LicenseService();
module.exports = { licenseService, LicenseService };

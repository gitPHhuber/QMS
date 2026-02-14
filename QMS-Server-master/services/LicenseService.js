/**
 * LicenseService — reads, verifies, and manages Ed25519-signed license keys.
 *
 * License format: base64url(payload) + '.' + base64url(signature)
 * Verification uses tweetnacl Ed25519.
 *
 * Startup flow:
 *   1. LicenseService.init() — reads license from file/env, verifies signature
 *   2. LicenseService.applyToModuleManager(mm) — overrides modules/tier if license valid
 *
 * Backward compatible: if no license found, does nothing (env-based config preserved).
 */

const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

// ── Base64url helpers (same as cli/src/crypto.js) ──

function base64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return naclUtil.decodeBase64(b64);
}

// ── Tier display names ──

const TIER_NAMES = {
  start: 'Старт',
  standard: 'Стандарт',
  pro: 'Про',
  industry: 'Индустрия',
  corp: 'Корпорация',
};

class LicenseService {
  constructor() {
    this.payload = null;
    this.valid = false;
    this.error = null;
    this._status = null;
  }

  /**
   * Initialize: read license from file or env, verify signature.
   * Call once at server startup, before applyToModuleManager().
   */
  init() {
    const licenseStr = this._readLicense();
    if (!licenseStr) {
      // No license configured — backward compatible, env-based modules
      this.valid = false;
      this.error = null;
      this._status = null;
      console.log('[License] No license configured — using env-based module config.');
      return;
    }

    const publicKey = this._readPublicKey();
    if (!publicKey) {
      this.valid = false;
      this.error = 'Public key not found (set ALS_PUBLIC_KEY env or place config/als-public.key)';
      console.error(`[License] ${this.error}`);
      return;
    }

    const payload = this._verify(licenseStr, publicKey);
    if (!payload) {
      this.valid = false;
      this.error = 'License signature verification failed';
      console.error(`[License] ${this.error}`);
      return;
    }

    this.payload = payload;
    this.valid = true;
    this.error = null;
    this._status = this._computeStatus();

    const s = this._status;
    if (s.isReadOnly) {
      console.warn(`[License] EXPIRED (beyond grace). System will run in READ-ONLY mode.`);
    } else if (s.isGrace) {
      console.warn(`[License] Grace period active. ${s.daysRemaining} days until read-only.`);
    } else {
      console.log(`[License] Valid. Tier: ${s.tierName}, ${s.daysRemaining} days remaining.`);
    }
  }

  /**
   * Apply license data to ModuleManager.
   * Only if license is valid and not expired beyond grace.
   */
  applyToModuleManager(moduleManager) {
    if (!this.valid || !this.payload) return;

    moduleManager.applyLicense({
      tier: this.payload.tier,
      modules: this.payload.modules,
      limits: this.payload.limits,
      licenseInfo: this.getStatus(),
    });
  }

  /**
   * Re-initialize with a new license string. Used by the activate endpoint.
   */
  activate(licenseStr) {
    const publicKey = this._readPublicKey();
    if (!publicKey) {
      return { success: false, error: 'Public key not configured on server' };
    }

    const payload = this._verify(licenseStr, publicKey);
    if (!payload) {
      return { success: false, error: 'Invalid license: signature verification failed' };
    }

    // Write to file for persistence
    const licensePath = this._getLicenseFilePath();
    try {
      const dir = path.dirname(licensePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(licensePath, licenseStr.trim(), 'utf-8');
    } catch (err) {
      console.error('[License] Failed to write license file:', err.message);
      // Continue anyway — license is valid in memory
    }

    this.payload = payload;
    this.valid = true;
    this.error = null;
    this._status = this._computeStatus();

    return { success: true, status: this.getStatus() };
  }

  /**
   * Get current license status for API responses.
   */
  getStatus() {
    if (!this.valid || !this._status) {
      return {
        active: false,
        tier: null,
        tierName: null,
        validUntil: null,
        daysRemaining: null,
        isGrace: false,
        isReadOnly: false,
        modules: [],
        limits: { max_users: 0, max_storage_gb: 0 },
        error: this.error,
      };
    }
    return { ...this._status };
  }

  /**
   * Whether the system should be in read-only mode.
   */
  get isReadOnly() {
    return this._status?.isReadOnly || false;
  }

  // ── Private helpers ──

  _readLicense() {
    // 1. Env var takes precedence
    if (process.env.LICENSE_KEY) {
      return process.env.LICENSE_KEY.trim();
    }

    // 2. License file
    const filePath = this._getLicenseFilePath();
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }

    return null;
  }

  _getLicenseFilePath() {
    return process.env.LICENSE_FILE
      || path.join(__dirname, '..', 'config', 'license.lic');
  }

  _readPublicKey() {
    // 1. Env var
    if (process.env.ALS_PUBLIC_KEY) {
      try {
        return naclUtil.decodeBase64(process.env.ALS_PUBLIC_KEY.trim());
      } catch {
        return null;
      }
    }

    // 2. File
    const keyPath = path.join(__dirname, '..', 'config', 'als-public.key');
    if (fs.existsSync(keyPath)) {
      try {
        const b64 = fs.readFileSync(keyPath, 'utf-8').trim();
        return naclUtil.decodeBase64(b64);
      } catch {
        return null;
      }
    }

    return null;
  }

  _verify(licenseStr, publicKey) {
    const parts = licenseStr.trim().split('.');
    if (parts.length !== 2) return null;

    try {
      const payloadBytes = base64urlDecode(parts[0]);
      const signatureBytes = base64urlDecode(parts[1]);

      const valid = nacl.sign.detached.verify(payloadBytes, signatureBytes, publicKey);
      if (!valid) return null;

      const payloadStr = naclUtil.encodeUTF8(payloadBytes);
      return JSON.parse(payloadStr);
    } catch {
      return null;
    }
  }

  _computeStatus() {
    const p = this.payload;
    if (!p) return null;

    const now = Math.floor(Date.now() / 1000);
    const graceDays = p.grace_days || 30;
    const graceExp = p.exp + graceDays * 24 * 60 * 60;

    const isExpired = now >= p.exp;
    const isGrace = isExpired && now < graceExp;
    const isReadOnly = now >= graceExp;

    let daysRemaining;
    if (!isExpired) {
      daysRemaining = Math.ceil((p.exp - now) / (24 * 60 * 60));
    } else if (isGrace) {
      daysRemaining = Math.ceil((graceExp - now) / (24 * 60 * 60));
    } else {
      daysRemaining = 0;
    }

    return {
      active: true,
      tier: p.tier,
      tierName: TIER_NAMES[p.tier] || p.tier,
      validUntil: new Date(p.exp * 1000).toISOString(),
      daysRemaining,
      isGrace,
      isReadOnly,
      modules: p.modules || [],
      limits: p.limits || { max_users: 0, max_storage_gb: 0 },
      error: null,
    };
  }
}

// Singleton
const licenseService = new LicenseService();

module.exports = licenseService;

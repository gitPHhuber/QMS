/**
 * Shared Ed25519 crypto helpers for ALS license signing/verification.
 *
 * License format: base64url(payload) + '.' + base64url(signature)
 * Payload: canonical JSON (keys sorted alphabetically)
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

// ── Base64url encode/decode (RFC 4648 §5, no padding) ──

function base64urlEncode(uint8) {
  const b64 = naclUtil.encodeBase64(uint8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return naclUtil.decodeBase64(b64);
}

// ── Canonical JSON (keys sorted recursively) ──

function canonicalJSON(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJSON).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalJSON(obj[k]));
  return '{' + pairs.join(',') + '}';
}

// ── Ed25519 Key Generation ──

function generateKeypair() {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: kp.publicKey,   // 32 bytes
    secretKey: kp.secretKey,   // 64 bytes (contains public key in last 32)
  };
}

// ── Sign payload → license string ──

function signLicense(payload, secretKey) {
  const canonical = canonicalJSON(payload);
  const payloadBytes = naclUtil.decodeUTF8(canonical);
  const signature = nacl.sign.detached(payloadBytes, secretKey);

  const payloadB64 = base64urlEncode(payloadBytes);
  const signatureB64 = base64urlEncode(signature);

  return payloadB64 + '.' + signatureB64;
}

// ── Verify license string → payload or null ──

function verifyLicense(licenseString, publicKey) {
  const parts = licenseString.trim().split('.');
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

// ── Key serialization (base64 for storage) ──

function encodeKey(keyBytes) {
  return naclUtil.encodeBase64(keyBytes);
}

function decodeKey(keyString) {
  return naclUtil.decodeBase64(keyString.trim());
}

module.exports = {
  base64urlEncode,
  base64urlDecode,
  canonicalJSON,
  generateKeypair,
  signLicense,
  verifyLicense,
  encodeKey,
  decodeKey,
};

const nacl = require('tweetnacl');

/**
 * Base64url encode a Buffer or Uint8Array
 */
function encodeBase64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64url decode to Buffer
 */
function decodeBase64url(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

/**
 * Generate Ed25519 keypair
 * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array }}
 */
function generateKeyPair() {
  return nacl.sign.keyPair();
}

/**
 * Sign a payload object with Ed25519
 * @param {object} payload - JSON-serializable payload
 * @param {Uint8Array} secretKey - 64-byte Ed25519 secret key
 * @returns {string} - Base64url encoded: header.payload.signature (JWT-like)
 */
function sign(payload, secretKey) {
  const header = { alg: 'EdDSA', typ: 'JWT' };
  const headerB64 = encodeBase64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = encodeBase64url(Buffer.from(JSON.stringify(payload)));
  const message = `${headerB64}.${payloadB64}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  const signatureB64 = encodeBase64url(signature);
  return `${message}.${signatureB64}`;
}

/**
 * Verify a signed token and return payload if valid
 * @param {string} token - JWT-like token (header.payload.signature)
 * @param {Uint8Array} publicKey - 32-byte Ed25519 public key
 * @returns {{ valid: boolean, payload: object|null, error: string|null }}
 */
function verify(token, publicKey) {
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

module.exports = {
  encodeBase64url,
  decodeBase64url,
  generateKeyPair,
  sign,
  verify,
};

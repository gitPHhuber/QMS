import nacl from 'tweetnacl';
import fs from 'fs';
import { getConfig } from '../config';

export function encodeBase64url(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64url(str: string): Buffer {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function generateKeyPair() {
  return nacl.sign.keyPair();
}

export function sign(payload: object, secretKey: Uint8Array): string {
  const header = { alg: 'EdDSA', typ: 'JWT' };
  const headerB64 = encodeBase64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = encodeBase64url(Buffer.from(JSON.stringify(payload)));
  const message = `${headerB64}.${payloadB64}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  const signatureB64 = encodeBase64url(signature);
  return `${message}.${signatureB64}`;
}

export function verify(token: string, publicKey: Uint8Array): { valid: boolean; payload: any; error: string | null } {
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
  } catch (err: any) {
    return { valid: false, payload: null, error: err.message };
  }
}

let _privateKey: Uint8Array | null = null;
let _publicKey: Uint8Array | null = null;

export function getPrivateKey(): Uint8Array {
  if (!_privateKey) {
    const config = getConfig();
    const keyB64 = fs.readFileSync(config.ED25519_PRIVATE_KEY_PATH, 'utf8').trim();
    _privateKey = new Uint8Array(decodeBase64url(keyB64));
  }
  return _privateKey;
}

export function getPublicKey(): Uint8Array {
  if (!_publicKey) {
    const config = getConfig();
    const keyB64 = fs.readFileSync(config.ED25519_PUBLIC_KEY_PATH, 'utf8').trim();
    _publicKey = new Uint8Array(decodeBase64url(keyB64));
  }
  return _publicKey;
}

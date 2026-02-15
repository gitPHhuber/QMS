import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  sign,
  verify,
  encodeBase64url,
  decodeBase64url,
} from '../src/utils/crypto';

describe('crypto utilities', () => {
  describe('generateKeyPair', () => {
    it('returns an object with publicKey and secretKey', () => {
      const kp = generateKeyPair();
      expect(kp).toHaveProperty('publicKey');
      expect(kp).toHaveProperty('secretKey');
    });

    it('returns keys of correct byte length', () => {
      const kp = generateKeyPair();
      // Ed25519: public key 32 bytes, secret key 64 bytes
      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.secretKey).toBeInstanceOf(Uint8Array);
      expect(kp.publicKey.length).toBe(32);
      expect(kp.secretKey.length).toBe(64);
    });
  });

  describe('sign + verify roundtrip', () => {
    it('produces a token that verifies successfully with the matching public key', () => {
      const kp = generateKeyPair();
      const payload = { sub: 'test-org', tier: 'standard', modules: ['qms.dms'] };

      const token = sign(payload, kp.secretKey);

      // Token is three base64url segments separated by dots
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      const result = verify(token, kp.publicKey);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.payload).toMatchObject(payload);
    });

    it('preserves all payload fields through the roundtrip', () => {
      const kp = generateKeyPair();
      const payload = {
        iss: 'asvo-license-service',
        sub: 'OOO Gamma',
        iat: 1700000000,
        exp: 1703000000,
        lid: 'aaaa-bbbb-cccc',
        tier: 'pro',
        modules: ['qms.dms', 'qms.nc', 'qms.capa'],
        limits: { max_users: 50, max_storage_gb: 100 },
      };

      const token = sign(payload, kp.secretKey);
      const result = verify(token, kp.publicKey);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(payload);
    });
  });

  describe('verify with wrong public key', () => {
    it('returns valid: false when verified with a different key pair', () => {
      const kpSigner = generateKeyPair();
      const kpOther = generateKeyPair();

      const token = sign({ hello: 'world' }, kpSigner.secretKey);
      const result = verify(token, kpOther.publicKey);

      expect(result.valid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('verify with corrupted token', () => {
    it('returns valid: false when the signature segment is corrupted', () => {
      const kp = generateKeyPair();
      const token = sign({ data: 1 }, kp.secretKey);
      const parts = token.split('.');
      // Corrupt the signature by flipping characters
      parts[2] = parts[2].split('').reverse().join('');
      const corrupted = parts.join('.');

      const result = verify(corrupted, kp.publicKey);
      expect(result.valid).toBe(false);
      expect(result.payload).toBeNull();
    });

    it('returns valid: false when a segment is missing', () => {
      const result = verify('header.payload', generateKeyPair().publicKey);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('returns valid: false when the payload segment is tampered with', () => {
      const kp = generateKeyPair();
      const token = sign({ tier: 'start' }, kp.secretKey);
      const parts = token.split('.');
      // Replace payload with a different one
      const tamperedPayload = encodeBase64url(
        Buffer.from(JSON.stringify({ tier: 'corp' })),
      );
      parts[1] = tamperedPayload;
      const tampered = parts.join('.');

      const result = verify(tampered, kp.publicKey);
      expect(result.valid).toBe(false);
    });
  });

  describe('encodeBase64url / decodeBase64url roundtrip', () => {
    it('roundtrips arbitrary binary data correctly', () => {
      const original = new Uint8Array([0, 1, 2, 255, 254, 128, 63, 62, 61]);
      const encoded = encodeBase64url(original);
      const decoded = decodeBase64url(encoded);

      expect(Buffer.from(decoded)).toEqual(Buffer.from(original));
    });

    it('produces URL-safe output with no +, /, or = characters', () => {
      // Use data that would normally produce +, /, or = in standard base64
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) data[i] = i;

      const encoded = encodeBase64url(data);
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('roundtrips a UTF-8 string through Buffer', () => {
      const text = 'ASVO License Service - test payload with unicode: 42';
      const buf = Buffer.from(text, 'utf8');
      const encoded = encodeBase64url(buf);
      const decoded = decodeBase64url(encoded);

      expect(decoded.toString('utf8')).toBe(text);
    });
  });
});

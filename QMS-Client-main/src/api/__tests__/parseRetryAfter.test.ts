import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseRetryAfter } from '../rateLimitUtils';

describe('parseRetryAfter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses numeric seconds string', () => {
    expect(parseRetryAfter('120', null)).toBe(120);
  });

  it('parses zero seconds', () => {
    expect(parseRetryAfter('0', null)).toBe(0);
  });

  it('parses HTTP-date format', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const futureDate = new Date(now + 60_000).toUTCString();
    const result = parseRetryAfter(futureDate, null);
    expect(result).toBeGreaterThanOrEqual(59);
    expect(result).toBeLessThanOrEqual(61);
  });

  it('clamps past HTTP-date to at least 1 second', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const pastDate = new Date(now - 5000).toUTCString();
    expect(parseRetryAfter(pastDate, null)).toBe(1);
  });

  it('falls back to response body retryAfter', () => {
    expect(parseRetryAfter(null, { retryAfter: 45 })).toBe(45);
  });

  it('falls back to default when all inputs are invalid', () => {
    expect(parseRetryAfter(null, null)).toBe(2);
    expect(parseRetryAfter(undefined, null)).toBe(2);
    expect(parseRetryAfter(null, null, 5)).toBe(5);
  });

  it('falls back to default for non-date non-numeric string', () => {
    expect(parseRetryAfter('not-a-date-or-number', null)).toBe(2);
  });

  it('ignores negative body retryAfter', () => {
    expect(parseRetryAfter(null, { retryAfter: -10 })).toBe(2);
  });

  it('ignores zero body retryAfter', () => {
    expect(parseRetryAfter(null, { retryAfter: 0 })).toBe(2);
  });

  it('ignores non-number body retryAfter', () => {
    expect(parseRetryAfter(null, { retryAfter: 'abc' })).toBe(2);
  });

  it('prefers header over body', () => {
    expect(parseRetryAfter('30', { retryAfter: 90 })).toBe(30);
  });
});

/**
 * Parse the Retry-After header per RFC 7231 §7.1.3.
 *
 * The header value can be either:
 *   - delay-seconds  (e.g. "120")
 *   - HTTP-date      (e.g. "Fri, 14 Feb 2026 12:00:00 GMT")
 *
 * Falls back to the response body's `retryAfter` field, then to `defaultSeconds`.
 */
export function parseRetryAfter(
  headerValue: string | undefined | null,
  responseData: unknown,
  defaultSeconds: number = 2,
): number {
  if (headerValue) {
    // Try numeric seconds first
    const asNumber = Number(headerValue);
    if (!Number.isNaN(asNumber) && asNumber >= 0) {
      return asNumber;
    }

    // Try HTTP-date
    const dateMs = Date.parse(headerValue);
    if (!Number.isNaN(dateMs)) {
      const diffSeconds = Math.ceil((dateMs - Date.now()) / 1000);
      return Math.max(diffSeconds, 1);
    }
  }

  // Fallback to response body retryAfter
  const body = responseData as Record<string, unknown> | null | undefined;
  if (body && typeof body.retryAfter === 'number' && body.retryAfter > 0) {
    return body.retryAfter;
  }

  return defaultSeconds;
}

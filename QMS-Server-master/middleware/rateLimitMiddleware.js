/**
 * Rate Limiting Middleware
 *
 * In-memory rate limiter with sliding window.
 * For production with multiple instances, replace with Redis-based solution.
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      data.timestamps = data.timestamps.filter(t => now - t < data.windowMs);
      if (data.timestamps.length === 0) {
        this.requests.delete(key);
      }
    }
  }

  isRateLimited(key, windowMs, maxRequests) {
    const now = Date.now();
    let data = this.requests.get(key);

    if (!data) {
      data = { timestamps: [], windowMs };
      this.requests.set(key, data);
    }

    // Remove expired timestamps
    data.timestamps = data.timestamps.filter(t => now - t < windowMs);

    if (data.timestamps.length >= maxRequests) {
      return {
        limited: true,
        retryAfter: Math.ceil((data.timestamps[0] + windowMs - now) / 1000),
        remaining: 0,
      };
    }

    data.timestamps.push(now);
    return {
      limited: false,
      remaining: maxRequests - data.timestamps.length,
    };
  }
}

const limiter = new RateLimiter();

/**
 * Create rate limit middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in ms (default: 15 min)
 * @param {number} options.max - Max requests per window (default: 100)
 * @param {string} options.message - Error message
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 */
function rateLimit({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Слишком много запросов, попробуйте позже",
  keyGenerator = (req) => req.ip || req.connection.remoteAddress,
} = {}) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = limiter.isRateLimited(key, windowMs, max);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(result.remaining));

    if (result.limited) {
      res.set("Retry-After", String(result.retryAfter));
      res.set("X-RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + result.retryAfter));
      return res.status(429).json({
        message,
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

// Pre-configured limiters
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "500"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Слишком много попыток входа, попробуйте через 15 минут",
});

const signLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: "Слишком много попыток подписания, попробуйте через 5 минут",
});

module.exports = { rateLimit, apiLimiter, authLimiter, signLimiter };

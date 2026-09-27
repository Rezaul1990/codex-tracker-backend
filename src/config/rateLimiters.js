const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  legacyHeaders: false,
  max: 20,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

const emailRateLimiter = rateLimit({
  legacyHeaders: false,
  max: 10,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  windowMs: 60 * 60 * 1000,
});

module.exports = {
  authRateLimiter,
  emailRateLimiter,
};

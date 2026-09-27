const toMilliseconds = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const match = String(value).trim().match(/^(\d+)(ms|s|m|h|d)?$/);

  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = match[2] || "ms";
  const multipliers = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000,
  };

  return amount * multipliers[unit];
};

const env = {
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  accessTokenMaxAgeMs: toMilliseconds(process.env.ACCESS_TOKEN_EXPIRES_IN, 15 * 60 * 1000),
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  apiUrl: process.env.API_URL || "http://localhost:5001",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  emailFrom: process.env.EMAIL_FROM || "Codex Tracker <no-reply@example.com>",
  inviteTokenExpiryMs: toMilliseconds(process.env.INVITE_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
  nodeEnv: process.env.NODE_ENV || "development",
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  refreshTokenMaxAgeMs: toMilliseconds(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  resetTokenExpiryMs: toMilliseconds(process.env.RESET_TOKEN_EXPIRES_IN, 60 * 60 * 1000),
  verificationTokenExpiryMs: toMilliseconds(
    process.env.VERIFICATION_TOKEN_EXPIRES_IN,
    24 * 60 * 60 * 1000,
  ),
};

const validateAuthEnv = () => {
  const missing = [];

  if (!env.accessTokenSecret) {
    missing.push("ACCESS_TOKEN_SECRET");
  }

  if (!env.refreshTokenSecret) {
    missing.push("REFRESH_TOKEN_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required authentication environment variables: ${missing.join(", ")}`);
  }
};

module.exports = {
  env,
  toMilliseconds,
  validateAuthEnv,
};

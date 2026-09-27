const { COOKIE_NAMES } = require("../constants/auth");
const { env } = require("./env");

const baseCookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(COOKIE_NAMES.accessToken, accessToken, {
    ...baseCookieOptions,
    maxAge: env.accessTokenMaxAgeMs,
  });

  res.cookie(COOKIE_NAMES.refreshToken, refreshToken, {
    ...baseCookieOptions,
    maxAge: env.refreshTokenMaxAgeMs,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE_NAMES.accessToken, baseCookieOptions);
  res.clearCookie(COOKIE_NAMES.refreshToken, baseCookieOptions);
};

module.exports = {
  clearAuthCookies,
  setAuthCookies,
};

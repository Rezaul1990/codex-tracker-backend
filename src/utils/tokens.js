const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const generateOpaqueToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user, sessionId) =>
  jwt.sign(
    {
      role: user.role,
      sessionId,
      sub: user._id.toString(),
    },
    env.accessTokenSecret,
    {
      expiresIn: env.accessTokenExpiry,
    },
  );

const signRefreshToken = (user, sessionId) =>
  jwt.sign(
    {
      sessionId,
      sub: user._id.toString(),
      type: "refresh",
    },
    env.refreshTokenSecret,
    {
      expiresIn: env.refreshTokenExpiry,
    },
  );

const verifyAccessToken = (token) => jwt.verify(token, env.accessTokenSecret);

const verifyRefreshToken = (token) => jwt.verify(token, env.refreshTokenSecret);

module.exports = {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

const { COOKIE_NAMES } = require("../constants/auth");
const RefreshSession = require("../models/refreshSessionModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { hashToken, verifyAccessToken } = require("../utils/tokens");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies?.[COOKIE_NAMES.accessToken];

  if (!accessToken) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  let payload;

  try {
    payload = verifyAccessToken(accessToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token", "UNAUTHORIZED");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  const session = await RefreshSession.findById(payload.sessionId);

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new ApiError(401, "Authentication session is no longer active", "UNAUTHORIZED");
  }

  req.user = {
    email: user.email,
    id: user._id.toString(),
    name: user.name,
    role: user.role,
    sessionId: payload.sessionId,
  };

  next();
});

const requireRefreshSession = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required", "UNAUTHORIZED");
  }

  const session = await RefreshSession.findOne({
    refreshTokenHash: hashToken(refreshToken),
    revokedAt: null,
  });

  if (!session || session.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid refresh session", "UNAUTHORIZED");
  }

  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
    return;
  }

  if (!roles.includes(req.user.role)) {
    next(new ApiError(403, "Forbidden", "FORBIDDEN"));
    return;
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireRefreshSession,
};

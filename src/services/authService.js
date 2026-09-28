const { env } = require("../config/env");
const Invitation = require("../models/invitationModel");
const PasswordResetToken = require("../models/passwordResetTokenModel");
const RefreshSession = require("../models/refreshSessionModel");
const User = require("../models/userModel");
const VerificationToken = require("../models/verificationTokenModel");
const ApiError = require("../utils/apiError");
const { comparePassword, hashPassword } = require("../utils/password");
const {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokens");
const emailService = require("./emailService");

const getExpiryDate = (durationMs) => new Date(Date.now() + durationMs);

const buildUrl = (path, token) => {
  const url = new URL(path, env.appUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const createVerificationToken = async (user) => {
  await VerificationToken.updateMany({ user: user._id, usedAt: null }, { usedAt: new Date() });

  const token = generateOpaqueToken();

  await VerificationToken.create({
    expiresAt: getExpiryDate(env.verificationTokenExpiryMs),
    tokenHash: hashToken(token),
    user: user._id,
  });

  return token;
};

const createAuthSession = async (user, userAgent = "") => {
  const session = await RefreshSession.create({
    expiresAt: getExpiryDate(env.refreshTokenMaxAgeMs),
    refreshTokenHash: "pending",
    user: user._id,
    userAgent,
  });

  const accessToken = signAccessToken(user, session._id.toString());
  const refreshToken = signRefreshToken(user, session._id.toString());

  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return {
    accessToken,
    refreshToken,
    user: user.toSafeObject(),
  };
};

const getAllowedInviteRoles = (inviterRole) => {
  if (inviterRole === "admin") {
    return ["manager", "member"];
  }

  if (inviterRole === "manager") {
    return ["member"];
  }

  return [];
};

const inviteUser = async ({ invitedBy, inviterRole, name, email, role }) => {
  const allowedRoles = getAllowedInviteRoles(inviterRole);

  if (!allowedRoles.includes(role)) {
    throw new ApiError(403, "You cannot invite a user with this role", "FORBIDDEN");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists", "CONFLICT");
  }

  await Invitation.updateMany({ email, acceptedAt: null }, { acceptedAt: new Date() });

  const token = generateOpaqueToken();
  const invitation = await Invitation.create({
    email,
    expiresAt: getExpiryDate(env.inviteTokenExpiryMs),
    invitedBy,
    name,
    role,
    tokenHash: hashToken(token),
  });

  await emailService.sendInvitationEmail({
    email,
    inviteUrl: buildUrl("/auth/invite", token),
  });

  return {
    id: invitation._id.toString(),
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    inviteUrl: buildUrl("/auth/invite", token),
    name: invitation.name,
    role: invitation.role,
    token,
  };
};

const acceptInvitation = async ({ name, password, token }) => {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });

  if (!invitation || invitation.acceptedAt) {
    throw new ApiError(400, "Invalid invitation token", "INVALID_TOKEN");
  }

  if (invitation.expiresAt < new Date()) {
    throw new ApiError(400, "Invitation token has expired", "EXPIRED_TOKEN");
  }

  const existingUser = await User.findOne({ email: invitation.email });

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists", "CONFLICT");
  }

  const user = await User.create({
    emailVerifiedAt: new Date(),
    email: invitation.email,
    name: name || invitation.name,
    passwordHash: await hashPassword(password),
    role: invitation.role,
  });

  invitation.acceptedAt = new Date();
  await invitation.save();

  return user.toSafeObject();
};

const login = async ({ email, password, userAgent }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!user.emailVerifiedAt) {
    throw new ApiError(403, "Please verify your email before logging in", "EMAIL_NOT_VERIFIED");
  }

  return createAuthSession(user, userAgent);
};

const refreshAuth = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Missing refresh token", "UNAUTHORIZED");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_TOKEN");
  }

  const session = await RefreshSession.findById(payload.sessionId);

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    session.refreshTokenHash !== hashToken(refreshToken)
  ) {
    throw new ApiError(401, "Invalid refresh session", "INVALID_TOKEN");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, "Invalid refresh session", "INVALID_TOKEN");
  }

  const accessToken = signAccessToken(user, session._id.toString());
  const nextRefreshToken = signRefreshToken(user, session._id.toString());

  session.refreshTokenHash = hashToken(nextRefreshToken);
  session.expiresAt = getExpiryDate(env.refreshTokenMaxAgeMs);
  await session.save();

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    user: user.toSafeObject(),
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshSession.findByIdAndUpdate(payload.sessionId, {
      revokedAt: new Date(),
    });
  } catch (error) {
    // Logout should remain idempotent and should not reveal token validity.
  }
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(401, "Authenticated user no longer exists", "UNAUTHORIZED");
  }

  return user.toSafeObject();
};

const verifyEmail = async (token) => {
  const verificationToken = await VerificationToken.findOne({ tokenHash: hashToken(token) }).populate(
    "user",
  );

  if (!verificationToken || verificationToken.usedAt) {
    throw new ApiError(400, "Invalid verification token", "INVALID_TOKEN");
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new ApiError(400, "Verification token has expired", "EXPIRED_TOKEN");
  }

  if (!verificationToken.user.emailVerifiedAt) {
    verificationToken.user.emailVerifiedAt = new Date();
    await verificationToken.user.save();
  }

  verificationToken.usedAt = new Date();
  await verificationToken.save();

  return verificationToken.user.toSafeObject();
};

const resendVerification = async (email) => {
  const user = await User.findOne({ email });

  if (!user || user.emailVerifiedAt) {
    return;
  }

  const token = await createVerificationToken(user);

  await emailService.sendVerificationEmail({
    email: user.email,
    verifyUrl: buildUrl("/auth/verify-email", token),
  });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return;
  }

  await PasswordResetToken.updateMany({ user: user._id, usedAt: null }, { usedAt: new Date() });

  const token = generateOpaqueToken();

  await PasswordResetToken.create({
    expiresAt: getExpiryDate(env.resetTokenExpiryMs),
    tokenHash: hashToken(token),
    user: user._id,
  });

  await emailService.sendPasswordResetEmail({
    email: user.email,
    resetUrl: buildUrl("/auth/reset-password", token),
  });
};

const resetPassword = async ({ password, token }) => {
  const resetToken = await PasswordResetToken.findOne({ tokenHash: hashToken(token) }).populate("user");

  if (!resetToken || resetToken.usedAt) {
    throw new ApiError(400, "Invalid reset token", "INVALID_TOKEN");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new ApiError(400, "Reset token has expired", "EXPIRED_TOKEN");
  }

  resetToken.user.passwordHash = await hashPassword(password);
  await resetToken.user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await RefreshSession.updateMany(
    { user: resetToken.user._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  return resetToken.user.toSafeObject();
};

module.exports = {
  acceptInvitation,
  forgotPassword,
  getCurrentUser,
  inviteUser,
  login,
  logout,
  refreshAuth,
  resendVerification,
  resetPassword,
  verifyEmail,
};

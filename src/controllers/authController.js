const { clearAuthCookies, setAuthCookies } = require("../config/cookies");
const { COOKIE_NAMES } = require("../constants/auth");
const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");

const inviteUser = asyncHandler(async (req, res) => {
  const invitation = await authService.inviteUser({
    ...req.validatedBody,
    invitedBy: req.user.id,
    inviterRole: req.user.role,
  });

  res.status(201).json({
    data: invitation,
    message: "Invitation created",
  });
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const user = await authService.acceptInvitation(req.validatedBody);

  res.status(201).json({
    data: user,
    message: "Account created. You can log in now.",
  });
});

const login = asyncHandler(async (req, res) => {
  const auth = await authService.login({
    ...req.validatedBody,
    userAgent: req.get("user-agent") || "",
  });

  setAuthCookies(res, auth);

  res.json({
    data: auth.user,
    message: "Logged in",
  });
});

const refresh = asyncHandler(async (req, res) => {
  const auth = await authService.refreshAuth(req.cookies?.[COOKIE_NAMES.refreshToken]);

  setAuthCookies(res, auth);

  res.json({
    data: auth.user,
    message: "Authentication refreshed",
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[COOKIE_NAMES.refreshToken]);
  clearAuthCookies(res);

  res.json({
    message: "Logged out",
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.json({
    data: user,
  });
});

const users = asyncHandler(async (req, res) => {
  const safeUsers = await authService.listUsers(req.user);

  res.json({
    data: safeUsers,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.validatedBody.token);

  res.json({
    data: user,
    message: "Email verified",
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.validatedBody.email);

  res.json({
    message: "If the account needs verification, a new email has been sent.",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.validatedBody.email);

  res.json({
    message: "If an account exists for this email, password reset instructions have been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.validatedBody);
  clearAuthCookies(res);

  res.json({
    message: "Password reset successful. Please log in again.",
  });
});

module.exports = {
  acceptInvitation,
  forgotPassword,
  inviteUser,
  login,
  logout,
  me,
  refresh,
  resendVerification,
  resetPassword,
  verifyEmail,
  users,
};

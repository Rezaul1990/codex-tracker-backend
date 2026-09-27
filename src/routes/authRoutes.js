const express = require("express");

const authController = require("../controllers/authController");
const { authRateLimiter, emailRateLimiter } = require("../config/rateLimiters");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  acceptInvitationValidator,
  emailValidator,
  invitationRequestValidator,
  loginValidator,
  resetPasswordValidator,
  tokenValidator,
} = require("../validators/authValidators");

const router = express.Router();

router.post(
  "/invitations",
  authRateLimiter,
  authenticate,
  authorize("admin", "manager"),
  validateRequest(invitationRequestValidator),
  authController.inviteUser,
);
router.post(
  "/invitations/accept",
  authRateLimiter,
  validateRequest(acceptInvitationValidator),
  authController.acceptInvitation,
);
router.post("/login", authRateLimiter, validateRequest(loginValidator), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authRateLimiter, authController.refresh);
router.get("/me", authenticate, authController.me);
router.post(
  "/verify-email",
  emailRateLimiter,
  validateRequest(tokenValidator),
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  emailRateLimiter,
  validateRequest(emailValidator),
  authController.resendVerification,
);
router.post(
  "/forgot-password",
  emailRateLimiter,
  validateRequest(emailValidator),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  emailRateLimiter,
  validateRequest(resetPasswordValidator),
  authController.resetPassword,
);

module.exports = router;

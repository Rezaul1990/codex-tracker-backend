const { USER_ROLES } = require("../constants/auth");
const ApiError = require("../utils/apiError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validateEmail = (email) => emailPattern.test(normalizeEmail(email));

const validatePassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

const assertRequiredString = (value, field) => {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required`, "VALIDATION_ERROR");
  }
};

const invitationRequestValidator = (body) => {
  const email = normalizeEmail(body.email);

  if (!validateEmail(email)) {
    throw new ApiError(400, "A valid email is required", "VALIDATION_ERROR");
  }

  if (!USER_ROLES.includes(body.role)) {
    throw new ApiError(400, "A valid role is required", "VALIDATION_ERROR");
  }

  return {
    email,
    name: String(body.name || "").trim(),
    role: body.role,
  };
};

const acceptInvitationValidator = (body) => {
  assertRequiredString(body.token, "token");
  assertRequiredString(body.name, "name");

  if (!validatePassword(body.password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and include letters and numbers",
      "VALIDATION_ERROR",
    );
  }

  return {
    name: body.name.trim(),
    password: body.password,
    token: body.token.trim(),
  };
};

const loginValidator = (body) => {
  const email = normalizeEmail(body.email);

  if (!validateEmail(email)) {
    throw new ApiError(400, "A valid email is required", "VALIDATION_ERROR");
  }

  assertRequiredString(body.password, "password");

  return {
    email,
    password: body.password,
  };
};

const tokenValidator = (body) => {
  assertRequiredString(body.token, "token");

  return {
    token: body.token.trim(),
  };
};

const emailValidator = (body) => {
  const email = normalizeEmail(body.email);

  if (!validateEmail(email)) {
    throw new ApiError(400, "A valid email is required", "VALIDATION_ERROR");
  }

  return {
    email,
  };
};

const resetPasswordValidator = (body) => {
  const { token } = tokenValidator(body);

  if (!validatePassword(body.password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and include letters and numbers",
      "VALIDATION_ERROR",
    );
  }

  return {
    password: body.password,
    token,
  };
};

module.exports = {
  acceptInvitationValidator,
  emailValidator,
  invitationRequestValidator,
  loginValidator,
  normalizeEmail,
  resetPasswordValidator,
  tokenValidator,
};

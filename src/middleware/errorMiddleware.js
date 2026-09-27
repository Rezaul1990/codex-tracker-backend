const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const isDuplicateKey = error.code === 11000;
  const statusCode =
    error.statusCode || (error.name === "ValidationError" ? 400 : isDuplicateKey ? 409 : 500);
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : isDuplicateKey
        ? "Duplicate resource"
        : error.message || "Internal server error";

  res.status(statusCode).json({
    code: isDuplicateKey
      ? "CONFLICT"
      : error.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "API_ERROR"),
    message,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

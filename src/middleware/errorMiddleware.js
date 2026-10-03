const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const isDuplicateKey = error.code === 11000;
  const isInvalidObjectId = error.name === "CastError" && error.kind === "ObjectId";
  const isJsonSyntaxError =
    error instanceof SyntaxError && error.status === 400 && "body" in error;
  const isMulterLimit = error.code === "LIMIT_FILE_SIZE";
  const statusCode =
    error.statusCode ||
    (error.name === "ValidationError" || isInvalidObjectId || isJsonSyntaxError || isMulterLimit
      ? 400
      : isDuplicateKey
        ? 409
        : 500);
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : isDuplicateKey
        ? "Duplicate resource"
        : isInvalidObjectId
          ? "A valid id is required"
          : isJsonSyntaxError
            ? "Request body must be valid JSON"
            : isMulterLimit
              ? "File size must be 5MB or less"
        : error.message || "Internal server error";

  res.status(statusCode).json({
    code: isDuplicateKey
      ? "CONFLICT"
      : isInvalidObjectId || isJsonSyntaxError
        ? "VALIDATION_ERROR"
        : isMulterLimit
          ? "FILE_TOO_LARGE"
          : error.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "API_ERROR"),
    message,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

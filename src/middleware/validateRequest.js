const validateRequest = (validator) => (req, res, next) => {
  try {
    req.validatedBody = validator(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRequest;

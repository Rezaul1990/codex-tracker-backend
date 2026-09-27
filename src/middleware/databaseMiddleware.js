const connectDB = require("../config/db");

const ensureDatabaseConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ensureDatabaseConnection,
};

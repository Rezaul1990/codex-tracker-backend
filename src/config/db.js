const mongoose = require("mongoose");

let connectionPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri);
  }

  const connection = await connectionPromise;

  console.log(`MongoDB connected: ${connection.connection.host}`);

  return connection.connection;
};

module.exports = connectDB;

const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("../config/db");
const User = require("../models/userModel");
const { hashPassword } = require("../utils/password");
const { validateAuthEnv } = require("../config/env");
const { normalizeEmail } = require("../validators/authValidators");

const run = async () => {
  validateAuthEnv();
  await connectDB();

  const email = normalizeEmail(process.env.SEED_ADMIN_EMAIL);
  const name = process.env.SEED_ADMIN_NAME || "System Admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required");
  }

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  await User.create({
    email,
    emailVerifiedAt: new Date(),
    name,
    passwordHash: await hashPassword(password),
    role: "admin",
  });

  console.log("Admin user created");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });

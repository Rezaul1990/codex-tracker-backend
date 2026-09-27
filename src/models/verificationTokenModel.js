const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    expiresAt: {
      type: Date,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VerificationToken", verificationTokenSchema);

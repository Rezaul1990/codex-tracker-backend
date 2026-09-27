const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
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

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);

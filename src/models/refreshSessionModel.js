const mongoose = require("mongoose");

const refreshSessionSchema = new mongoose.Schema(
  {
    expiresAt: {
      type: Date,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

refreshSessionSchema.index({ user: 1, revokedAt: 1 });
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshSession", refreshSessionSchema);

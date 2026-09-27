const mongoose = require("mongoose");

const { USER_ROLES } = require("../constants/auth");

const invitationSchema = new mongoose.Schema(
  {
    acceptedAt: {
      type: Date,
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "member",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

invitationSchema.index({ email: 1, acceptedAt: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Invitation", invitationSchema);

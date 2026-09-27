const mongoose = require("mongoose");

const { USER_ROLES } = require("../constants/auth");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "member",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    email: this.email,
    emailVerified: Boolean(this.emailVerifiedAt),
    name: this.name,
    role: this.role,
  };
};

module.exports = mongoose.model("User", userSchema);

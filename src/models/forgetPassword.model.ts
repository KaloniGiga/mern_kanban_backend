import mongoose, { Schema, Document } from "mongoose";
import User from "./user.model";

const ForgetPasswordSchema: Schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: User,
      required: true,
    },

    resetPasswordToken: {
      type: String,
      required: true,
    },

    resetPasswordTokenExpire: {
      type: Number,
      required: true,
      default: Date.now() + 1000 * 60 * 60,
    },
  },
  { timestamps: true }
);

const ForgetPassword = mongoose.model("ForgotPassword", ForgetPasswordSchema);

export default ForgetPassword;

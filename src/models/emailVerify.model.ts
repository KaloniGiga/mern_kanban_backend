import mongoose, { Schema, Document } from "mongoose";
import { userInfo } from "os";
import User from "./user.model";

const EmailVerifySchema: Schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: User,
      required: true,
    },

    EmailVerifyToken: {
      type: String,
      required: true,
    },

    EmailVerificactionExpire: {
      type: Number,
      required: true,
      default: Date.now() + 1000 * 60 * 60,
    },
  },
  { timestamps: true }
);

const EmailVerify = mongoose.model("EmailVerify", EmailVerifySchema);

export default EmailVerify;

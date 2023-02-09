import mongoose, { Schema, Document } from "mongoose";
import User, { I_UserDocument } from "./user.model";

export interface I_RefreshTokenSchema extends mongoose.Document {
  userId: I_UserDocument & { _id: mongoose.Schema.Types.ObjectId };
  refreshToken: string;
}

const RefreshTokenSchema: Schema<I_RefreshTokenSchema> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;

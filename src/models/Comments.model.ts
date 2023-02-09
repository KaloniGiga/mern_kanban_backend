import mongoose, { Schema } from "mongoose";
import { I_CardDocument } from "./cards.model.";
import { I_UserDocument } from "./user.model";

export interface I_CommentDocument extends mongoose.Document {
  comment: String;
  user: { _id: I_UserDocument & mongoose.Schema.Types.ObjectId };
  cardId: { _id: I_CardDocument & mongoose.Schema.Types.ObjectId };
  isUpdated: boolean;
}

const CommentSchema: Schema<I_CommentDocument> = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 255,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
    },

    isUpdated: {
      type: Boolean,
      required: true,
      default: false,
    },
  },

  { timestamps: true }
);

const Comment = mongoose.model<I_CommentDocument>("Comment", CommentSchema);

export default Comment;

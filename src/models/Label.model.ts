import mongoose, { Schema } from "mongoose";
import { I_BoardDocument } from "./board.model";

export interface I_LabelDocument extends mongoose.Document {
  name: string;
  color: string;
  boardId: { _id: I_BoardDocument & mongoose.Schema.Types.ObjectId };
}

const LabelSchema: Schema<I_LabelDocument> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 255,
    },

    color: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value: String) {
          return value[0] === "#";
        },
        message: "Color must be in hex format",
      },
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
  },
  { timestamps: true }
);

const Label = mongoose.model<I_LabelDocument>("Label", LabelSchema);

export default Label;

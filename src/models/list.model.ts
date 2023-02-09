import mongoose from "mongoose";
import { I_BoardDocument } from "./board.model";
import { Schema } from "mongoose";
import { I_UserDocument } from "./user.model";
import { timeStamp } from "console";
import { I_CardDocument } from "./cards.model.";

export interface I_ListDocument extends mongoose.Document {
  name: string;
  boardId: I_BoardDocument & { _id: mongoose.Schema.Types.ObjectId };
  position: string;
  cards: { _id: I_CardDocument & mongoose.Schema.Types.ObjectId }[];
  creator: I_UserDocument & { _id: mongoose.Schema.Types.ObjectId };
}

const listSchema: Schema<I_ListDocument> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    cards: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Card",
          required: true,
        },
      ],

      default: [],
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const List = mongoose.model("List", listSchema);

export default List;

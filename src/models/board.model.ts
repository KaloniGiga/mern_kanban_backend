import mongoose, { Schema } from "mongoose";
import validator from "validator";
import { I_ListDocument } from "./list.model";
import { I_UserDocument } from "./user.model";
import { I_WorkSpaceDocument } from "./workspace.model";

export interface I_BoardDocument extends mongoose.Document {
  name: string;
  description: string;
  visibility: string;
  lists: { _id: I_ListDocument & mongoose.Schema.Types.ObjectId }[];
  workspaceId: I_WorkSpaceDocument & { _id: mongoose.Schema.Types.ObjectId };
  labels: mongoose.Schema.Types.ObjectId[];
  bgImage: string;
  color: string;
  members: {
    memberId: I_UserDocument & { _id: mongoose.Schema.Types.ObjectId };
    role: string;
  }[];
  creator: mongoose.Schema.Types.ObjectId;
}

const boardMemberSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  role: {
    type: String,
    enum: ["ADMIN", "NORMAL"],
    default: "NORMAL",
  },
});

const boardSchema: Schema<I_BoardDocument> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 30,
      trim: true,
    },

    visibility: {
      type: String,
      default: "PUBLIC",
    },

    description: {
      type: String,
      trim: true,
    },

    labels: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Label",
          required: true,
        },
      ],
      default: [],
    },

    bgImage: {
      type: String,
      validate: {
        validator: function (value: string) {
          return validator.isURL(value);
        },
        message: "Invalid URL",
      },
    },

    color: {
      type: String,
      default: "white",
    },

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkSpace",
      require: true,
    },

    lists: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "List",
          required: true,
        },
      ],
      default: [],
    },

    members: {
      type: [boardMemberSchema],
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

const Board = mongoose.model("Board", boardSchema);

export default Board;

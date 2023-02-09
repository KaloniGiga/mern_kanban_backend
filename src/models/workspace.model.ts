import mongoose, { Schema } from "mongoose";
import { I_UserDocument } from "./user.model";

export interface I_WorkSpaceDocument extends mongoose.Document {
  name: string;
  description: string;
  picture: string;
  isFavorite: boolean;
  boards: mongoose.Schema.Types.ObjectId[];
  members: {
    memberId: I_UserDocument & { _id: mongoose.Schema.Types.ObjectId };
    role: string;
  }[];
  creator: mongoose.Schema.Types.ObjectId;
  visibility: string;
  createBoard: string;
  inviteMember: string;
}

const WorkSpaceSchema: Schema<I_WorkSpaceDocument> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 40,
      trim: true,
    },

    description: {
      type: String,
      maxLength: 255,
      required: true,
      trim: true,
    },

    picture: {
      type: String,
      trim: true,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    boards: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Board",
          required: true,
        },
      ],
      default: [],
    },

    members: {
      type: [
        {
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
        },
      ],

      default: [],
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visibility: {
      type: String,
      default: "PUBLIC",
    },

    createBoard: {
      type: String,
      default: "AnyOne",
    },

    inviteMember: {
      type: String,
      default: "AnyOne",
    },
  },
  { timestamps: true }
);

const WorkSpace = mongoose.model("WorkSpace", WorkSpaceSchema);

export default WorkSpace;

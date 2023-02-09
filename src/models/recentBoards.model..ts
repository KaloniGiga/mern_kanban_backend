import mongoose, { Schema } from "mongoose";

interface I_RecentVisitedDocument {
  userId: mongoose.Schema.Types.ObjectId;
  boardId: mongoose.Schema.Types.ObjectId;
  lastVisited: Date;
}

const recentBoardSchema: Schema<I_RecentVisitedDocument> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },

    lastVisited: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const RecentBoard = mongoose.model("RecentBoard", recentBoardSchema);

export default RecentBoard;

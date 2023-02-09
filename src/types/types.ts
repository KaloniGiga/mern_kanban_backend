import mongoose from "mongoose";

export interface CardInNewPositionType {
  _id: mongoose.Schema.Types.ObjectId;
  position: string;
}

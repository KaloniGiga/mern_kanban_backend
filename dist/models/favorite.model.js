"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FavoriteSchema = new mongoose_1.default.Schema({
    resourceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const Favorite = mongoose_1.default.model("Favorite", FavoriteSchema);
exports.default = Favorite;

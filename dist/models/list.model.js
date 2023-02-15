"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const listSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    boardId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Card",
                required: true,
            },
        ],
        default: [],
    },
    creator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
const List = mongoose_1.default.model("List", listSchema);
exports.default = List;

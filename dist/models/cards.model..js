"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const cardSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
    },
    members: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        default: [],
    },
    listId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "List",
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    isComplete: {
        type: Boolean,
        default: false,
        required: true,
    },
    expireDate: {
        type: Date,
        required: true,
    },
    labels: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Label",
                required: true,
            },
        ],
        default: [],
    },
    comments: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Comment",
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
const Card = mongoose_1.default.model("Card", cardSchema);
exports.default = Card;

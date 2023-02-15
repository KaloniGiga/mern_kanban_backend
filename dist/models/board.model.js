"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const boardMemberSchema = new mongoose_1.default.Schema({
    memberId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: ["ADMIN", "NORMAL"],
        default: "NORMAL",
    },
});
const boardSchema = new mongoose_1.default.Schema({
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
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Label",
                required: true,
            },
        ],
        default: [],
    },
    bgImage: {
        type: String,
        validate: {
            validator: function (value) {
                return validator_1.default.isURL(value);
            },
            message: "Invalid URL",
        },
    },
    color: {
        type: String,
        default: "white",
    },
    workspaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "WorkSpace",
        require: true,
    },
    lists: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
const Board = mongoose_1.default.model("Board", boardSchema);
exports.default = Board;

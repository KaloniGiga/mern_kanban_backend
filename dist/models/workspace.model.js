"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const WorkSpaceSchema = new mongoose_1.default.Schema({
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
                type: mongoose_1.default.Schema.Types.ObjectId,
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
                    type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, { timestamps: true });
const WorkSpace = mongoose_1.default.model("WorkSpace", WorkSpaceSchema);
exports.default = WorkSpace;

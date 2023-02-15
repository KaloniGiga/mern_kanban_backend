"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const LabelSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 255,
    },
    color: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (value) {
                return value[0] === "#";
            },
            message: "Color must be in hex format",
        },
    },
    boardId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Board",
        required: true,
    },
}, { timestamps: true });
const Label = mongoose_1.default.model("Label", LabelSchema);
exports.default = Label;

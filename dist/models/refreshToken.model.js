"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("./user.model"));
const RefreshTokenSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: user_model_1.default,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    refreshToeknExpire: {
        type: Date,
        required: true,
        default: Date.now() + 1000 * 60 * 60 * 12,
    }
}, { timestamps: true });
const RefreshToken = mongoose_1.default.model("RefreshToken", RefreshTokenSchema);
exports.default = RefreshToken;

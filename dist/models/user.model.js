"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
        minLength: 3,
        validate: {
            validator: function (value) {
                return /^[A-Za-z0-9_-\s]*$/.test(value);
            },
            message: "Username must only contain letters, numbers, underscores and dashes",
        },
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (value) {
                return validator_1.default.isEmail(value);
            },
            message: "Email is not valid",
        },
    },
    isGoogleAuth: {
        type: Boolean,
        default: false,
        required: true,
    },
    hashedPassword: {
        type: String,
        select: false,
        minLength: 8,
        trim: true,
    },
    avatar: {
        type: String,
    },
    emailVerified: {
        type: Boolean,
        default: false,
        required: true,
    },
}, { timestamps: true });
//middlewares
UserSchema.pre("save", async function (next) {
    if (this.isModified("hashedPassword")) {
        const salt = await bcrypt_1.default.genSalt(10);
        this.hashedPassword = await bcrypt_1.default.hash(this.hashedPassword, salt);
    }
    next();
});
UserSchema.methods.comparePassword = async function (password) {
    console.log("validating password");
    return await bcrypt_1.default.compare(password, this.hashedPassword);
};
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;

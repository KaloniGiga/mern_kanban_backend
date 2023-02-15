"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRandomToken = exports.checkAllString = void 0;
const crypto_1 = __importDefault(require("crypto"));
const checkAllString = (members) => {
    return members.every((mem) => typeof mem === "string");
};
exports.checkAllString = checkAllString;
const createRandomToken = async (length) => {
    return crypto_1.default.randomBytes(length).toString("hex");
};
exports.createRandomToken = createRandomToken;

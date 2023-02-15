"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refreshToken_model_1 = __importDefault(require("../models/refreshToken.model"));
const generateAccessToken = async (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.ACCESS_KEY_SECRET, {
        expiresIn: "1d",
    });
    console.log("access token generate");
    return accessToken;
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = async (payload) => {
    const refreshTokenExist = await refreshToken_model_1.default.findOne({ userId: payload._id });
    const refreshTokenSecret = process.env.REFRESH_KEY_SECRET;
    if (refreshTokenExist) {
        console.log("refresh token exist for this userid");
        try {
            await jsonwebtoken_1.default.verify(refreshTokenExist.refreshToken, refreshTokenSecret);
            console.log("refresh token verified");
            return refreshTokenExist.refreshToken;
        }
        catch (err) {
            console.log(payload._id);
            await refreshToken_model_1.default.deleteOne({ _id: refreshTokenExist._id });
            const newRefreshToken = await jsonwebtoken_1.default.sign({ userId: payload._id.toString() }, refreshTokenSecret, { expiresIn: "7d" });
            await refreshToken_model_1.default.create({
                userId: payload._id,
                refreshToken: newRefreshToken,
            });
            console.log("new refresh token and created and saved to data base");
            return newRefreshToken;
        }
    }
    else {
        const newRefreshToken = await jsonwebtoken_1.default.sign(payload, process.env.REFRESH_KEY_SECRET, { expiresIn: "7d" });
        console.log(newRefreshToken, payload._id);
        await refreshToken_model_1.default.create({
            userId: payload._id,
            refreshToken: newRefreshToken,
        });
        console.log("refresh token created and saved to database");
        return newRefreshToken;
    }
};
exports.generateRefreshToken = generateRefreshToken;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVerified = exports.isLoggedIn = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const isLoggedIn = async (req, res, next) => {
    const header = req.headers["authorization"];
    const accessToken = header && header.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
    //verify access token
    try {
        const data = jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_KEY_SECRET);
        const user = await user_model_1.default.findById(data._id).select("_id username avatar email emailVerified isGoogleAuth");
        if (!user) {
            console.log(data._id);
            return res.status(401).json({
                success: false,
                message: "Invalid user",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid access token",
        });
    }
};
exports.isLoggedIn = isLoggedIn;
const isVerified = (req, res, next) => {
    req.user = { _id: "63b140d05a30f741acf23c6f" };
    next();
};
exports.isVerified = isVerified;

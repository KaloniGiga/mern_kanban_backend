"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
const validator_1 = __importDefault(require("validator"));
const user_model_1 = __importDefault(require("../models/user.model"));
const emailVerify_model_1 = __importDefault(require("../models/emailVerify.model"));
const refreshToken_model_1 = __importDefault(require("../models/refreshToken.model"));
const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        //backend form data validation
        //for username
        if (!username) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Username is required"));
        }
        else if (username.length < 3) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Username must be atleast 3 character long"));
        }
        else if (!/^[A-Za-z0-9_-]*$/.test(username)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Username must only contain letters, numbers, underscores and dashes"));
        }
        console.log('username verified');
        //for email
        if (!email) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Email is required"));
        }
        else if (!validator_1.default.isEmail(email)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Email is not valid"));
        }
        console.log('email verified');
        //password
        if (!password) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Password is required"));
        }
        else if (password.length < 8) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Password must be at least 8 characters long"));
        }
        else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)/.test(password)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Password must contain 1 small letter, 1 capital letter, 1 digit and 1 special character"));
        }
        console.log('password verified');
        //confirm Password 
        if (!confirmPassword) {
            return next(new ErrorHandler_1.ErrorHandler(400, "confirm password is required"));
        }
        else if (confirmPassword !== password) {
            return next(new ErrorHandler_1.ErrorHandler(400, "password and confirm password must match"));
        }
        console.log('confirm password verified');
        //the username is already taken or not
        const isUserNameAvaliable = await user_model_1.default.findOne({ username: username });
        if (isUserNameAvaliable && isUserNameAvaliable.emailVerified) {
            return next(new ErrorHandler_1.ErrorHandler(400, "User Name is already taken"));
        }
        //check if user with this email exists or not
        const userExist = await user_model_1.default.findOne({ email: email });
        if (userExist) {
            console.log('user exist with this email');
            const emailVerificationTimeExist = await emailVerify_model_1.default.findOne({ userId: userExist._id }).where('EmailVerificationExpire').gt(Date.now());
            if (emailVerificationTimeExist) {
                console.log('user  has email verification time left');
                return res.status(400).send({ success: false, message: "Email is already registered and verification Time exist." });
            }
            else {
                console.log("user's email verification time has expired");
                console.log("Deleting all the reference of that user from database");
                await user_model_1.default.findByIdAndDelete({ _id: userExist._id });
                await emailVerify_model_1.default.findByIdAndDelete({ userId: userExist._id });
                await refreshToken_model_1.default.findByIdAndDelete({ userId: userExist._id });
                // await ForgetPassword.findByIdAndDelete({userId: userExist._id});
            }
        }
        const user = user_model_1.default.create({ username, email, hashedPassword: password });
        console.log("new User with this email registered", user);
        return res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        return res.status(500).send({ success: false, error: err });
    }
};
exports.registerUser = registerUser;

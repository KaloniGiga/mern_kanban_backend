"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.loginUser = exports.registerUser = exports.refreshAccessToken = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
const validator_1 = __importDefault(require("validator"));
const user_model_1 = __importDefault(require("../models/user.model"));
const emailVerify_model_1 = __importDefault(require("../models/emailVerify.model"));
const refreshToken_model_1 = __importDefault(require("../models/refreshToken.model"));
const forgetPassword_model_1 = __importDefault(require("../models/forgetPassword.model"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Token_1 = require("../utils/Token");
const sendEmail_1 = require("../utils/sendEmail");
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        //validate refresh token
        if (!refreshToken) {
            return next(new ErrorHandler_1.ErrorHandler(401, "RefreshToken is required"));
        }
        jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_KEY_SECRET, async (error, data) => {
            if (error) {
                return next(new ErrorHandler_1.ErrorHandler(401, "Invalid refresh token, please login"));
            }
            const isRefreshTokenValid = await refreshToken_model_1.default.findOne({
                userId: data._id,
                refreshToken: refreshToken,
            });
            if (!isRefreshTokenValid) {
                return next(new ErrorHandler_1.ErrorHandler(401, "Refresh token is not valid"));
            }
            const newAccessToken = (0, Token_1.generateAccessToken)({ _id: data._id });
            return res
                .status(200)
                .json({ success: true, accessToken: newAccessToken });
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: true, message: "Oops! Something went wrong" });
    }
};
exports.refreshAccessToken = refreshAccessToken;
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
        //for email
        if (!email) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Email is required"));
        }
        else if (!validator_1.default.isEmail(email)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Email is not valid"));
        }
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
        //confirm Password
        if (!confirmPassword) {
            return next(new ErrorHandler_1.ErrorHandler(400, "confirm password is required"));
        }
        else if (confirmPassword !== password) {
            return next(new ErrorHandler_1.ErrorHandler(400, "password and confirm password must match"));
        }
        //the username is already taken or not
        const isUserNameAvaliable = await user_model_1.default.findOne({ username: username });
        if (isUserNameAvaliable && isUserNameAvaliable.emailVerified) {
            return next(new ErrorHandler_1.ErrorHandler(400, "User Name is already taken"));
        }
        //check if user with this email exists or not
        const userExist = await user_model_1.default.findOne({ email: email });
        if (userExist) {
            const emailVerificationTimeExist = await emailVerify_model_1.default.findOne({
                userId: userExist._id,
            })
                .where("EmailVerificationExpire")
                .gt(Date.now());
            if (emailVerificationTimeExist) {
                return res
                    .status(400)
                    .send({
                    success: false,
                    message: "Email is already registered and verification Time exist.",
                });
            }
            else {
                await user_model_1.default.findByIdAndDelete({ _id: userExist._id });
                await emailVerify_model_1.default.findByIdAndDelete({ userId: userExist._id });
                await refreshToken_model_1.default.findByIdAndDelete({ userId: userExist._id });
                await forgetPassword_model_1.default.findByIdAndDelete({ userId: userExist._id });
            }
        }
        const user = await user_model_1.default.create({
            username,
            email,
            hashedPassword: password,
        });
        //save the email verification token in the database
        const verificationToken = await crypto_1.default.randomBytes(20).toString("hex");
        const emailver = await emailVerify_model_1.default.create({
            userId: user._id,
            EmailVerifyToken: verificationToken,
        });
        //send the verification email to the user
        //generate tokens
        const accessToken = await (0, Token_1.generateAccessToken)({ _id: user._id.toString() });
        const refreshToken = await (0, Token_1.generateRefreshToken)({
            _id: user._id.toString(),
        });
        //mail options
        const mailOptions = {
            from: process.env.GMAIL,
            to: user.email,
            subject: "Verify Email",
            html: `
                 <h1>Verify your email address</h1>
                 <p style="font-size: 16px; font-weight: 600">Click to link below to verify Email. </p>
                 <p style="font-size: 14px; font-weight: 600; color: red;">Ignore this if you don't ask for it</p>
                 <br />
                 <a style = "font-size: 14px;" href=${process.env.CLIENT_URL}/email/verify/${verificationToken}?userId=${emailver.userId} > Click here to verify your email </a>
             `,
        };
        //send email
        (0, sendEmail_1.SendEmail)(mailOptions);
        return res.status(201).json({
            success: true,
            token: { accessToken, refreshToken },
            message: "Your account has been created successfully",
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.registerUser = registerUser;
//controller function for login
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        //validation
        //for email
        if (!email) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Email is required"));
        }
        else if (!validator_1.default.isEmail(email)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid email"));
        }
        //for password
        if (!password) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Password is required"));
        }
        //check if user exists or not
        const user = await user_model_1.default.findOne({ email: email }).select("hashedPassword emailVerified");
        if (!user) {
            return next(new ErrorHandler_1.ErrorHandler(400, "email and password doesnot match"));
        }
        if (user && user.isGoogleAuth) {
            return next(new ErrorHandler_1.ErrorHandler(400, "This account can be logged in with Google"));
        }
        const passwordVerified = await bcrypt_1.default.compare(password, user.hashedPassword);
        if (!passwordVerified) {
            return next(new ErrorHandler_1.ErrorHandler(400, "the email and password doesnot match"));
        }
        // if (!user.emailVerified) {
        //   return next(new ErrorHandler(400, "the email is not verified"));
        // }
        //generate tokens
        const accessToken = await (0, Token_1.generateAccessToken)({ _id: user._id.toString() });
        const refreshToken = await (0, Token_1.generateRefreshToken)({
            _id: user._id.toString(),
        });
        return res.status(201).json({
            success: true,
            token: { accessToken, refreshToken },
            message: "successfully logged in",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong." });
    }
};
exports.loginUser = loginUser;
// Google OAuth
const googleAuth = async (req, res, next) => {
    try {
        const { tokenId } = req.body;
        const client = new google_auth_library_1.OAuth2Client(process.env.CLIENT_ID);
        let ticket;
        // validate token
        try {
            ticket = await client.verifyIdToken({
                idToken: tokenId,
                audience: process.env.CLIENT_ID,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: "Google OAuth failed",
            });
        }
        //get payload
        const payload = ticket.getPayload();
        //create user if user doesnot exist with this email
        const userExist = await user_model_1.default.findOne({ email: payload?.email });
        let accessToken;
        let refreshToken;
        if (!userExist) {
            //create a valid username
            const user = new user_model_1.default({
                username: payload?.name,
                email: payload?.email,
                avatar: payload?.picture,
                emailVerified: true,
                isGoogleAuth: true,
            });
            accessToken = await (0, Token_1.generateAccessToken)({ _id: user._id.toString() });
            refreshToken = await (0, Token_1.generateRefreshToken)({ _id: user._id.toString() });
            await user.save();
        }
        else {
            if (userExist.emailVerified === false) {
                //delete the ofld user
                await user_model_1.default.deleteOne({ _id: userExist._id });
                //await RefreshToken.deleteOne({userId: userExist._id});
                //await EmailVerify.deleteOne({userId: userExist._id});
                // await ForgetPassword.deleteOne({userId: userExist._id});
                const user = new user_model_1.default({
                    username: payload?.name,
                    email: payload?.email,
                    avatar: payload?.picture,
                    emailVerified: true,
                    isGoogleAuth: true,
                });
                accessToken = await (0, Token_1.generateAccessToken)({ _id: user._id.toString() });
                refreshToken = await (0, Token_1.generateRefreshToken)({ _id: user._id.toString() });
                await user.save();
            }
            else {
                accessToken = await (0, Token_1.generateAccessToken)({
                    _id: userExist._id.toString(),
                });
                refreshToken = await (0, Token_1.generateRefreshToken)({
                    _id: userExist._id.toString(),
                });
            }
        }
        return res.status(200).json({
            success: true,
            token: {
                accessToken,
                refreshToken,
            },
            message: "Google Authentication successfull",
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Oops, something went wrong",
        });
    }
};
exports.googleAuth = googleAuth;

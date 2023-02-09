import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";
import validator from "validator";
import User from "../models/user.model";
import EmailVerify from "../models/emailVerify.model";
import RefreshToken from "../models/refreshToken.model";
import ForgetPassword from "../models/forgetPassword.model";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/Token";
import { Error } from "mongoose";
import { SendEmail } from "../utils/sendEmail";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    //validate refresh token
    if (!refreshToken) {
      return next(new ErrorHandler(401, "RefreshToken is required"));
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_KEY_SECRET!,
      async (error: any, data: any) => {
        if (error) {
          return next(
            new ErrorHandler(401, "Invalid refresh token, please login")
          );
        }

        const isRefreshTokenValid = await RefreshToken.findOne({
          userId: data._id,
          refreshToken: refreshToken,
        });

        if (!isRefreshTokenValid) {
          return next(new ErrorHandler(401, "Refresh token is not valid"));
        }

        const newAccessToken = generateAccessToken({ _id: data._id });

        return res
          .status(200)
          .json({ success: true, accessToken: newAccessToken });
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ success: true, message: "Oops! Something went wrong" });
  }
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    //backend form data validation

    //for username
    if (!username) {
      return next(new ErrorHandler(400, "Username is required"));
    } else if (username.length < 3) {
      return next(
        new ErrorHandler(400, "Username must be atleast 3 character long")
      );
    } else if (!/^[A-Za-z0-9_-]*$/.test(username)) {
      return next(
        new ErrorHandler(
          400,
          "Username must only contain letters, numbers, underscores and dashes"
        )
      );
    }

    //for email
    if (!email) {
      return next(new ErrorHandler(400, "Email is required"));
    } else if (!validator.isEmail(email)) {
      return next(new ErrorHandler(400, "Email is not valid"));
    }

    //password
    if (!password) {
      return next(new ErrorHandler(400, "Password is required"));
    } else if (password.length < 8) {
      return next(
        new ErrorHandler(400, "Password must be at least 8 characters long")
      );
    } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)/.test(password)) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain 1 small letter, 1 capital letter, 1 digit and 1 special character"
        )
      );
    }

    //confirm Password
    if (!confirmPassword) {
      return next(new ErrorHandler(400, "confirm password is required"));
    } else if (confirmPassword !== password) {
      return next(
        new ErrorHandler(400, "password and confirm password must match")
      );
    }

    //the username is already taken or not
    const isUserNameAvaliable = await User.findOne({ username: username });

    if (isUserNameAvaliable && isUserNameAvaliable.emailVerified) {
      return next(new ErrorHandler(400, "User Name is already taken"));
    }

    //check if user with this email exists or not
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      const emailVerificationTimeExist = await EmailVerify.findOne({
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
      } else {
        await User.findByIdAndDelete({ _id: userExist._id });
        await EmailVerify.findByIdAndDelete({ userId: userExist._id });
        await RefreshToken.findByIdAndDelete({ userId: userExist._id });
        await ForgetPassword.findByIdAndDelete({ userId: userExist._id });
      }
    }

    const user = await User.create({
      username,
      email,
      hashedPassword: password,
    });

    //save the email verification token in the database
    const verificationToken = await crypto.randomBytes(20).toString("hex");

    const emailver = await EmailVerify.create({
      userId: user._id,
      EmailVerifyToken: verificationToken,
    });

    //send the verification email to the user

    //generate tokens

    const accessToken = await generateAccessToken({ _id: user._id.toString() });

    const refreshToken = await generateRefreshToken({
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
    SendEmail(mailOptions);

    return res.status(201).json({
      success: true,
      token: { accessToken, refreshToken },
      message: "Your account has been created successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Oops, something went wrong!" });
  }
};

//controller function for login

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    //validation

    //for email
    if (!email) {
      return next(new ErrorHandler(400, "Email is required"));
    } else if (!validator.isEmail(email)) {
      return next(new ErrorHandler(400, "Invalid email"));
    }
    //for password
    if (!password) {
      return next(new ErrorHandler(400, "Password is required"));
    }

    //check if user exists or not
    const user = await User.findOne({ email: email }).select(
      "hashedPassword emailVerified"
    );

    if (!user) {
      return next(new ErrorHandler(400, "email and password doesnot match"));
    }

    if (user && user.isGoogleAuth) {
      return next(
        new ErrorHandler(400, "This account can be logged in with Google")
      );
    }

    const passwordVerified = await bcrypt.compare(
      password,
      user.hashedPassword
    );
    if (!passwordVerified) {
      return next(
        new ErrorHandler(400, "the email and password doesnot match")
      );
    }

    // if (!user.emailVerified) {
    //   return next(new ErrorHandler(400, "the email is not verified"));
    // }
    //generate tokens

    const accessToken = await generateAccessToken({ _id: user._id.toString() });

    const refreshToken = await generateRefreshToken({
      _id: user._id.toString(),
    });

    return res.status(201).json({
      success: true,
      token: { accessToken, refreshToken },
      message: "successfully logged in",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops, something went wrong." });
  }
};

// Google OAuth

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tokenId } = req.body;
    const client = new OAuth2Client(process.env.CLIENT_ID);

    let ticket;
    // validate token
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.CLIENT_ID,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Google OAuth failed",
      });
    }

    //get payload
    const payload = ticket.getPayload();

    //create user if user doesnot exist with this email
    const userExist = await User.findOne({ email: payload?.email });

    let accessToken;
    let refreshToken;

    if (!userExist) {
      //create a valid username

      const user = new User({
        username: payload?.name,
        email: payload?.email,
        avatar: payload?.picture,
        emailVerified: true,
        isGoogleAuth: true,
      });

      accessToken = await generateAccessToken({ _id: user._id.toString() });
      refreshToken = await generateRefreshToken({ _id: user._id.toString() });
      await user.save();
    } else {
      if (userExist.emailVerified === false) {
        //delete the ofld user
        await User.deleteOne({ _id: userExist._id });
        //await RefreshToken.deleteOne({userId: userExist._id});
        //await EmailVerify.deleteOne({userId: userExist._id});
        // await ForgetPassword.deleteOne({userId: userExist._id});

        const user = new User({
          username: payload?.name,
          email: payload?.email,
          avatar: payload?.picture,
          emailVerified: true,
          isGoogleAuth: true,
        });

        accessToken = await generateAccessToken({ _id: user._id.toString() });
        refreshToken = await generateRefreshToken({ _id: user._id.toString() });

        await user.save();
      } else {
        accessToken = await generateAccessToken({
          _id: userExist._id.toString(),
        });
        refreshToken = await generateRefreshToken({
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
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Oops, something went wrong",
    });
  }
};

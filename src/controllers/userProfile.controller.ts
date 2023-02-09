import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import validator from "validator";
import { ErrorHandler } from "../utils/ErrorHandler";
import ForgetPassword from "../models/forgetPassword.model";
import crypto from "crypto";
import { SendEmail } from "../utils/sendEmail";
import EmailVerify from "../models/emailVerify.model";
import RefreshToken from "../models/refreshToken.model";
import { generateAccessToken, generateRefreshToken } from "../utils/Token";
import mongoose, { isValidObjectId } from "mongoose";
import { encodeXText } from "nodemailer/lib/shared";
import WorkSpace from "../models/workspace.model";
import { Document } from "bson";
import Board from "../models/board.model";
import path from "path";
import fs from "fs";
import { createRandomToken } from "../utils/misc";
import sharp from "sharp";
import Jimp from "jimp";


export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler(400, "Email is required"));
    } else if (!validator.isEmail(email)) {
      return next(new ErrorHandler(400, "Invalid email"));
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return next(new ErrorHandler(400, "this email does not exist"));
    }

    if (user.isGoogleAuth) {
      return next(
        new ErrorHandler(400, "You cannot reset password for this account")
      );
    }

    await ForgetPassword.deleteOne({ userId: user._id });

    const resetPasswordToken = await crypto.randomBytes(20).toString("hex");
    const forgetPassword = await ForgetPassword.create({
      userId: user._id,
      resetPasswordToken: resetPasswordToken,
      resetPasswordTokenExpire: Date.now() + 1000 * 60 * 60,
    });

    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: "Forget Your Password",
      html: `
               <h1>Forgot your password</h1>
               <p style="font-size: 16px; font-weight: 600;">Click the link below to reset your password</p>
               <a style="font-size: 14px;" href="${process.env.CLIENT_URL}/reset/password/${resetPasswordToken}" target="_blank">Click here to reset your password.</a>
            `,
    };

    //send email
    SendEmail(mailOptions);

    res
      .status(200)
      .json({
        success: true,
        message: "Email sent to your email address to reset password",
      });
  } catch (error) {
    next(new ErrorHandler(500, "Oops, something went wrong"));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {token} = req.params;

    const { password, confirmPassword } = req.body;

    if(!token){
      return next(new ErrorHandler(400, "Reset token is required."))
    }

    if (!password || !confirmPassword) {
      return next(new ErrorHandler(400, "All fields is required"));
    } else if (password.length < 8) {
      return next(
        new ErrorHandler(400, "Password must be at least 8 characters long")
      );
    } else if (
      !/\d/.test(password) ||
      !/[a=zA-Z]/.test(password) ||
      !/[@#$%6&*,.?!]/.test(password)
    ) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain at least one capital and small letter, one digit and one special character"
        )
      );
    }

    if (confirmPassword !== password) {
      return next(
        new ErrorHandler(400, "password and confirm password must match.")
      );
    }
    

    const TokenExist = await ForgetPassword.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpire: { $gt: Date.now()},
    });

    if (!TokenExist) {
      return next(
        new ErrorHandler(404, "Your password reset link has expired")
      );
    }


    const user = await User.findOne({ _id: TokenExist.userId });

    if (!user) {
      await ForgetPassword.deleteOne({ _id: TokenExist._id });
      await EmailVerify.deleteOne({ userId: TokenExist.userId });
      await RefreshToken.deleteOne({ userId: TokenExist.userId });

      return next(new ErrorHandler(404, "User is invalid"));
    }

    user.hashedPassword = password;
    (user.isGoogleAuth = false), (user.emailVerified = true);

    await EmailVerify.deleteOne({ userId: user._id });
    await RefreshToken.deleteOne({ userId: user._id });
    await ForgetPassword.deleteOne({ _id: TokenExist._id });

    await user.save();

    const accessToken = await generateAccessToken({ _id: user._id.toString() });
    const refreshToken = await generateRefreshToken({_id: user._id.toString()});

    console.log("accesstoken and refresh toen generated");
    return res
      .status(201)
      .json({
        success: true,
        token: { accessToken, refreshToken },
        message: "password reset sucessfull",
      });
  } catch (error) {
    next(new ErrorHandler(500, "something went wrong"));
  }
};



export const updateProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {

   // const profile = req.file;
    const {username} = req.body;
    const profile = req.file;

    if(!username && !profile) {
       return next(new ErrorHandler(400, "Nothing provided"))
    }

    

    if (Object.keys(req.body).includes("username")) {

      const { username } = req.body;

      if (!username) {
        return next(new ErrorHandler(400, "username is required"));
      } else if (username.length < 4 && username.length > 30) {
        return next(
          new ErrorHandler(
            400,
            "Username must be greater than 4 chars and less than 30 chars."
          )
        );
      }

    }

    const user = await User.findOne({ _id: req.user._id }).select(
      "_id username"
    );

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    console.log("user found");

    if(username){
    user.username = validator.escape(username);
    }

    if(profile) {
      

       if(user.avatar && !user.isGoogleAuth && user.avatar ) {
           fs.unlink(path.join(process.env.PUBLIC_DIR_NAME!, user.avatar), (error) => {
            
            if(error) {
                console.log(error);
              }else {
                console.log("file deleted successfully")
              }
          })
       }
    
       

    const fileName = new Date(Date.now()).toISOString()+ ".jpeg";
     

    console.log()
     sharp(profile.buffer)
    .resize(250, 250)
    .toFormat("jpeg")
    .toFile(path.resolve(__dirname, `../public/${profile.originalname}`)).then((data) => {
      console.log(data)
    }).catch((err) => console.log(err) );

    user.avatar = `${process.env.SERVER_URL!}${process.env.BASE_PATH!}${process.env.STATIC_PATH!}/${profile.originalname}`;

    }

    await user.save();
    res.status(200).json({ success: true, user });


  } catch (error) {
    res.status(500).json({success: false,  error: error})
  }
};

export const deleteProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    await RefreshToken.deleteOne({ userId: req.user._id });
    await EmailVerify.deleteOne({ userId: req.user._id });
    await ForgetPassword.deleteOne({ userId: req.user._id });
    await User.deleteOne({ _id: req.user._id });

    return res
      .status(201)
      .json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, error: error });
  }
};

export const resendEmail = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    //delete old EmailVerify document
    await EmailVerify.deleteOne({ userId: user._id });

    //create a new EmailVerify document
    const emailVerification = new EmailVerify({
      userId: user._id,
      EmailVerifyToken: crypto.randomBytes(20).toString("hex"),
    });

    const emailVer = await emailVerification.save();

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
             <a style = "font-size: 14px;" href=${process.env.CLIENT_URL}/email/verify/${emailVer.EmailVerifyToken}?userId=${user._id} > Click here to verify your email </a>
         `,
    };

    SendEmail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Email resent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Oops, something went wrong",
    });
  }
};

export const verifyEmail = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { userId } = req.query;

    const VERIFY_EMAIL_TOKEN_LENGTH = process.env.VERIFY_EMAIL_TOKEN_LENGTH;

    if (!userId) {
      return next(new ErrorHandler(400, "userId is required"));
    } else if (!mongoose.isValidObjectId(userId)) {
      return next(new ErrorHandler(400, "Invalid userId"));
    }

      "userId is validated.",
      typeof VERIFY_EMAIL_TOKEN_LENGTH,
      typeof token.length
    );

    if (!token) {
      return next(new ErrorHandler(400, "token is required"));
    } else if (token.length !== Number(VERIFY_EMAIL_TOKEN_LENGTH)) {
      return next(new ErrorHandler(400, "token length must be 40"));
    }


    const user = await User.findOne({ _id: userId }).select(
      "_id email emailVerified"
    );

    if (!user) {
      return next(new ErrorHandler(400, "Invalid email validation link"));
    }


    if (user.email !== req.user.email) {
      return next(new ErrorHandler(400, "Verification failed."));
    }
    

    if (user.emailVerified === true) {
      return next(new ErrorHandler(200, "Email verified"));
    }


    const emailVerification = await EmailVerify.findOne({
      userId: user._id,
      EmailVerifyToken: token,
      EmailVerificationExpire: { $gt: Date.now() },
    });

    if (!emailVerification) {
      return next(new ErrorHandler(400, "email validation link failed."));
    }

    user.emailVerified = true;
    await user.save();

    await EmailVerify.deleteOne({ _id: emailVerification._id });

    res.status(200).json({
      success: true,
      message: "Email Verified",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops, something went wrong",
    });
  }
};

export const updatePassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return next(new ErrorHandler(400, "All fields is required"));
    } else if (password.length < 8) {
      return next(
        new ErrorHandler(400, "Password must be at least 8 characters long")
      );
    } else if (
      !/\d/.test(password) ||
      !/[a=zA-Z]/.test(password) ||
      !/[@#$%6&*,.?!]/.test(password)
    ) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain at least one capital and small letter, one digit and one special character"
        )
      );
    }

    if (confirmPassword != password) {
      return next(
        new ErrorHandler(400, "password and confirmpassword must match.")
      );
    }

    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
      return next(new ErrorHandler(400, "Invalid user"));
    }

    user.hashedPassword = password;

    await user?.save();

    res
      .status(201)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Oops something went wrong" });
  }
};

export const readMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return next(new ErrorHandler(400, "Login first"));
    } else if (!mongoose.isValidObjectId(userId)) {
      return next(new ErrorHandler(400, "invalid userId"));
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return next(new ErrorHandler(404, "user not found"));
    }

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        emailVerified: user.emailVerified,
        username: user.username,
        email: user.email,
        isGoogleAuth: user.isGoogleAuth,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Oops! something went wrong" });
  }
};

export const searchUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, workspaceId } = req.query;

    if (!query) {
      return next(new ErrorHandler(400, "query value is required"));
    }

    //find the users whose username or email matches the query string.
    const users = await User.find({
      $and: [
        {
          $or: [
            {
              username: { $regex: query, $options: "i" },
            },
            {
              email: { $regex: query, $options: "i" },
            },
          ],
        },
        {
          _id: { $ne: req.user._id },
          emailVerified: true,
        },
      ],
    })
      .lean()
      .select("_id username email avatar");

    //validate workspace
    if (!workspaceId || !mongoose.isValidObjectId(workspaceId)) {
      return next(
        new ErrorHandler(400, "workspaceId is required and must be valid")
      );
    }

    //find the workspace with given workspaceId in which the user is also the member
    const workspace = await WorkSpace.findOne({
      _id: workspaceId,
      members: {
        $elemMatch: {
          memberId: req.user._id,
          // role: {$cond: [{"$inviteMember" :{$ne: "Admin"}}, {$in: ["ADMIN", "NORMAL"]}, {$in : ["ADMIN"]}]}
        },
      },
    })
      .select("_id members")
      .lean();

    let AllUsers: {
      isWorkSpaceMember: boolean;
      username: string;
      email: string;
      isGoogleAuth: boolean;
      hashedPassword: string;
      avatar: string;
      emailVerified: boolean;
      _id: mongoose.Schema.Types.ObjectId;
    }[] = [];
    if (workspace && workspace.members.length > 0) {
      //check if the
      AllUsers = users.map((user) => {
        if (
          workspace.members
            .map((member: any) => member.memberId.toString())
            .includes(user._id.toString())
        ) {
          return {
            ...user,
            isWorkSpaceMember: true,
          };
        }

        return {
          ...user,
          isWorkSpaceMember: false,
        };
      });
    }

      "All the users matching the query string and are members of workspace are matched",
      AllUsers
    );
    res.status(200).json({
      success: true,
      users: AllUsers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops, something went wrong." });
  }
};

export const searchBoardUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, boardId } = req.query;

    if (!query) {
      return next(new ErrorHandler(400, "query value is required"));
    }

    //find the users whose username or email matches the query string.
    let users = await User.find({
      $and: [
        {
          $or: [
            {
              username: { $regex: query, $options: "i" },
            },
            {
              email: { $regex: query, $options: "i" },
            },
          ],
        },
        {
          _id: { $ne: req.user._id },
          emailVerified: true,
        },
      ],
    })
      .lean()
      .select("_id username email avatar");

    //validate workspace
    if (!boardId || !mongoose.isValidObjectId(boardId)) {
      return next(
        new ErrorHandler(400, "boardId is required and must be valid")
      );
    }

    const board = await Board.findOne({
      _id: boardId,
    })
      .select("_id members")
      .lean();

    if (board && board.members.length > 0) {
      users = users.map((user: any) => {
        if (
          board.members
            .map((member: any) => member.memberId.toString())
            .includes(user._id.toString())
        ) {
          return {
            ...user,
            isMember: true,
          };
        }

        return {
          ...user,
          isMember: false,
        };
      });
    }

    res.send({
      success: true,
      users: users.map((user) => {
        return {
          ...user,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops something went wrong.",
    });
  }
};

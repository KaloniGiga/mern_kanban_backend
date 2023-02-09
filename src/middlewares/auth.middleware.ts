import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { PayloadType } from "../utils/Token";

export const isLoggedIn = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
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
    const data = jwt.verify(
      accessToken,
      process.env.ACCESS_KEY_SECRET!
    ) as PayloadType;

    const user = await User.findById(data._id).select(
      "_id username avatar email emailVerified isGoogleAuth"
    );

    if (!user) {
      console.log(data._id);

      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }
};

export const isVerified = (req: any, res: Response, next: NextFunction) => {
  req.user = { _id: "63b140d05a30f741acf23c6f" };
  next();
};

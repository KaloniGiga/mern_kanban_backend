import jwt, { Secret } from "jsonwebtoken";
import RefreshToken from "../models/refreshToken.model";
import mongoose from "mongoose";

export interface PayloadType {
  _id: mongoose.Schema.Types.ObjectId;
}

export const generateAccessToken = async (payload: PayloadType) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_KEY_SECRET!, {
    expiresIn: "1d",
  });
  console.log("access token generate");

  return accessToken;
};

export const generateRefreshToken = async (payload: PayloadType) => {
  const refreshTokenExist = await RefreshToken.findOne({ userId: payload._id });

  const refreshTokenSecret: string = process.env.REFRESH_KEY_SECRET!;

  if (refreshTokenExist) {
    console.log("refresh token exist for this userid");

    try {
      await jwt.verify(refreshTokenExist.refreshToken, refreshTokenSecret);

      console.log("refresh token verified");
      return refreshTokenExist.refreshToken;
    } catch (err) {
      console.log(payload._id);
      await RefreshToken.deleteOne({ _id: refreshTokenExist._id });

      const newRefreshToken = await jwt.sign(
        { userId: payload._id.toString() },
        refreshTokenSecret,
        { expiresIn: "7d" }
      );

      await RefreshToken.create({
        userId: payload._id,
        refreshToken: newRefreshToken,
      });

      console.log("new refresh token and created and saved to data base");

      return newRefreshToken;
    }
  } else {
    const newRefreshToken = await jwt.sign(
      payload,
      process.env.REFRESH_KEY_SECRET!,
      { expiresIn: "7d" }
    );
    console.log(newRefreshToken, payload._id);
    await RefreshToken.create({
      userId: payload._id,
      refreshToken: newRefreshToken,
    });

    console.log("refresh token created and saved to database");
    return newRefreshToken;
  }
};

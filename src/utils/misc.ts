import crypto from "crypto";

export const checkAllString = (members: any[]) => {
  return members.every((mem: any) => typeof mem === "string");
};

export const createRandomToken = async (length: any) => {
  return  crypto.randomBytes(length).toString("hex");
};

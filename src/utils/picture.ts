import fs from "fs-extra";
import { createRandomToken } from "./misc";
import sharp from "sharp";

export const removePicture = async (path: any) => {
  fs.remove(path, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("successfully deleted ");
    }
  });
};

export const savePicture = async (
  pic: any,
  width: number,
  height: number,
  dir: string
) => {
  const fileName = new Date().toISOString() + createRandomToken(24) + ".jpeg";

  await sharp()
    .resize(width, height)
    .toFormat("jpeg")
    .jpeg({ quality: 85 })
    .toFile(path.join(PUBLIC_DIR, directory, fileName));

  return fileName;
};

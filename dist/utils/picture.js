"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePicture = exports.removePicture = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const misc_1 = require("./misc");
const removePicture = async (path) => {
    fs_extra_1.default.remove(path, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("successfully deleted ");
        }
    });
};
exports.removePicture = removePicture;
const savePicture = async (pic, width, height, dir) => {
    const fileName = new Date().toISOString() + (0, misc_1.createRandomToken)(24) + ".jpeg";
    return fileName;
};
exports.savePicture = savePicture;

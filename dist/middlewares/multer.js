"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const multerUpload = async (req, res, next, fileName) => {
    console.log(fileName);
    // const storage = multer.diskStorage({
    //     destination: function async (req, file, callback) {
    //         callback(null, path.resolve(__dirname, '../public'))
    //     },
    //     filename: function(req, file, callback) {
    //         callback(null, file.originalname)
    //     }
    // });
    const storage = multer_1.default.memoryStorage();
    const fileFilter = (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        if (ext === "jpeg" || ext === "png" || ext === "jpg") {
            return cb(null, true);
        }
        return cb(new Error("image type unsupported."));
    };
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: 1024 * 1024 * 10
        },
    });
    const file = upload.single(fileName);
    file(req, res, (err) => {
        console.log(req.file);
        if (err instanceof multer_1.default.MulterError) {
            return res.status(400).json({
                success: false, message: err.message
            });
        }
        else if (err) {
            return res.status(400).json({
                success: false,
                error: err
            });
        }
        next();
    });
};
exports.multerUpload = multerUpload;

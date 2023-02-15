"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userCtrl = __importStar(require("../controllers/userProfile.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router();
router.route("/password/forget").post(userCtrl.forgotPassword);
router.route("/password/reset/:token").post(userCtrl.resetPassword);
router.route("/profile/update").put(auth_middleware_1.isLoggedIn, function (req, res, next) { (0, multer_1.multerUpload)(req, res, next, "profile"); }, userCtrl.updateProfile);
router.route("/profile/delete").delete(auth_middleware_1.isLoggedIn, userCtrl.deleteProfile);
router.route("/password/update").put(auth_middleware_1.isLoggedIn, userCtrl.updatePassword);
router.route("/user/readme").get(auth_middleware_1.isLoggedIn, userCtrl.readMe);
router.route("/email/verify/:token").get(auth_middleware_1.isLoggedIn, userCtrl.verifyEmail);
router.route("/email/resend").post(auth_middleware_1.isLoggedIn, userCtrl.resendEmail);
router.route("/user/search").get(auth_middleware_1.isLoggedIn, userCtrl.searchUser);
router.route("/user/search/board").get(auth_middleware_1.isLoggedIn, userCtrl.searchBoardUser);
exports.default = router;

import express from "express";
import * as userCtrl from "../controllers/userProfile.controller";
import { isLoggedIn } from "../middlewares/auth.middleware";
import { multerUpload } from "../middlewares/multer";

const router = express.Router();

router.route("/password/forget").post(userCtrl.forgotPassword);
router.route("/password/reset/:token").post(userCtrl.resetPassword);

router.route("/profile/update").put(isLoggedIn,
   //  function (req, res, next) { multerUpload(req, res, next, "profile")},
      userCtrl.updateProfile);

router.route("/profile/delete").delete(isLoggedIn, userCtrl.deleteProfile);
router.route("/password/update").put(isLoggedIn, userCtrl.updatePassword);
router.route("/user/readme").get(isLoggedIn, userCtrl.readMe);

router.route("/email/verify/:token").get(isLoggedIn, userCtrl.verifyEmail);
router.route("/email/resend").post(isLoggedIn, userCtrl.resendEmail);

router.route("/user/search").get(isLoggedIn, userCtrl.searchUser);
router.route("/user/search/board").get(isLoggedIn, userCtrl.searchBoardUser);
export default router;

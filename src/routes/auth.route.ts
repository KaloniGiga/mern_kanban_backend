import express from "express";
import * as AuthController from "../controllers/auth.controller";

const router = express.Router();

router.route("/register").post(AuthController.registerUser);

router.route("/login").post(AuthController.loginUser);

router.route("/google").post(AuthController.googleAuth);

router.route("/refresh").post(AuthController.refreshAccessToken);

export default router;

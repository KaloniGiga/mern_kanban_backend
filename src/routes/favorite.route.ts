import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";

import * as FavoriteCtrl from "../controllers/favorite.controller";

const router = express.Router();

router.route("/favorites").get(isLoggedIn, FavoriteCtrl.getFavorites);

router.route("/favorite/add").post(isLoggedIn, FavoriteCtrl.addToFavorites);

router.route("/favorite/:id").delete(isLoggedIn, FavoriteCtrl.removeFavorite);

export default router;

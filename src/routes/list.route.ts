import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";
import * as ListController from "../controllers/list.controller";

const router = express.Router();

router.route("/list/create").post(isLoggedIn, ListController.createList);

router.route("/:boardId/lists").get(isLoggedIn, ListController.getLists);

router.route("/:listId/update").put(isLoggedIn, ListController.updateList);

router.route("/:listId/delete").delete(isLoggedIn, ListController.deleteList);

export default router;

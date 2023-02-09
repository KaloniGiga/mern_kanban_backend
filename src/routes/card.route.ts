import express from "express";
import { isObjectIdOrHexString } from "mongoose";
import * as CardCtrl from "../controllers/card.controller";
import { isLoggedIn } from "../middlewares/auth.middleware";
import Card from "../models/cards.model.";

const router = express.Router();

router.route("/card/create").post(isLoggedIn, CardCtrl.createCard);

router.route("/my/cards").get(isLoggedIn, CardCtrl.getAllMyCards);

router.route("/card/:cardId").get(isLoggedIn, CardCtrl.getACard);

router.route("/card/:cardId/dnd").put(isLoggedIn, CardCtrl.moveCard);

router.route("/card/:cardId").delete(isLoggedIn, CardCtrl.deleteACard);

router.route("/card/:cardId/name").put(isLoggedIn, CardCtrl.updateACardName);

router
  .route("/card/:cardId/description")
  .put(isLoggedIn, CardCtrl.updateACardDescription);

router
  .route("/card/:cardId/expireDate")
  .put(isLoggedIn, CardCtrl.updateExpireDate);

router
  .route("/card/:cardId/isComplete")
  .put(isLoggedIn, CardCtrl.updateCardIsComplete);

router.route("/card/:cardId/members").get(isLoggedIn, CardCtrl.getAllMembers);

router.route("/card/:cardId/members").put(isLoggedIn, CardCtrl.addMember);

router
  .route("/card/:cardId/members")
  .delete(isLoggedIn, CardCtrl.removeCardMember);



router.route("/card/:cardId/labels").put(isLoggedIn, CardCtrl.addCardLabel);

router
  .route("/card/:cardId/labels")
  .delete(isLoggedIn, CardCtrl.removeCardLabel);

router
  .route("/card/member/remove")
  .delete(isLoggedIn, CardCtrl.removeCardMember);


  router.route('/card/:cardId/comment').post(isLoggedIn, CardCtrl.createCardComment);

  router.route(`/card/:cardId/comment`).put(isLoggedIn, CardCtrl.updateComment);

  router.route('/card/:cardId/comment').delete(isLoggedIn, CardCtrl.deleteComment)

export default router;

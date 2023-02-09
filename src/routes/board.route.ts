import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";
import * as BoardCtrl from "../controllers/board.controller";

const router = express.Router();

router.route("/board/create").post(isLoggedIn, BoardCtrl.createBoard);

router
  .route("/recentboard")
  .get(isLoggedIn, BoardCtrl.getRecentlyVisitedBoards);

router.route("/board/:boardId").get(isLoggedIn, BoardCtrl.getBoardDetail);

router
  .route("/board/:boardId/members")
  .get(isLoggedIn, BoardCtrl.getAllBoardMembers);

router
  .route("/board/:boardId/members/add")
  .put(isLoggedIn, BoardCtrl.addBoardMembers);

router.route("/board/:boardId/join").put(isLoggedIn, BoardCtrl.joinBoard);

router
  .route("/board/:boardId/member/:memberId/update")
  .put(isLoggedIn, BoardCtrl.updateMemberRole);

router
  .route("/board/:boardId/member/leave")
  .delete(isLoggedIn, BoardCtrl.leaveBoard);

router.route("/board/:boardId/name").put(isLoggedIn, BoardCtrl.updateBoardName);

router
  .route("/board/:boardId/description")
  .put(isLoggedIn, BoardCtrl.updateBoardDescription);

router
  .route("/board/:boardId/visibility")
  .put(isLoggedIn, BoardCtrl.updateBoardVisibility);

router.route("/board/:boardId/labels").get(isLoggedIn, BoardCtrl.getAllLabels);

router.route("/board/:boardId/labels").post(isLoggedIn, BoardCtrl.createLabel);

router.route("/board/:boardId/labels").put(isLoggedIn, BoardCtrl.updateLabel);

router
  .route("/board/:boardId/labels")
  .delete(isLoggedIn, BoardCtrl.removeLabel);

router.route("/board/:boardId").delete(isLoggedIn, BoardCtrl.deleteBoard);

export default router;

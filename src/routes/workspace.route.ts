import express from "express";
import { isLoggedIn, isVerified } from "../middlewares/auth.middleware";
import * as workSpaceCtrl from "../controllers/workspace.controller";

const router = express.Router();

router.route("/workspaces").get(isLoggedIn, workSpaceCtrl.getAllWorkSpaces);

router
  .route("/workspace/create")
  .post(isLoggedIn, workSpaceCtrl.createWorkSpace);

router
  .route("/workspace/:id")
  .get(isLoggedIn, workSpaceCtrl.getWorkSpaceDetail);

router
  .route("/workspace/me/owned")
  .get(isLoggedIn, workSpaceCtrl.getMyWorkSpaces);

router
  .route("/workspace/:id/boards")
  .get(isLoggedIn, workSpaceCtrl.getWorkSpaceBoard);

router
  .route("/workspace/:id/members")
  .get(isLoggedIn, workSpaceCtrl.getAllWorkSpaceMembers);

router
  .route("/workspace/:id/member/add")
  .put(isLoggedIn, workSpaceCtrl.addWorkSpaceMember);

router
  .route("/workspace/:id/members/add")
  .put(isLoggedIn, workSpaceCtrl.addWorkSpaceMembers);

router
  .route("/workspace/:id/member/:memberId")
  .put(isLoggedIn, workSpaceCtrl.updateMemberRole);

router
  .route("/workspace/:id/member/:memberId")
  .delete(isLoggedIn, workSpaceCtrl.deleteMember);

router
  .route("/workspace/:id/members")
  .delete(isLoggedIn, workSpaceCtrl.leaveWorkSpace);

router
  .route("/workspace/:id/settings")
  .get(isLoggedIn, workSpaceCtrl.getWorkSpaceSettings);

router
  .route("/workspace/:id/settings")
  .put(isLoggedIn, workSpaceCtrl.updateWorkSpaceSettings);

router
  .route("/workspace/:id")
  .delete(isLoggedIn, workSpaceCtrl.deleteWorkSpace);

export default router;

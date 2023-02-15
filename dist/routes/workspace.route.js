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
const auth_middleware_1 = require("../middlewares/auth.middleware");
const workSpaceCtrl = __importStar(require("../controllers/workspace.controller"));
const router = express_1.default.Router();
router.route("/workspaces").get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getAllWorkSpaces);
router
    .route("/workspace/create")
    .post(auth_middleware_1.isLoggedIn, workSpaceCtrl.createWorkSpace);
router
    .route("/workspace/:id")
    .get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getWorkSpaceDetail);
router
    .route("/workspace/me/owned")
    .get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getMyWorkSpaces);
router
    .route("/workspace/:id/boards")
    .get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getWorkSpaceBoard);
router
    .route("/workspace/:id/members")
    .get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getAllWorkSpaceMembers);
router
    .route("/workspace/:id/member/add")
    .put(auth_middleware_1.isLoggedIn, workSpaceCtrl.addWorkSpaceMember);
router
    .route("/workspace/:id/members/add")
    .put(auth_middleware_1.isLoggedIn, workSpaceCtrl.addWorkSpaceMembers);
router
    .route("/workspace/:id/member/:memberId")
    .put(auth_middleware_1.isLoggedIn, workSpaceCtrl.updateMemberRole);
router
    .route("/workspace/:id/member/:memberId")
    .delete(auth_middleware_1.isLoggedIn, workSpaceCtrl.deleteMember);
router
    .route("/workspace/:id/members")
    .delete(auth_middleware_1.isLoggedIn, workSpaceCtrl.leaveWorkSpace);
router
    .route("/workspace/:id/settings")
    .get(auth_middleware_1.isLoggedIn, workSpaceCtrl.getWorkSpaceSettings);
router
    .route("/workspace/:id/settings")
    .put(auth_middleware_1.isLoggedIn, workSpaceCtrl.updateWorkSpaceSettings);
router
    .route("/workspace/:id")
    .delete(auth_middleware_1.isLoggedIn, workSpaceCtrl.deleteWorkSpace);
exports.default = router;

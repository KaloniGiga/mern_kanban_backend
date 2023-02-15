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
const BoardCtrl = __importStar(require("../controllers/board.controller"));
const router = express_1.default.Router();
router.route("/board/create").post(auth_middleware_1.isLoggedIn, BoardCtrl.createBoard);
router
    .route("/recentboard")
    .get(auth_middleware_1.isLoggedIn, BoardCtrl.getRecentlyVisitedBoards);
router.route("/board/:boardId").get(auth_middleware_1.isLoggedIn, BoardCtrl.getBoardDetail);
router
    .route("/board/:boardId/members")
    .get(auth_middleware_1.isLoggedIn, BoardCtrl.getAllBoardMembers);
router
    .route("/board/:boardId/members/add")
    .put(auth_middleware_1.isLoggedIn, BoardCtrl.addBoardMembers);
router.route("/board/:boardId/join").put(auth_middleware_1.isLoggedIn, BoardCtrl.joinBoard);
router
    .route("/board/:boardId/member/:memberId/update")
    .put(auth_middleware_1.isLoggedIn, BoardCtrl.updateMemberRole);
router
    .route("/board/:boardId/member/leave")
    .delete(auth_middleware_1.isLoggedIn, BoardCtrl.leaveBoard);
router.route("/board/:boardId/name").put(auth_middleware_1.isLoggedIn, BoardCtrl.updateBoardName);
router
    .route("/board/:boardId/description")
    .put(auth_middleware_1.isLoggedIn, BoardCtrl.updateBoardDescription);
router
    .route("/board/:boardId/visibility")
    .put(auth_middleware_1.isLoggedIn, BoardCtrl.updateBoardVisibility);
router.route("/board/:boardId/labels").get(auth_middleware_1.isLoggedIn, BoardCtrl.getAllLabels);
router.route("/board/:boardId/labels").post(auth_middleware_1.isLoggedIn, BoardCtrl.createLabel);
router.route("/board/:boardId/labels").put(auth_middleware_1.isLoggedIn, BoardCtrl.updateLabel);
router
    .route("/board/:boardId/labels")
    .delete(auth_middleware_1.isLoggedIn, BoardCtrl.removeLabel);
router.route("/board/:boardId").delete(auth_middleware_1.isLoggedIn, BoardCtrl.deleteBoard);
exports.default = router;

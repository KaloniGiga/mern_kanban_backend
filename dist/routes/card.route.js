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
const CardCtrl = __importStar(require("../controllers/card.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.route("/card/create").post(auth_middleware_1.isLoggedIn, CardCtrl.createCard);
router.route("/my/cards").get(auth_middleware_1.isLoggedIn, CardCtrl.getAllMyCards);
router.route("/card/:cardId").get(auth_middleware_1.isLoggedIn, CardCtrl.getACard);
router.route("/card/:cardId/dnd").put(auth_middleware_1.isLoggedIn, CardCtrl.moveCard);
router.route("/card/:cardId").delete(auth_middleware_1.isLoggedIn, CardCtrl.deleteACard);
router.route("/card/:cardId/name").put(auth_middleware_1.isLoggedIn, CardCtrl.updateACardName);
router
    .route("/card/:cardId/description")
    .put(auth_middleware_1.isLoggedIn, CardCtrl.updateACardDescription);
router
    .route("/card/:cardId/expireDate")
    .put(auth_middleware_1.isLoggedIn, CardCtrl.updateExpireDate);
router
    .route("/card/:cardId/isComplete")
    .put(auth_middleware_1.isLoggedIn, CardCtrl.updateCardIsComplete);
router.route("/card/:cardId/members").get(auth_middleware_1.isLoggedIn, CardCtrl.getAllMembers);
router.route("/card/:cardId/members").put(auth_middleware_1.isLoggedIn, CardCtrl.addMember);
router
    .route("/card/:cardId/members")
    .delete(auth_middleware_1.isLoggedIn, CardCtrl.removeCardMember);
router.route("/card/:cardId/labels").put(auth_middleware_1.isLoggedIn, CardCtrl.addCardLabel);
router
    .route("/card/:cardId/labels")
    .delete(auth_middleware_1.isLoggedIn, CardCtrl.removeCardLabel);
router
    .route("/card/member/remove")
    .delete(auth_middleware_1.isLoggedIn, CardCtrl.removeCardMember);
router.route('/card/:cardId/comment').post(auth_middleware_1.isLoggedIn, CardCtrl.createCardComment);
router.route(`/card/:cardId/comment`).put(auth_middleware_1.isLoggedIn, CardCtrl.updateComment);
router.route('/card/:cardId/comment').delete(auth_middleware_1.isLoggedIn, CardCtrl.deleteComment);
exports.default = router;

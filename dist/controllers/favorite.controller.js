"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFavorite = exports.addToFavorites = exports.getFavorites = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const board_model_1 = __importDefault(require("../models/board.model"));
const favorite_model_1 = __importDefault(require("../models/favorite.model"));
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "userId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(userId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid userid"));
        }
        const myFavorites = await favorite_model_1.default.find({ userId: req.user._id });
        if (!myFavorites) {
            return res.status(201).json({ success: true, favorites: [] });
        }
        //make a list of favorite workspace and boards
        const Favworkspace = myFavorites
            .filter((fav) => fav.type === "WORKSPACE")
            .map((fav) => fav.resourceId);
        const Favboard = myFavorites
            .filter((fav) => fav.type === "BOARD")
            .map((fav) => fav.resourceId);
        //Although we have handled the usecases when the user is not the member of not authorized to access the resource,
        // we 'll double check here.
        //filter the workspace that exists
        const favoriteWorkspace = await workspace_model_1.default.find({
            _id: { $in: Favworkspace },
        })
            .lean()
            .select("_id name members visibility");
        //filter the board that exists
        const favoriteBoard = await board_model_1.default.find({ _id: { $in: Favboard } })
            .lean()
            .select("_id name bgImage color members visibility workspaceId")
            .populate({
            path: "workspaceId",
            select: "_id name members visibility",
        });
        //check if the user is member of the workspace
        const finalWorkspace = favoriteWorkspace
            .filter((workspace) => workspace.members.find((member) => member.memberId.toString() === req.user._id.toString()) || workspace.visibility === "PUBLIC")
            .map((fav) => {
            const FavoriteId = myFavorites.filter((myfav) => myfav.resourceId.toString() === fav._id.toString());
            return {
                _id: fav._id,
                type: "WORKSPACE",
                name: fav.name,
                visibility: fav.visibility,
                members: fav.members,
                isFavorite: FavoriteId ? true : false,
                FavoriteId: FavoriteId.length > 0 ? FavoriteId[0]._id : null,
            };
        });
        const finalBoards = favoriteBoard
            .filter((board) => (board.visibility === "PUBLIC" &&
            board.workspaceId.visibility === "PUBLIC") ||
            board.members
                .map((member) => member.memberId.toString())
                .includes(req.user._id.toString()))
            .map((fav) => {
            const FavoriteId = myFavorites.filter((myfav) => myfav.resourceId.toString() === fav._id.toString());
            return {
                _id: fav._id,
                name: fav.name,
                type: "BOARD",
                visibility: fav.visibility,
                bgImage: fav.bgImage,
                color: fav.color,
                members: fav.members,
                workspaceId: fav.workspaceId,
                isFavorite: FavoriteId ? true : false,
                FavoriteId: FavoriteId.length > 0 ? FavoriteId[0]._id : null,
            };
        });
        const allFavorites = [...finalWorkspace, ...finalBoards];
        return res.status(200).json({ success: true, favorites: allFavorites });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops! something went wrong!" });
    }
};
exports.getFavorites = getFavorites;
const addToFavorites = async (req, res, next) => {
    try {
        const { resourceId, type } = req.body;
        //validate the request body
        if (!resourceId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "resouceId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(resourceId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid resourceId"));
        }
        if (!type) {
            return next(new ErrorHandler_1.ErrorHandler(400, "resourceType is required"));
        }
        else if (!["BOARD", "WORKSPACE"].includes(type)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "type is not supported"));
        }
        //check for the resourceId
        if (type === "WORKSPACE") {
            const workspace = await workspace_model_1.default.findOne({
                _id: resourceId,
            })
                .lean()
                .select("_id members name visibility");
            if (!workspace) {
                return next(new ErrorHandler_1.ErrorHandler(404, "workspace not found"));
            }
            //check if the current user is a member of the workspace
            const isMember = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString());
            if (!isMember && workspace.visibility === "PRIVATE") {
                return next(new ErrorHandler_1.ErrorHandler(400, "You are not authorized to star the resource"));
            }
            //check if the current user has already starred the workspace
            const isAlreadyStarred = await favorite_model_1.default.findOne({
                resourceId: workspace._id,
                type: "WOKRSPACE",
                userId: req.user._id,
            });
            if (isAlreadyStarred) {
                return next(new ErrorHandler_1.ErrorHandler(400, "workspace is already is in your favorite list"));
            }
            //now that this workspace is public and you don't have starred it
            //add it to your favorite list
            const favorite = new favorite_model_1.default({
                resourceId: workspace._id,
                type: "WORKSPACE",
                userId: req.user._id,
            });
            await favorite.save();
            return res.status(200).json({
                success: true,
                favoriteResource: {
                    _id: favorite._id,
                    resourceId: workspace._id,
                    name: workspace.name,
                    type: "WORKSPACE",
                    visibility: workspace.visibility,
                },
            });
        }
        //else it is a board
        //check if the board exist
        const board = await board_model_1.default.findOne({ _id: resourceId })
            .select("_id name members color members visibility workspaceId")
            .populate({
            path: "workspaceId",
            select: "_id members visibility",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        //check if user is a board member
        const isMember = board.members.find((member) => member.memberId.toString() === req.user._id.toString());
        //check if user is a workspace admin
        const isWorkspaceAdmin = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (!isMember && board.visibility === "PRIVATE" && !isWorkspaceAdmin) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        //check if board is already added to favorite list
        const isAlreadyStarred = await favorite_model_1.default.findOne({
            resourceId: board._id,
            type: "BOARD",
            userId: req.user._id,
        });
        if (isAlreadyStarred) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board already added to favorite"));
        }
        //if you reach here
        //add the board to the favorite list
        const favorite = new favorite_model_1.default({
            resourceId: board._id,
            userId: req.user._id,
            type: "BOARD",
        });
        await favorite.save();
        return res.status(201).json({
            success: true,
            favoriteResource: {
                _id: favorite._id,
                name: board.name,
                resourceId: board._id,
                workspaceId: board.workspaceId,
                type: "BOARD",
                visibility: board.visibility,
                color: board.color,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Oops! Something went wrong.",
        });
    }
};
exports.addToFavorites = addToFavorites;
const removeFavorite = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "resourceId is requried"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "resourceId is invalid"));
        }
        //check the favourite
        const favorite = await favorite_model_1.default.findOne({ _id: id, userId: req.user._id });
        if (!favorite) {
            return next(new ErrorHandler_1.ErrorHandler(400, "first add the resource to the favorite list"));
        }
        await favorite_model_1.default.deleteOne({ _id: favorite._id, userId: req.user._id });
        res
            .status(200)
            .json({
            success: true,
            message: "Removed from favorites list successfully",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops! something went wrong!" });
    }
};
exports.removeFavorite = removeFavorite;

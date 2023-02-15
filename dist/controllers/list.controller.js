"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateList = exports.deleteList = exports.getLists = exports.createList = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
const validator_1 = __importDefault(require("validator"));
const board_model_1 = __importDefault(require("../models/board.model"));
const list_model_1 = __importDefault(require("../models/list.model"));
const cards_model_1 = __importDefault(require("../models/cards.model."));
const Comments_model_1 = __importDefault(require("../models/Comments.model"));
const createList = async (req, res, next) => {
    try {
        const { name, boardId, position } = req.body;
        if (!name) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name of a List is required"));
        }
        else if (name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(40, "Name must be less than 50 chars"));
        }
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is not valid"));
        }
        if (!position) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Position is required"));
        }
        else if (position < 100 && !validator_1.default.isAscii(position)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "position is not valid"));
        }
        //get the board
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId lists members visibility")
            .populate({ path: "workspaceId", select: "_id name members" })
            .populate({ path: "lists", select: "_id pos" });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        //check the role of the user
        const boardMemberRole = board.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString)?.role;
        if (!boardMemberRole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't create a list"));
        }
        if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "First join the board"));
        }
        if (boardMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Don't have a permission to create a list"));
        }
        //verify that position is empty
        const positionTaken = board.lists.find((list) => list.position === position);
        let lastPosition = position;
        if (positionTaken) {
            //create a new position at last
            //implement lexorank algorithm
            let maxpos = 0;
            board.lists.forEach((list) => {
                if (list.position > maxpos) {
                    maxpos = list.position;
                }
            });
            lastPosition = maxpos;
        }
        const newList = new list_model_1.default({
            name: validator_1.default.escape(name),
            boardId: board._id,
            position: lastPosition,
            creator: req.user._id,
        });
        board.lists.push(newList._id);
        await newList.save();
        await board.save();
        res
            .status(200)
            .json({ success: true, message: "List created Successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops! something went wrong" });
    }
};
exports.createList = createList;
const getLists = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is not valid"));
        }
        console.log("boardid is validated");
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members lists visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        })
            .populate({
            path: "lists",
            select: "_id name position",
            options: { sort: "position" },
        })
            .lean();
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        console.log("board is found and its details are fetched");
        //check the role of the user
        const boardMemberRole = board.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString)?.role;
        if (!boardMemberRole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't create a list"));
        }
        if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "First join the board"));
        }
        if (boardMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Don't have a permission to create a list"));
        }
        console.log("User have the permission to access board lists");
        const cards = await cards_model_1.default.find({
            listId: { $in: board.lists.map((list) => list._id) },
        })
            .lean()
            .select("_id name description position listId isComplete expireDate coverImage labels comments creator members color")
            .populate({
            path: "labels",
            select: "_id name color position",
        })
            .populate({
            path: "members",
            select: "_id username avatar",
        });
        if (!cards) {
            res.status(200).json({
                message: "This is not a works",
                lists: board.lists.map((list) => {
                    return {
                        _id: list._id,
                        name: list.name,
                        position: list.position,
                        boardId: boardId,
                        workspaceId: board.workspaceId._id,
                        cards: [],
                    };
                }),
            });
        }
        console.log("select card of the list", cards);
        // const finalLists = board.lists.map((list:any) => {
        // })
        const finalLists = board.lists.map((list) => {
            const finalCards = cards.filter((card) => card.listId.toString() === list._id.toString());
            console.log(finalCards);
            return {
                _id: list._id,
                name: list.name,
                position: list.position,
                boardId: boardId,
                workspaceId: board.workspaceId._id,
                cards: finalCards,
            };
        });
        res.status(200).json({
            success: true,
            lists: finalLists,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.getLists = getLists;
const deleteList = async (req, res, next) => {
    try {
        const { listId } = req.params;
        if (!listId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "listId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(listId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "listId is not valid"));
        }
        //get the delete
        const list = await list_model_1.default.findOne({ _id: listId })
            .select("_id name boardId cards")
            .lean();
        if (!list) {
            return next(new ErrorHandler_1.ErrorHandler(404, "List not found"));
        }
        const board = await board_model_1.default.findOne({ _id: list.boardId })
            .select("_id visibility  workspaceId lists members ")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        //check if the user is boardAdmin or workspaceAdmin
        const boardMemberRole = board?.members.find((member) => {
            member.memberId.toString() === req.user._id.toString();
        })?.role;
        const workspaceMember = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (!boardMemberRole && !workspaceMember) {
            return next(new ErrorHandler_1.ErrorHandler(400, "can't delete the list"));
        }
        if (!boardMemberRole && workspaceMember === "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(400, "can't delete the list"));
        }
        if (!boardMemberRole &&
            workspaceMember === "NORMAL" &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "can't delete the list"));
        }
        await list_model_1.default.deleteOne({ _id: list._id });
        await cards_model_1.default.deleteMany({ _id: { $in: list.cards } });
        await Comments_model_1.default.deleteMany({ cardId: { $in: list.cards } });
        board.lists = board.lists.filter((list) => list._id.toString() !== list._id.toString());
        await board.save();
        res
            .status(200)
            .json({ success: true, message: "List has been deleted successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.deleteList = deleteList;
const updateList = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const [name] = req.body;
        if (!listId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "ListId is requried"));
        }
        else if (!mongoose_1.default.isValidObjectId(listId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid listid"));
        }
        if (!name) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name is required"));
        }
        else if (name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name must not be greater than 50 characters"));
        }
        console.log("Listid validated");
        const list = await list_model_1.default.findOne({ _id: listId }).select("_id name boardId");
        if (!list) {
            return next(new ErrorHandler_1.ErrorHandler(404, "List not found"));
        }
        console.log("List having listId found");
        const board = await board_model_1.default.findOne({ _id: list.boardId })
            .select("_id name workspaceid members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members visibility",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        console.log("board found");
        const isboardMember = board.members.find((member) => member.memberId.toString() === req.user._id.toString());
        const isWorkspaceMember = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString());
        //check if the user is authorized to update the list or not
        if ((!isboardMember && !isWorkspaceMember) ||
            (!isboardMember &&
                isWorkspaceMember?.role === "NORMAL" &&
                board.visibility === "PRIVATE")) {
            return next(new ErrorHandler_1.ErrorHandler(400, "List not found"));
        }
        console.log("you are authorized to update the board");
        list.name = validator_1.default.escape(name);
        await list.save();
        res.status(201).json({
            success: true,
            message: "List updated successfully",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops! Something went wrong" });
    }
};
exports.updateList = updateList;

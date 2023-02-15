"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoard = exports.getAllLabels = exports.removeLabel = exports.updateLabel = exports.createLabel = exports.updateBackground = exports.joinBoard = exports.leaveBoard = exports.removeMember = exports.updateMemberRole = exports.addBoardMembers = exports.getAllBoardMembers = exports.getRecentlyVisitedBoards = exports.updateBoardVisibility = exports.updateBoardDescription = exports.updateBoardName = exports.getBoardDetail = exports.createBoard = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const board_model_1 = __importDefault(require("../models/board.model"));
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
const validator_1 = __importDefault(require("validator"));
const favorite_model_1 = __importDefault(require("../models/favorite.model"));
const recentBoards_model_1 = __importDefault(require("../models/recentBoards.model."));
const cards_model_1 = __importDefault(require("../models/cards.model."));
const list_model_1 = __importDefault(require("../models/list.model"));
const Comments_model_1 = __importDefault(require("../models/Comments.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const Label_model_1 = __importDefault(require("../models/Label.model"));
const createBoard = async (req, res, next) => {
    try {
        const { workspaceId, name, description, color, bgImage, boardVisibility } = req.body;
        //validate workspaceId
        if (!workspaceId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceId is requred"));
        }
        else if (!mongoose_1.default.isValidObjectId(workspaceId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is not valid"));
        }
        //validate name
        if (!name) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board name is required"));
        }
        else if (name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board name should be smaller than 50 characters"));
        }
        if (description && description.length > 255) {
            return next(new ErrorHandler_1.ErrorHandler(400, "description must be less than 255 chars"));
        }
        //validate color
        if (color) {
            if (color.length !== 7 || color[0] !== "#") {
                return next(new ErrorHandler_1.ErrorHandler(400, "color must in hex format"));
            }
        }
        //validate background Image
        if (bgImage && !validator_1.default.isURL(bgImage)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Image URL is invalid"));
        }
        //validate board visibility
        if (boardVisibility && !["PUBLIC", "PRIVATE"].includes(boardVisibility)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board visibility must be either private or public"));
        }
        //check if workspace exists or not
        const workspace = await workspace_model_1.default.findOne({
            _id: workspaceId,
            members: { $elemMatch: { memberId: req.user._id } },
        }).select("_id boards");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        //check the role of the user in current workspace
        //create a board
        const newBoard = new board_model_1.default({
            name: validator_1.default.escape(name),
            workspaceId: workspaceId,
            creator: req.user._id,
        });
        if (description) {
            newBoard.description = validator_1.default.escape(description);
        }
        if (bgImage) {
            newBoard.bgImage = bgImage;
        }
        if (boardVisibility) {
            newBoard.visibility = boardVisibility;
        }
        //add current user as admin of board
        newBoard.members.push({ memberId: req.user._id, role: "ADMIN" });
        //add the board to the workspace and save both
        await newBoard.save();
        workspace.boards.push(newBoard._id);
        await workspace.save();
        res.status(200).json({ success: true, board: newBoard });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.createBoard = createBoard;
const getBoardDetail = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board id is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid board _id"));
        }
        //check if the board exist
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id name description bgImage color members workspaceId visibility")
            .populate({
            path: "members",
            populate: { path: "memberId", select: "_id username avatar" },
        })
            .populate({
            path: "workspaceId",
            select: "_id name members visibility",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const isFavorite = await favorite_model_1.default.findOne({
            resourceId: board._id,
            userId: req.user._id,
            type: "BOARD",
        });
        const isMember = board.members
            .map((member) => member.memberId._id.toString())
            .includes(req.user._id.toString());
        const role = board.members.find((member) => member.memberId._id.toString() === req.user._id.toString())?.role;
        //if user is a member of board update his recent board list
        if (isMember) {
            const recentBoard = await recentBoards_model_1.default.findOne({
                userId: req.user._id,
                boardId: board._id,
            });
            if (recentBoard) {
                recentBoard.lastVisited = new Date(Date.now());
                await recentBoard.save();
            }
            else {
                const newRecentBoard = new recentBoards_model_1.default({
                    userId: req.user._id,
                    boardId: board._id,
                    lastVisited: new Date(Date.now()),
                });
                await newRecentBoard.save();
            }
            return res.status(200).json({
                success: true,
                board: {
                    _id: board._id,
                    name: board.name,
                    description: board.description,
                    visibility: board.visibility,
                    role: role,
                    isFavorite: isFavorite ? true : false,
                    FavoriteId: isFavorite && isFavorite._id,
                    workspace: {
                        _id: board.workspaceId._id,
                        name: board.workspaceId.name,
                    },
                    color: board.color,
                    bgImage: board.bgImage,
                    lists: board.lists,
                    members: board.members.map((member) => {
                        return {
                            _id: member.memberId._id,
                            username: member.memberId.username,
                            avatar: member.memberId.avatar,
                            role: member.role,
                        };
                    }),
                },
            });
        }
        const workspaceMember = board.workspaceId.members
            .map((member) => member.memberId.toString())
            .includes(req.user._id.toString());
        const workspaceRole = workspaceMember &&
            board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if ((!workspaceMember && board.visibility === "PRIVATE") ||
            (workspaceRole === "NORMAL" && board.visibility === "PRIVATE")) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        //update the recently visited board for the user
        const recentBoard = await recentBoards_model_1.default.findOne({
            userId: req.user._id,
            boardId: board._id,
        });
        if (recentBoard) {
            recentBoard.lastVisited = new Date(Date.now());
            await recentBoard.save();
        }
        else {
            const newBoard = new recentBoards_model_1.default({
                userId: req.user._id,
                boardId: board._id,
            });
            await newBoard.save();
        }
        res.status(200).json({
            success: true,
            board: {
                _id: board._id,
                name: board.name,
                role: role,
                description: board.description,
                visibility: board.visibility,
                color: board.color,
                bgImage: board.bgImage,
                workspace: {
                    _id: board.workspaceId._id,
                    name: board.workspaceId.name,
                },
                lists: board.lists,
                isFavorite: isFavorite ? true : false,
                FavoriteId: isFavorite && isFavorite._id,
                members: board.members.map((member) => {
                    return {
                        _id: member._id,
                        username: member.username,
                        picture: member.picture,
                        role: member.role,
                    };
                }),
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.getBoardDetail = getBoardDetail;
const updateBoardName = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { newName } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        if (!newName) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newName is required"));
        }
        else if (newName.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newName should be less than 50 characters"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id name workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        board.name = validator_1.default.escape(newName);
        await board.save();
        return res
            .status(200)
            .json({
            success: true,
            message: "board visibility updated successfully.",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, Something went wrong!" });
    }
};
exports.updateBoardName = updateBoardName;
const updateBoardDescription = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { newDescription } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        if (!newDescription) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newName is required"));
        }
        else if (newDescription.length > 255) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newName should be less than 255 characters"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id description workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        board.description = validator_1.default.escape(newDescription.trim());
        await board.save();
        return res
            .status(200)
            .json({
            success: true,
            message: "board description updated successfully.",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, Something went wrong!" });
    }
};
exports.updateBoardDescription = updateBoardDescription;
const updateBoardVisibility = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { newVisibility } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        if (!newVisibility) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newVisibility is required"));
        }
        else if (!["PRIVATE", "PUBLIC"].includes(newVisibility)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newVisibility should be either PRIVATE/PUBLIC"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        if (board.visibility === newVisibility) {
            return next(new ErrorHandler_1.ErrorHandler(200, "The newVisibility is already exist"));
        }
        board.visibility = newVisibility;
        await board.save();
        return res
            .status(200)
            .json({
            success: true,
            message: "board visibility updated successfully.",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, Something went wrong!" });
    }
};
exports.updateBoardVisibility = updateBoardVisibility;
const getRecentlyVisitedBoards = async (req, res, next) => {
    try {
        //get the recently visited boards form the database
        const recentBoards = await recentBoards_model_1.default.find({ userId: req.user._id })
            .select("_id boardId")
            .populate({
            path: "boardId",
            select: "_id name color bgImage workspaceId visibility createdAt",
        })
            .sort({ lastVisited: -1 })
            .limit(5)
            .lean();
        //find if the boards are starred as favorite or not
        const formattedRecentBoards = await Promise.all(recentBoards.map(async (board) => {
            const isFavorite = await favorite_model_1.default.findOne({
                resourceId: board.boardId._id,
                userId: req.user._id,
                type: "BOARD",
            });
            return {
                _id: board.boardId._id,
                name: board.boardId.name,
                color: board.boardId.color,
                isFavorite: isFavorite ? true : false,
                favoriteId: isFavorite && isFavorite._id,
                bgImage: board.boardId.bgImage,
                workspaceId: board.boardId.workspaceId,
                visibility: board.boardId.visibility,
                createdAt: board.boardId.createdAt,
            };
        }));
        res.status(200).json({ success: true, boards: formattedRecentBoards });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.getRecentlyVisitedBoards = getRecentlyVisitedBoards;
const getAllBoardMembers = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId visibility members")
            .populate({
            path: "members",
            populate: { path: "memberId", select: "_id username avatar" },
        })
            .populate({ path: "workspaceId", select: "_id  members visibility" });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        const boardMemberRole = board.members.find((member) => member.memberId._id.toString() === req.user._id.toString())?.role;
        // const workspace = await WorkSpace.findOne({_id: board.workspaceId._id}).select("_id members")
        // if(!workspace){
        //  return next(new ErrorHandler(400, "Workspace doesnot exist"));
        // }
        const workspaceMemberRole = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //condition for user is not able to add members
        if (!boardMemberRole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't invite people to this board"));
        }
        if (!boardMemberRole &&
            workspaceMemberRole === "NORMAL" &&
            board.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "you can't invite people to the board"));
        }
        if (boardMemberRole !== "ADMIN" && boardMemberRole !== "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't invite people"));
        }
        if (!boardMemberRole && workspaceMemberRole === "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You are not a member of a board"));
        }
        //const AllAdmins = board.members.filter((member:any) => member.role === "ADMIN");
        res.status(200).json({
            success: true,
            AllMembers: board.members.map((member) => {
                return {
                    _id: member.memberId._id,
                    username: member.memberId.username,
                    avatar: member.memberId.avatar,
                    role: member.role,
                    //isOnlyAdmin: (AllAdmins.map((m:any) => m.memberId.toString()).includes(member.memberId._id.toString()) && AllAdmins.length === 1) ? true : false
                };
            }),
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops, something went wrong." });
    }
};
exports.getAllBoardMembers = getAllBoardMembers;
const addBoardMembers = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { members, role } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardID"));
        }
        if (!members) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Member must not be emepty"));
        }
        else if (!Array.isArray(members)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Members must be any array"));
        }
        else if (members.find((member) => !mongoose_1.default.isValidObjectId(member))) {
            return next(new ErrorHandler_1.ErrorHandler(400, "member must be a valid id"));
        }
        if (!role) {
            return next(new ErrorHandler_1.ErrorHandler(400, "role is required"));
        }
        else if (role !== "NORMAL" && role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "role must be normal or admin"));
        }
        //filter the duplicate from the members array
        let uniqueValues = members.filter((id) => id);
        uniqueValues = uniqueValues.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        if (uniqueValues.length === 0) {
            return next(new ErrorHandler_1.ErrorHandler(400, "there must be at least 1 unique value"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        //  const boardMemberRole = board.members.find((member:any) => member.memberId.toString() === req.user._id.toString())?.role
        //  const workspaceMemberRole =  board.workspaceId.members.find((member:any) => member.memberId.toString() === req.user._id.toString())?.role
        //  //condition for user is not able to add members
        //   if(!boardMemberRole && !workspaceMemberRole){
        //      return next(new ErrorHandler(400, "You can't invite people to this board"));
        //   }
        //   if(!boardMemberRole && workspaceMemberRole === "NORMAL" && board.visibility === "PRIVATE"){
        //      return next(new ErrorHandler(400, "you can't invite people to the board"));
        //   }
        //   if(boardMemberRole !== "ADMIN" && boardMemberRole !== "NORMAL"){
        //      return next(new ErrorHandler(400, "You can't invite people"))
        //   }
        //   if(!boardMemberRole && workspaceMemberRole === "NORMAL"){
        //     return next(new ErrorHandler(400, "You are not a member of a board"))
        //   }
        //check if the members to add are already the member of board
        uniqueValues = uniqueValues.filter((value) => !board.members
            .map((m) => m.memberId.toString())
            .includes(value.toString()));
        //check if the uniqueValues are valid members
        const existingMember = await user_model_1.default.find({
            _id: { $in: uniqueValues },
            emailVerified: true,
        })
            .select("_id")
            .lean();
        const finalMembers = existingMember.map((member) => {
            return {
                memberId: member._id.toString(),
                role: role,
            };
        });
        if (finalMembers) {
            finalMembers.map((m) => board.members.push(m));
        }
        //if they are not workspace members, handle them
        await board.save();
        return res.send({
            success: true,
            message: "Members added to the board",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops! something went wrong" });
    }
};
exports.addBoardMembers = addBoardMembers;
const updateMemberRole = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        const { newRole } = req.body;
        //validate boardId
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required."));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        //validate memberId
        if (!memberId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is required."));
        }
        else if (!mongoose_1.default.isValidObjectId(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid memberId"));
        }
        //validate newRole
        if (!newRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newRole is required"));
        }
        else if (!["ADMIN", "NORMAL"].includes(newRole)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "invalid new Role"));
        }
        //find the board
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const memberToBeUpdated = board.members.find((member) => member.memberId.toString() === memberId);
        if (!memberToBeUpdated) {
            return next(new ErrorHandler_1.ErrorHandler(403, "member to be updated not found"));
        }
        const boardAdmins = board.members
            .filter((member) => member.role === "ADMIN")
            .map((member) => member.memberId.toString());
        //if member to be updated is a workspace ADMIN
        if (board.workspaceId.members
            .filter((member) => member.role === "ADMIN")
            .map((member) => member.memberId.toString().includes(memberId))) {
            return next(new ErrorHandler_1.ErrorHandler(403, "can't change the role of space admin in board"));
        }
        //check if the user is only board admin
        if (boardAdmins.length === 1 && boardAdmins.includes(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "there must be a at least one board admin"));
        }
        if (newRole === memberToBeUpdated.role) {
            return next(new ErrorHandler_1.ErrorHandler(201, "user already has the same role"));
        }
        board.members = board.members.map((member) => {
            if (member.memberId === memberToBeUpdated.memberId) {
                member.role = newRole;
                return member;
            }
            return member;
        });
        await board.save();
        res
            .status(200)
            .json({ success: true, message: "Member updated successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops something went wrong." });
    }
};
exports.updateMemberRole = updateMemberRole;
const removeMember = async (req, res, next) => {
    try {
        const { boardId, memberId } = req.params;
        //validate boardId
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required."));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        //validate memberId
        if (!memberId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is required."));
        }
        else if (!mongoose_1.default.isValidObjectId(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid memberId"));
        }
        //find the board
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const memberToBeUpdated = board.members.find((member) => member.memberId.toString() === memberId);
        if (!memberToBeUpdated) {
            return next(new ErrorHandler_1.ErrorHandler(403, "member to be updated not found"));
        }
        const boardAdmins = board.members
            .filter((member) => member.role === "ADMIN")
            .map((member) => member.memberId.toString());
        //if member to be updated is a workspace ADMIN
        if (board.workspaceId.members
            .filter((member) => member.role === "ADMIN")
            .map((member) => member.memberId.toString().includes(memberId))) {
            return next(new ErrorHandler_1.ErrorHandler(403, "can't change the role of space admin in board"));
        }
        //check if the user is only board admin
        if (boardAdmins.length === 1 && boardAdmins.includes(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "there must be a at least one board admin"));
        }
        if (req.user._id.toString() === memberToBeUpdated.memberId.toString()) {
            return next(new ErrorHandler_1.ErrorHandler(400, "you can't remove yourself."));
        }
        //remove the target memberId
        board.members = board.members.filter((member) => member.memberId.toString() !== memberToBeUpdated.memberId.toString());
        await cards_model_1.default.updateMany({
            listId: { $in: board.lists },
            members: memberToBeUpdated.memberId,
        }, {
            $pull: { members: { $in: [memberToBeUpdated.memberId] } },
        });
        await board.save();
        res
            .status(200)
            .json({ success: true, message: "Member removed successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.removeMember = removeMember;
const leaveBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        //validate boardId
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required."));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardId"));
        }
        //find the board
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const memberToBeUpdated = board.members.find((member) => member.memberId.toString() === req.user._id.toString());
        if (!memberToBeUpdated) {
            return next(new ErrorHandler_1.ErrorHandler(403, "member to be updated not found"));
        }
        const boardAdmins = board.members
            .filter((member) => member.role === "ADMIN")
            .map((member) => member.memberId.toString());
        //if member to be updated is a workspace ADMIN
        //  if(board.workspaceId.members.filter((member:any) => member.role === "ADMIN")
        //    .map((member:any) => member.memberId.toString()
        //    .includes(req.user._id.toString()))){
        //     return next(new ErrorHandler(403, "can't change the role of space admin in board"))
        //    }
        //check if the user is only board admin
        if (boardAdmins.length === 1 &&
            boardAdmins.includes(req.user._id.toString())) {
            return next(new ErrorHandler_1.ErrorHandler(400, "there must be a at least one board admin"));
        }
        board.members = board.members.filter((member) => member.memberId.toString() !== memberToBeUpdated.memberId.toString());
        await cards_model_1.default.updateMany({ listId: { $in: board.lists }, members: memberToBeUpdated.memberId }, {
            $pull: { members: { $in: [memberToBeUpdated.memberId] } },
        });
        await board.save();
        res.status(201).json({
            success: true,
            message: "Removed successfully from Board",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Oops, something went wrong",
        });
    }
};
exports.leaveBoard = leaveBoard;
const joinBoard = async (req, res, next) => { };
exports.joinBoard = joinBoard;
const updateBackground = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { bgImage, color } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is invalid"));
        }
        if (color) {
            if (color.length !== 7 || color[0] !== "#") {
                return next(new ErrorHandler_1.ErrorHandler(400, "color must be in hex format"));
            }
        }
        if (!Object.keys(req.body).includes(bgImage)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BgImage is required"));
        }
        else if (bgImage &&
            !validator_1.default.isURL(bgImage, { require_protocol: true })) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid bgImage"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility color bgImg")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        if (Object.keys(req.body).includes(color)) {
            board.color = color;
        }
        if (Object.keys(req.body).includes(bgImage)) {
            board.bgImage = bgImage;
        }
        await board.save();
        return res
            .status(200)
            .json({
            success: false,
            message: "Board background updated successfully",
        });
    }
    catch (error) {
        res
            .status(200)
            .json({ success: false, message: "Oops, Something went wrong!" });
    }
};
exports.updateBackground = updateBackground;
const createLabel = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { name, color } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is invalid"));
        }
        if (name && name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name must be less than 512 characters."));
        }
        if (!color) {
            return next(new ErrorHandler_1.ErrorHandler(400, "color is required"));
        }
        else if (color.length !== 7 || color[0] !== "#") {
            return next(new ErrorHandler_1.ErrorHandler(400, "color code must be in hex format"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members labels visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        })
            .populate({
            path: "labels",
            select: "_id name color boardId",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberRole = board.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberRole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, `board not found`));
        }
        if (!boardMemberRole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const labelExist = board.labels.find((label) => label.name === name &&
            label.color === color &&
            label.boardId.toString() === board._id.toString())
            ? true
            : false;
        if (labelExist) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Label already exists"));
        }
        const newLabel = new Label_model_1.default({
            name: name,
            color: color,
            boardId: board._id,
        });
        board.labels.push(newLabel._id);
        await newLabel.save();
        await board.save();
        res.status(201).json({
            success: true,
            label: {
                _id: newLabel._id,
                name: newLabel.name,
                color: newLabel.color,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops! Something went wrong." });
    }
};
exports.createLabel = createLabel;
const updateLabel = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { labelId } = req.body;
        const { name, color } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is invalid"));
        }
        if (!labelId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "labelId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(labelId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid labelId"));
        }
        if (name && name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name must be less than 512 characters."));
        }
        if (!color) {
            return next(new ErrorHandler_1.ErrorHandler(400, "color is required"));
        }
        else if (color.length !== 7 || color[0] !== "#") {
            return next(new ErrorHandler_1.ErrorHandler(400, "color code must be in hex format"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members labels visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        })
            .populate({
            path: "labels",
            select: "_id name color boardId",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const label = await Label_model_1.default.findOne({
            _id: labelId,
            boardid: board._id,
        }).select("_id name color");
        if (!label) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Label not found"));
        }
        if (Object.keys(req.body).includes("name")) {
            label.name = validator_1.default.escape(name);
        }
        if (Object.keys(req.body).includes("color")) {
            label.name = validator_1.default.escape(color);
        }
        await board.save();
        await label.save();
        res
            .status(200)
            .json({ success: true, message: "Label updated successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, Something went wrong" });
    }
};
exports.updateLabel = updateLabel;
const removeLabel = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { labelId } = req.body;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is invalid"));
        }
        if (!labelId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "labelId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(labelId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid labelId"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members labels visibility")
            .populate({
            path: "workspaceId",
            select: "_id name members",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const boardMemberrole = board?.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const workspaceMemberRole = board?.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user is the boardAdmin or the workspaceAdmin
        if (!boardMemberrole && !workspaceMemberRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board not found"));
        }
        if (!boardMemberrole &&
            workspaceMemberRole &&
            board?.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "Board not found"));
        }
        if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "You can't access the board details"));
        }
        const label = await Label_model_1.default.findOne({ _id: labelId, boardId: board._id });
        if (!label) {
            return next(new ErrorHandler_1.ErrorHandler(404, "label not found"));
        }
        board.labels = board.labels.filter((label) => label.toString() !== label._id.toString());
        await cards_model_1.default.updateMany({ listId: { $in: board.lists }, labels: label._id }, { $pull: { labels: { $in: [label._id] } } });
        await board.save();
        await Label_model_1.default.deleteOne({ _id: label._id });
        res
            .status(200)
            .json({ success: true, message: "Label deleted successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, Something went wrong!" });
    }
};
exports.removeLabel = removeLabel;
const getAllLabels = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "BoardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is invalid"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id workspaceId members visibility labels")
            .populate({
            path: "workspaceId",
            select: "_id members",
        })
            .populate({
            path: "labels",
            select: "_id name color",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Board not found"));
        }
        const isboardMember = board.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        const isWorkspaceMember = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        //check if the user have access to this board
        //case1: if user neither boardmember or a workspace member
        if (!isboardMember && !isWorkspaceMember) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Don't have a permission to access board"));
        }
        //case2: if user is a workspace member but not a boardmember and the board is private
        if (isWorkspaceMember !== "ADMIN" &&
            !isboardMember &&
            board.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "can't access this board"));
        }
        res.status(200).json({
            success: true,
            labels: board.labels,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops, Something went wrong!" });
    }
};
exports.getAllLabels = getAllLabels;
const deleteBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        if (!boardId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "boardId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(boardId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid boardID"));
        }
        const board = await board_model_1.default.findOne({ _id: boardId })
            .select("_id lists members workspaceId visibility ")
            .populate({
            path: "workspaceId",
            select: "_id members visibility",
        });
        if (!board) {
            return next(new ErrorHandler_1.ErrorHandler(400, "board does not exist"));
        }
        console.log("board found", board);
        //check if current is board member or a workspace member
        const isboardMember = board.members.find((member) => member.memberId.toString() === req.user._id.toString());
        const isWorkspaceMember = board.workspaceId.members.find((member) => member.memberId.toString() === req.user._id.toString());
        //check if the user have access to this board
        //case1: if user neither boardmember or a workspace member
        if (!isboardMember && !isWorkspaceMember) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Don't have a permission to access board"));
        }
        //case2: if user is a workspace member but not a boardmember and the board is private
        if (isWorkspaceMember && !isboardMember && board.visibility === "PRIVATE") {
            return next(new ErrorHandler_1.ErrorHandler(400, "can't access this board"));
        }
        //case3: if user is not a board admin or a workspace admin
        if (!(isboardMember && isboardMember.role === "ADMIN") &&
            !(isWorkspaceMember && isWorkspaceMember.role === "ADMIN")) {
            return next(new ErrorHandler_1.ErrorHandler(400, "you don't have permission"));
        }
        console.log("you are authorized to delete board");
        //delete all the resources associated to the boards
        const cards = await cards_model_1.default.find({ listId: { $in: board.lists } }).select("_id");
        console.log("cards found");
        await board_model_1.default.deleteOne({ _id: board._id });
        console.log("board delete");
        await list_model_1.default.deleteMany({ boardId: board._id });
        console.log("cards found");
        await cards_model_1.default.deleteMany({ listId: { $in: board.lists } });
        console.log("cards found");
        await Comments_model_1.default.deleteMany({ cardId: { $in: cards } });
        console.log("cards found");
        await favorite_model_1.default.deleteOne({ resourceId: board._id, type: "BOARD" });
        console.log("cards found");
        await recentBoards_model_1.default.deleteOne({ boardId: board._id, userId: req.user._id });
        console.log("cards found");
        //remove the board from the workspace
        const workspace = await workspace_model_1.default.findOne({
            _id: board.workspaceId._id,
        }).select("_id boards");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Workspace not found"));
        }
        workspace.boards = workspace.boards.filter((bo) => bo.toString() !== board._id.toString());
        await workspace.save();
        res
            .status(200)
            .json({ success: true, message: "board deleted successfully." });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: true, message: "Oops something went wrong!" });
    }
};
exports.deleteBoard = deleteBoard;

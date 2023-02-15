"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkSpace = exports.updateWorkSpaceSettings = exports.getWorkSpaceSettings = exports.leaveWorkSpace = exports.deleteMember = exports.updateMemberRole = exports.addWorkSpaceMember = exports.addWorkSpaceMembers = exports.getAllWorkSpaceMembers = exports.getWorkSpaceBoard = exports.getMyWorkSpaces = exports.getWorkSpaceDetail = exports.createWorkSpace = exports.getAllWorkSpaces = void 0;
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const path_1 = __importDefault(require("path"));
const favorite_model_1 = __importDefault(require("../models/favorite.model"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const user_model_1 = __importDefault(require("../models/user.model"));
const board_model_1 = __importDefault(require("../models/board.model"));
const Label_model_1 = __importDefault(require("../models/Label.model"));
const list_model_1 = __importDefault(require("../models/list.model"));
const cards_model_1 = __importDefault(require("../models/cards.model."));
const Comments_model_1 = __importDefault(require("../models/Comments.model"));
const recentBoards_model_1 = __importDefault(require("../models/recentBoards.model."));
//get all workspaces
const getAllWorkSpaces = async (req, res, next) => {
    try {
        const allWorkSpaces = await workspace_model_1.default.find({
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        })
            .select("_id name members picture createdAt")
            .sort({ createdAt: 1 });
        const workSpaceObj = await Promise.all(allWorkSpaces.map(async (workspace) => {
            const favorite = await favorite_model_1.default.findOne({
                resourceId: workspace._id,
                userId: req.user._id,
                type: "WORKSPACE",
            });
            const role = workspace.members.find((member) => {
                member.memberId.toString() === req.user._id.toString();
            })?.role;
            const STATIC_PATH = process.env.STATIC_PATH || "/static";
            const WORKSPACE_PICTURE_DIR_NAME = process.env.WORKSPACE_PICTURE_DIR_NAME || "workspace_icons";
            return {
                _id: workspace._id,
                name: workspace.name,
                role: role,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                picture: workspace.picture
                    ? process.env.FULL_BASE_PATH +
                        path_1.default.join(STATIC_PATH, WORKSPACE_PICTURE_DIR_NAME, workspace.picture)
                    : undefined,
            };
        }));
        res.status(201).json({
            success: true,
            workspaces: workSpaceObj,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Oops, something went wrong",
        });
    }
};
exports.getAllWorkSpaces = getAllWorkSpaces;
//create a workspace
const createWorkSpace = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        //validation
        //for name
        if (!name) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Name is required"));
        }
        else if (name.length > 40) {
            return next(new ErrorHandler_1.ErrorHandler(400, "WorkSpace Name must be less than 40 characters"));
        }
        //for description
        if (!description) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Description is required."));
        }
        else if (description.length > 255) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Description must not be more than 255 characters."));
        }
        //for members
        //new workspace
        const newWorkSpace = new workspace_model_1.default({
            name: validator_1.default.escape(name),
            description: validator_1.default.escape(description),
            creator: req.user._id,
        });
        //new workspace created
        newWorkSpace.members.push({
            memberId: req.user._id,
            role: "ADMIN",
        });
        await newWorkSpace.save();
        return res.status(201).json({
            success: true,
            workspace: {
                _id: newWorkSpace._id,
                name: newWorkSpace.name,
                role: "Admin",
                isFavorite: newWorkSpace.isFavorite,
                boards: [],
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Oops, something went wrong!",
        });
    }
};
exports.createWorkSpace = createWorkSpace;
const getWorkSpaceDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "WorkSpace id is required."));
        }
        const workSpace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        })
            .lean()
            .select("_id name picture members description");
        if (!workSpace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "WorkSpace not found"));
        }
        const favorite = await favorite_model_1.default.findOne({
            resourceId: workSpace._id,
            userId: req.user._id,
            type: "WORKSPACE",
        });
        const role = workSpace.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        res.status(201).json({
            success: true,
            workspace: {
                _id: workSpace._id,
                name: workSpace.name,
                description: workSpace.description,
                myRole: role,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Oops, Something went wrong!",
        });
    }
};
exports.getWorkSpaceDetail = getWorkSpaceDetail;
const getMyWorkSpaces = async (req, res, next) => {
    try {
        const myWorkSpaces = await workspace_model_1.default.find({
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id name");
        if (!myWorkSpaces) {
            return res.status(201).json({ success: true, message: "No workspaces" });
        }
        res.status(201).json({
            success: true,
            myWorkSpaces,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Oops, Something went wrong!",
        });
    }
};
exports.getMyWorkSpaces = getMyWorkSpaces;
const getWorkSpaceBoard = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Workspce id is required!"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid WorkSpaceID"));
        }
        const workSpace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        })
            .lean()
            .select("_id members boards")
            .populate({
            path: "boards",
            select: "_id name color members workspaceId visibility createdAt",
        });
        if (!workSpace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "WorkSpace not found!"));
        }
        let boards = [];
        const role = workSpace.members.find((m) => m.memberId.toString() === req.user._id.toString())?.role;
        const myBoards = workSpace.boards.filter((board) => board.members
            .map((m) => m.memberId.toString())
            .includes(req.user._id.toString()));
        const notMyBoards = workSpace.boards.filter((board) => !myBoards
            .map((b) => b._id.toString())
            .includes(board._id.toString()));
        if (role === "ADMIN") {
            const totalBoards = [
                ...(await Promise.all(myBoards.map(async (board) => {
                    const favorite = await favorite_model_1.default.findOne({
                        resourceid: board._id,
                        userId: req.user._id,
                        type: "BOARD",
                    });
                    return {
                        _id: board._id,
                        name: board.name,
                        color: board.color,
                        isMember: true,
                        role: board.members.find((m) => m.memberId.toString() === req.user._id.toString()).role,
                        visiblility: board.visibility,
                        workspaceId: board.workspaceId,
                        isFavorite: favorite ? true : false,
                        FavoriteId: favorite && favorite._id,
                        createdAt: board.createdAt,
                    };
                }))),
                ...(await Promise.all(notMyBoards.map(async (board) => {
                    const favorite = await favorite_model_1.default.findOne({
                        resourceId: board._id,
                        userId: req.user._id,
                        type: "BOARD",
                    });
                    return {
                        _id: board._id,
                        name: board.name,
                        isMember: false,
                        visibility: board.visibility,
                        workspaceId: board.workspaceId,
                        isFavorite: favorite ? true : false,
                        favoriteid: favorite && favorite._id,
                        color: board.color,
                        role: "ADMIN",
                        createdAt: board.createdAt,
                    };
                }))),
            ];
            boards = totalBoards;
        }
        else if (role === "NORMAL") {
            const totalBoards = [
                ...(await Promise.all(myBoards.map(async (board) => {
                    const favorite = await favorite_model_1.default.findOne({
                        resourceId: board._id,
                        userid: req.user._id,
                        type: "BOARD",
                    });
                    return {
                        _id: board._id,
                        name: board.name,
                        isMember: true,
                        visibility: board.visiblility,
                        favorite: favorite ? true : false,
                        favoriteId: favorite && favorite._id,
                        color: board.color,
                        createAt: board.createAt,
                        role: board.members.find((m) => m.memberId.toString() === req.user._id.toString()).role,
                    };
                }))),
                ...(await Promise.all(notMyBoards
                    .filter((board) => board.visiblility === "PUBLIC")
                    .map(async (board) => {
                    const favorite = await favorite_model_1.default.findOne({
                        resourceId: board._id,
                        userId: req.user._id,
                        type: "BOARD",
                    });
                    return {
                        _id: board._id,
                        name: board.name,
                        isMember: false,
                        visibility: board.visibility,
                        color: board.color,
                        isFavorite: favorite ? true : false,
                        favoriteId: favorite && favorite._id,
                        role: "NORMAL",
                        createdAt: board.createdAt,
                    };
                }))),
            ];
            boards = totalBoards;
        }
        res.status(201).json({
            success: true,
            boards,
        });
    }
    catch (error) {
        res.status(500).send({
            success: false,
            message: "OOps , something went wrong.",
        });
    }
};
exports.getWorkSpaceBoard = getWorkSpaceBoard;
const getAllWorkSpaceMembers = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "WorkspaceId is required!"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid WorkspaceId"));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        })
            .select("_id name members")
            .populate({
            path: "members",
            populate: {
                path: "memberId",
                select: "_id username avatar",
            },
        });
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "WorkSpace not found"));
        }
        const role = workspace.members.find((m) => m.memberId._id.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN" && role !== "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(403, "Your don't permission."));
        }
        const arrangedMember = workspace.members.sort(function (a, b) {
            return b.createdAt === a.createdAt
                ? 0
                : b.createdAt < a.createdAt
                    ? 1
                    : -1;
        });
        const FULL_BASE_PATH = process.env.FULL_BASE_PATH;
        const STATIC_PATH = process.env.STATIC_PATH || "/static";
        const PUBLIC_DIR_NAME = process.env.PUBLIC_DIR_NAME || 'public';
        const Admins = workspace.members.filter((member) => member.role === "ADMIN");
        const finalMembersList = [
            ...arrangedMember.filter((m) => m.role === "ADMIN"),
            ...arrangedMember.filter((m) => m.role === "NORMAL"),
        ].map((mem) => {
            return {
                _id: mem.memberId._id,
                username: mem.memberId.username,
                avatar: mem.memberId.avatar &&
                    (mem.memberId.avatar.match(new RegExp("http"))
                        ? mem.memberId.avatar
                        : FULL_BASE_PATH +
                            path_1.default.join(STATIC_PATH, PUBLIC_DIR_NAME, mem.memberId.avatar)),
                role: mem.role,
                isOnlyAdmin: mem.role === "ADMIN" && Admins?.length === 1 ? true : false,
            };
        });
        res.status(200).json({
            success: false,
            members: finalMembersList,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.getAllWorkSpaceMembers = getAllWorkSpaceMembers;
const addWorkSpaceMembers = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid WorkSpaceId"));
        }
        if (!memberIds) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is required"));
        }
        else if (memberIds.length === 0) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberIds must be at least one."));
        }
        else if (!Array.isArray(memberIds)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberIds must be an array"));
        }
        else if (memberIds.find((memberId) => !mongoose_1.default.isValidObjectId(memberId))) {
            return next(new ErrorHandler_1.ErrorHandler(400, " All memberIds must be valid. "));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members inviteMember");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (workspace.inviteMember === "Admin" && role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "You don't have permission bro!"));
        }
        // remove the duplicate memberId
        //and current user's Id if exist
        // and empty values
        let uniqueIds = [...new Set(memberIds)].filter((member) => member && member.toString() !== req.user._id.toString());
        if (uniqueIds.length === 0) {
            return next(new ErrorHandler_1.ErrorHandler(400, "There are no unique Ids."));
        }
        //check if member already exists
        uniqueIds = uniqueIds.filter((memberId) => !workspace.members
            .map((m) => m.memberId.toString())
            .includes(memberId));
        let validMembers = await user_model_1.default.find({
            _id: { $in: uniqueIds },
            emailVerified: true,
        })
            .select("_id")
            .lean();
        validMembers = validMembers.map((member) => member._id.toString());
        if (validMembers.length > 0) {
            validMembers.forEach((member) => {
                workspace.members.push({
                    memberId: member._id,
                    role: "NORMAL",
                });
            });
        }
        await workspace.save();
        return res
            .status(200)
            .json({ success: true, message: "Member added succesfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Oops something went wrong!" });
    }
};
exports.addWorkSpaceMembers = addWorkSpaceMembers;
const addWorkSpaceMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        //validation
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid WorkSpaceId"));
        }
        if (!memberIds) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is required"));
        }
        else if (memberIds.length === 0) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberIds must be at least one."));
        }
        else if (!Array.isArray(memberIds)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberIds must be an array"));
        }
        else if (memberIds.find((memberId) => !mongoose_1.default.isValidObjectId(memberId))) {
            return next(new ErrorHandler_1.ErrorHandler(400, " All memberIds must be valid. "));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members inviteMember");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (workspace.inviteMember === "Admin" && role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "You don't have permission bro!"));
        }
        // remove the duplicate memberId
        //and current user's Id if exist
        // and empty values
        let uniqueIds = [...new Set(memberIds)].filter((member) => member && member.toString() !== req.user._id.toString());
        if (uniqueIds.length === 0) {
            return next(new ErrorHandler_1.ErrorHandler(400, "There are no unique Ids."));
        }
        //check if member already exists
        uniqueIds = uniqueIds.filter((memberId) => !workspace.members.map((m) => m.memberId.toString().includes(memberId.toString())));
        let validMembers = await user_model_1.default.find({
            _id: { $in: uniqueIds },
            emailVerified: true,
        })
            .select("_id")
            .lean();
        validMembers = validMembers.map((member) => member._id.toString());
        if (validMembers.length > 0) {
            validMembers.forEach((member) => {
                workspace.members.push({
                    memberId: member._id,
                    role: "NORMAL",
                });
            });
        }
        await workspace.save();
        return res
            .status(200)
            .json({ success: true, message: "Member added succesfully" });
    }
    catch (err) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.addWorkSpaceMember = addWorkSpaceMember;
const updateMemberRole = async (req, res, next) => {
    try {
        const { id, memberId } = req.params;
        const { newRole } = req.body;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid WorkSpaceId"));
        }
        if (!memberId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid MemberId"));
        }
        if (!newRole) {
            return next(new ErrorHandler_1.ErrorHandler(400, "newRole is required"));
        }
        else if (!["ADMIN", "NORMAL"].includes(newRole)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "A member cannot have other roles"));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "You don't have permission bro!"));
        }
        //check if memeber is valid
        const memberToBePromoted = workspace.members.find((member) => member.memberId.toString() === memberId);
        if (!memberToBePromoted) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Member doesnot exist"));
        }
        //check if you are trying to change your role and you are the only admin
        if (memberToBePromoted.memberId.toString() === req.user._id.toString() &&
            workspace.members.filter((member) => member.role === "ADMIN")
                .length === 1 &&
            newRole !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(400, "A workspace must have at least one admin"));
        }
        workspace.members = workspace.members.map((member) => {
            if (member.memberId.toString() === memberToBePromoted.memberId.toString()) {
                member.role = validator_1.default.escape(newRole);
                return member;
            }
            return member;
        });
        await workspace.save();
        return res
            .status(200)
            .json({ success: true, message: "Member role updated successfully" });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: "Member updated successfuly" });
    }
};
exports.updateMemberRole = updateMemberRole;
const deleteMember = async (req, res, next) => {
    try {
        const { id, memberId } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Workspaceid is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is not valid"));
        }
        if (!memberId) {
            return next(new ErrorHandler_1.ErrorHandler(400, "memberId is requried"));
        }
        else if (!mongoose_1.default.isValidObjectId(memberId)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid memberId"));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members boards");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "you don't have permission to remove members."));
        }
        const memberToBeDeleted = workspace.members.find((member) => member.memberId.toString() === memberId);
        if (!memberToBeDeleted) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Member doesnot exist"));
        }
        //if member you want to delete is you , return error
        if (memberToBeDeleted.memberId.toString() === req.user._id.toString()) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Can't delete youself."));
        }
        //get all the board in workspace in which memberToBe Deleted is member.
        const boards = await board_model_1.default.find({
            _id: { $in: workspace.boards },
            members: {
                $elemMatch: {
                    memberId: memberToBeDeleted.memberId,
                },
            },
        }).select("_id members lists");
        //loop over every board the memberToBeDeleted is part of
        for (const board of boards) {
            //find admin of every board
            const adminMember = board.members.filter((member) => member.role === "ADMIN");
            //if memberToBeDeleted is only admin of the board, make the workspace admin who is deleting new board admin.
            if (adminMember.length === 1 &&
                adminMember[0].memberId.toString() ===
                    memberToBeDeleted.memberId.toString()) {
                board.members = board.members.map((member) => {
                    if (member.memberId.toString() === memberToBeDeleted.memberId.toString()) {
                        return {
                            memberId: req.user._id,
                            role: "ADMIN",
                        };
                    }
                    return member;
                });
                await board.save();
            }
            else {
                board.members = board.members.filter((member) => {
                    member.memberId.toString() !== memberToBeDeleted.memberId.toString();
                });
                await board.save();
            }
            //delete memberToBeDeleted from all cards
            await cards_model_1.default.updateMany({ listId: { $in: board.lists } }, { $pull: { members: memberToBeDeleted.memberId } });
        }
        //delete memberToBeDeleted from workspace
        workspace.members = workspace.members.filter((member) => member.memberId.toString() !== memberToBeDeleted.memberId.toString());
        await workspace.save();
        res
            .status(200)
            .json({ success: true, message: "member deleted successfully" });
    }
    catch (err) {
        res
            .status(500)
            .json({ success: false, message: "Oops somethig went wrong" });
    }
};
exports.deleteMember = deleteMember;
const leaveWorkSpace = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Workspaceid is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceid is not valid"));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members boards");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN" && role !== "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(403, "Please leave the board manually."));
        }
        const workspaceAdmins = workspace.members.filter((member) => member.role === "ADMIN");
        if (workspaceAdmins.length === 1 &&
            workspaceAdmins[0].memberId.toString() === req.user._id.toString()) {
            return next(new ErrorHandler_1.ErrorHandler(403, "you don't have permission to leave"));
        }
        const boards = await board_model_1.default.find({
            _id: { $in: workspace.boards },
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id members");
        if (boards.length > 0) {
            workspace.members = workspace.members.map((member) => {
                if (member.memberId.toString() === req.user._id.toString()) {
                    member.role = "GUEST";
                    return member;
                }
                return member;
            });
        }
        await workspace.save();
        res
            .status(200)
            .json({ success: true, message: "leaved the workspace successfully" });
    }
    catch (err) {
        res
            .status(500)
            .json({ success: false, message: "Oops! something went wrong!" });
    }
};
exports.leaveWorkSpace = leaveWorkSpace;
const getWorkSpaceSettings = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "WorkspaceId is requred."));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid workspaceId"));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        })
            .lean()
            .select("_id name description picture members visibility createBoard inviteMember");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "WorkSpace not found!"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN" && role !== "NORMAL") {
            return next(new ErrorHandler_1.ErrorHandler(403, "Permission not granted."));
        }
        res.status(200).json({
            success: true,
            workspace: workspace,
        });
    }
    catch (err) {
        res.status(500).send({
            success: false,
            message: "Oops, somethng went wrong!",
        });
    }
};
exports.getWorkSpaceSettings = getWorkSpaceSettings;
const updateWorkSpaceSettings = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, visibility, createBoard, inviteMember } = req.body;
        const picture = req.file;
        //validation
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid workspaceId"));
        }
        // if(!Object.keys(req.body).includes("name") && !Object.keys(req.body).includes("description") && !picture){
        //     return next(new ErrorHandler(400, "At least one field is required"))
        // }
        if (name && name.length > 50) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Workspace name must be less then or equal to 50."));
        }
        if (description && description.length > 255) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Character length for description exceeded."));
        }
        if (visibility && !["PUBLIC", "PRIVATE"].includes(visibility)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "visibility should be either public or private"));
        }
        if (createBoard && !["Admin", "AnyOne"].includes(createBoard)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "createBoard should be either Admin or AnyOne"));
        }
        if (inviteMember && !["Admin", "AnyOne"].includes(inviteMember)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "inviteMember should be either Admin or AnyOne."));
        }
        const workspace = await workspace_model_1.default.findOne({
            _id: id,
            members: {
                $elemMatch: {
                    memberId: req.user._id,
                },
            },
        }).select("_id name description members visibility createBoard inviteMember");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        const role = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString())?.role;
        if (role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "You don't have permission to change settings"));
        }
        //update information manually
        if (Object.keys(req.body).includes("name")) {
            workspace.name = validator_1.default.escape(name);
        }
        if (Object.keys(req.body).includes("description")) {
            workspace.description = validator_1.default.escape(description);
        }
        // if(picture){
        //    if(workspace.picture){
        //      await removePicture(path.join(process.env.PUBLIC_DIR_NAME!, process.env.WORKSPACE_PICTURE_DIR_NAME!, workspace.picture))
        //    }
        //    const fileName = await savePicture()
        //    workspace.picture = fileName;
        // }
        if (Object.keys(req.body).includes("visibility")) {
            workspace.visibility = validator_1.default.escape(visibility);
        }
        if (Object.keys(req.body).includes("createBoard")) {
            workspace.createBoard = validator_1.default.escape(createBoard);
        }
        if (Object.keys(req.body).includes("inviteMember")) {
            workspace.inviteMember = validator_1.default.escape(inviteMember);
        }
        await workspace.save();
        return res.status(200).json({ success: true, workspace: workspace });
    }
    catch (err) {
        res
            .status(500)
            .json({ success: false, message: "Oops, something went wrong!" });
    }
};
exports.updateWorkSpaceSettings = updateWorkSpaceSettings;
const deleteWorkSpace = async (req, res, next) => {
    try {
        const { id } = req.params;
        // validate workspace id
        if (!id) {
            return next(new ErrorHandler_1.ErrorHandler(400, "workspaceId is required"));
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            return next(new ErrorHandler_1.ErrorHandler(400, "Invalid workspaceId"));
        }
        const workspace = await workspace_model_1.default.findOne({ _id: id }).select("_id members boards picture");
        if (!workspace) {
            return next(new ErrorHandler_1.ErrorHandler(404, "Workspace not found"));
        }
        //check if the user is the admin of the workspace or not
        const workspaceMember = workspace.members.find((member) => member.memberId.toString() === req.user._id.toString());
        if (!workspaceMember) {
            return next(new ErrorHandler_1.ErrorHandler(404, "User is not a member of workspace"));
        }
        if (workspaceMember.role !== "ADMIN") {
            return next(new ErrorHandler_1.ErrorHandler(403, "User don't have a permission to delete this workspace."));
        }
        //delete all the boards, list , cards connected to workspace
        //Get all the listId and CardsId associated with boards in the workspace
        const lists = await list_model_1.default.find({
            boardId: { $in: workspace.boards },
        }).select("_id");
        const cards = await cards_model_1.default.find({ listId: { $in: lists } }).select("_id");
        //delete all the resources associated with the workspace
        await workspace_model_1.default.deleteOne({ _id: id });
        await board_model_1.default.deleteMany({ _id: { $in: workspace.boards } });
        await list_model_1.default.deleteMany({ _id: { $in: lists } });
        await cards_model_1.default.deleteMany({ _id: { $in: cards } });
        await Label_model_1.default.deleteMany({ boardId: { $in: workspace.boards } });
        await Comments_model_1.default.deleteMany({ cardId: { $in: cards } });
        await recentBoards_model_1.default.deleteMany({
            boardId: { $in: workspace.boards },
            userId: req.user._id,
        });
        await favorite_model_1.default.deleteOne({ favoriteId: workspace._id, type: "WORKSPACE" });
        await favorite_model_1.default.deleteMany({
            favoriteId: { $in: workspace.boards },
            type: "BOARD",
        });
        //delete the icon picture of the workspace
        if (workspace.picture) {
        }
        return res.status(200).send({
            success: true,
            message: "WorkSpace deleted successfully",
        });
    }
    catch (err) {
        res.status(500).send({
            success: false,
            message: "Oops, something went wrong!",
        });
    }
};
exports.deleteWorkSpace = deleteWorkSpace;

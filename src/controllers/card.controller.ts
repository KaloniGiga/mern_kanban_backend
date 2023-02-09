import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ErrorHandler } from "../utils/ErrorHandler";
import validator from "validator";
import List from "../models/list.model";
import Board from "../models/board.model";
import Card from "../models/cards.model.";
import User from "../models/user.model";
import { execFile } from "child_process";
import Comment from "../models/Comments.model";
import { Lexorank } from "../utils/lexorank";
import { CardInNewPositionType } from "../types/types";

export const createCard = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      listId,
      name,
      description,
      position,
      coverImage,
      color,
      expireDate,
    } = req.body;

    if (!listId) {
      return next(new ErrorHandler(400, "listId is required"));
    } else if (!mongoose.isValidObjectId(listId)) {
      return next(new ErrorHandler(400, "listId is not valid"));
    }

    if (!name) {
      return next(new ErrorHandler(400, "Name of a card is required"));
    } else if (name.length > 50) {
      return next(
        new ErrorHandler(400, "Card name must be less than 50 chars")
      );
    }

    if (!description) {
      return next(new ErrorHandler(400, "Description is required"));
    } else if (description.length > 500 || description.length < 5) {
      return next(
        new ErrorHandler(
          400,
          "Description is must be greater than 5 and less than 500 characters."
        )
      );
    }
    if (!position) {
      return next(new ErrorHandler(400, "Position is required"));
    } else if (!validator.isAscii(position)) {
      return next(new ErrorHandler(400, "position must be a ascii"));
    }

    if (coverImage && !validator.isURL(coverImage)) {
      return next(new ErrorHandler(400, "Image URL is invalid"));
    }

    if (color && (color[0] !== "#" || color.length !== 7)) {
      return next(new ErrorHandler(400, "Color code must be in hex form"));
    }

    if (!expireDate) {
      return next(new ErrorHandler(400, "Expire Date is required"));
    } else if (!validator.isDate(expireDate)) {
      return next(new ErrorHandler(400, "Expire Date is Invalid"));
    } else if (expireDate < new Date(Date.now())) {
      return next(
        new ErrorHandler(
          400,
          "Expire Date must be greater than the current date"
        )
      );
    }

    const list = await List.findOne({ _id: listId })
      .select("_id boardId cards")
      .populate({
        path: "cards",
        select: "_id pos",
        options: {
          sort: position,
        },
      });

    if (!list) {
      return next(new ErrorHandler(404, "List not found"));
    }

    const board = await Board.findOne({ _id: list.boardId })
      .select("_id workspaceId members visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    //check the role of the user in both board and workspace
    const boardMemberRole = board?.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board?.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "You can't create a list"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "First join the board"));
    }

    if (boardMemberRole !== "ADMIN") {
      return next(
        new ErrorHandler(400, "Don't have a permission to create a list")
      );
    }

    let lastPosition = position;

    const positionTaken = list.cards.find((card: any) => {
      card.position === position;
    });

    if (positionTaken) {
      let maxpos = 0;
      list.cards.forEach((card: any) => {
        if (card.position > maxpos) {
          maxpos = card.position;
        }

        lastPosition = maxpos;
      });
    }

    const card = new Card({
      name: validator.escape(name),
      description: validator.escape(description),
      listId: list._id,
      position: lastPosition,
      expireDate: expireDate,
      creator: req.user._id,
    });

    list.cards.push(card._id);

    if (coverImage) {
      card.coverImage = coverImage;
    }

    if (color) {
      card.color = color;
    }

    await card.save();
    await list.save();

    res.status(200).json({
      success: true,
      data: {
        card,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: true, message: "Oops! Something went wrong" });
  }
};

export const getAllMyCards = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return next(new ErrorHandler(400, "userId is required"));
    } else if (!mongoose.isValidObjectId(userId)) {
      return next(new ErrorHandler(400, "Invalid userId"));
    }

    const myCards = await Card.find({
      members: { $elemMatch: { memberId: req.user._id } },
    })
      .populate({
        path: "listId",
        select: "boardId",
        populate: {
          path: "boardId",
          select: "_id workspaceId",
        },
      })
      .populate({
        path: "members",
        select: "_id username picture",
      })
      .populate({
        path: "labels",
        select: "_id name color position",
      });

    res.status(200).json({
      success: true,
      cards: myCards.map((card: any) => {
        return {
          _id: card._id,
          name: card._id,
          description: card._id,
          color: card.color,
          boardId: card.listId.boardId._id,
          workspaceId: card.listId.boardId.workspaceId,
          expireDate: card.expireDate,
          isComplete: card.isComplete,
          listId: card.listId._id,
          position: card.position,
          comments: card.comments.length,
          members: card.members,
        };
      }),
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops! Something went wrong!" });
  }
};

export const getACard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.params;

    //validate
    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId) {
      return next(new ErrorHandler(400, "cardId is invalid"));
    }

    const card = await Card.findOne({ _id: cardId })
      .select(
        "_id name listId position coverImage color description expireDate members labels comments isComplete"
      )
      .populate({
        path: "labels",
        select: "_id name color position",
      })
      .populate({
        path: "members",
        select: "_id username avatar",
      })
      .populate({
        path: "comments",
        select: "_id comment user createdAt updatedAt ",
        populate: {
          path: "user",
          select: "_id username avatar",
        },
        options: {
          sort: { createdAt: -1 },
        },
      });

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    const boardMemberrole = board?.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board?.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;
    //check if the user is the boardAdmin or the workspaceAdmin

    if (!boardMemberrole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberrole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    let cardRole = "";
    if (board.visibility === "PUBLIC") {
      if (boardMemberrole === "ADMIN" || workspaceMemberRole === "ADMIN") {
        cardRole = "ADMIN";
      } else {
        cardRole = "NORMAL";
      }
    } else {
      if (boardMemberrole === "ADMIN" || workspaceMemberRole === "ADMIN") {
        cardRole = "ADMIN";
      } else if (boardMemberrole === "NORMAL") {
        cardRole = "NORMAL";
      }
    }

    //Now that the person is boardadmin boardmember or workspace admin

    res.status(200).json({
      success: true,
      card: {
        _id: card._id,
        listId: card.listId,
        description: card.description,
        position: card.position,
        role: cardRole,
        coverImage: card.coverImage,
        color: card.color,
        name: card.name,
        expireDate: card.expireDate,
        isComplete: card.isComplete,
        members: card.members,
        labels: card.labels,
        comments: card.comments,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops! Something went wrong!" });
  }
};

export const moveCard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.params;

    const { newPos, destListId, direction } = req.body;

    let finalPosition: string;
    let refetch: boolean = false;

    if (!cardId) {
      return next(new ErrorHandler(400, "cardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    if (!destListId) {
      return next(new ErrorHandler(400, "destination List Id is required"));
    } else if (!mongoose.isValidObjectId(destListId)) {
      return next(new ErrorHandler(400, "Invalid destination List Id"));
    }

    if (!newPos) {
      return next(new ErrorHandler(400, "newPos is required"));
    } else if (!validator.isAscii(newPos)) {
      return next(new ErrorHandler(400, "Invalid value for newPos"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id name listId position"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const sourceList = await List.findOne({ _id: card.listId })
      .select("_id boardId cards")
      .populate({
        path: "cards",
        select: "_id position",
        options: {
          sort: "position",
        },
      });

    if (!sourceList) {
    }

    const board = await Board.findOne({ _id: sourceList?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    const boardMemberrole = board?.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board?.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;
    //check if the user is the boardAdmin or the workspaceAdmin

    if (!boardMemberrole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberrole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    const destinationList = await List.findOne({ _id: destListId })
      .select("_id boardId cards")
      .populate({
        path: "cards",
        select: "_id position",
        options: {
          sort: "position",
        },
      });

    if (!destinationList) {
      return next(new ErrorHandler(404, "Destination List not found"));
    } else if (
      sourceList?.boardId.toString() !== destinationList.boardId.toString()
    ) {
      return next(
        new ErrorHandler(
          400,
          "destnation List is in different board thean sourceList"
        )
      );
    }

    if (sourceList._id.toString() === destinationList._id.toString()) {
      if (!direction) {
        return next(new ErrorHandler(400, "direction is required"));
      } else if (!["UP", "DOWN"].includes(direction)) {
        return next(
          new ErrorHandler(400, "card can be dragged up or down on same list.")
        );
      }
    }

    finalPosition = newPos;

    if (sourceList._id.toString() === destinationList._id.toString()) {
      const cardInNewPosition: any = sourceList.cards.find(
        (card: any) => card.position === newPos
      );

      if (cardInNewPosition.position) {
        refetch = true;
      }

      if (
        cardInNewPosition &&
        cardInNewPosition._id.toString() !== card._id.toString()
      ) {
        const lexorank = new Lexorank();

        const indexOfCardInNewPos = sourceList.cards.findIndex(
          (card: any) => card.position === newPos
        );

        const topCard: any = sourceList.cards[indexOfCardInNewPos - 1];
        const bottomCard: any = sourceList.cards[indexOfCardInNewPos + 1];

        if (direction === "UP") {
          if (!topCard) {
            const [pos] = lexorank.insert("0", cardInNewPosition.position);

            finalPosition = pos;
          } else {
            const [pos] = lexorank.insert(
              topCard.position,
              cardInNewPosition.position
            );

            finalPosition = pos;
          }
        } else {
          if (!bottomCard) {
            const [pos] = lexorank.insert(cardInNewPosition.position, "");

            finalPosition = pos;
          } else {
            const [pos] = lexorank.insert(
              cardInNewPosition.position,
              bottomCard.position
            );

            finalPosition = pos;
          }
        }
      }
    } else {
      //if list is different
      const cardInNewPosition: any = destinationList.cards.find(
        (card: any) => card.position === newPos
      );

      if (cardInNewPosition) {
        refetch = true;
      }

      if (
        cardInNewPosition &&
        cardInNewPosition._id.toString() !== card._id.toString()
      ) {
        const lexorank = new Lexorank();

        const indexOfCardInNewPos = destinationList.cards.findIndex(
          (card: any) => card.position === newPos
        );

        const topCard: any = destinationList.cards[indexOfCardInNewPos - 1];
        const bottomCard: any = destinationList.cards[indexOfCardInNewPos + 1];

        if (destinationList.cards.length === 1) {
          const [pos] = lexorank.insert("0", cardInNewPosition.position);

          finalPosition = pos;
        } else {
          //if more cards are present

          if (indexOfCardInNewPos === 0) {
            const [pos] = lexorank.insert("0", cardInNewPosition.position);

            finalPosition = pos;
          } else if (indexOfCardInNewPos === destinationList.cards.length - 1) {
            const [pos] = lexorank.insert(cardInNewPosition.position, "");

            finalPosition = pos;
          } else {
            const [pos] = lexorank.insert(
              topCard.position,
              cardInNewPosition.position
            );

            finalPosition = pos;
          }
        }
      }

      card.position = finalPosition;

      if (sourceList._id.toString() !== destinationList._id.toString()) {
        sourceList.cards = sourceList.cards.filter(
          (c: any) => c._id.toString() !== card._id.toString()
        );

        destinationList.cards.push(card._id);

        card.listId = destinationList._id;
      }
    }

    await sourceList.save();
    await destinationList.save();
    await card.save();

    res.status(200).json({
      success: true,
      newCard: {
        _id: card._id,
        name: card.name,
        position: card.position,
        refetch: refetch,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: "Oops, something went wrong",
    });
  }
};

export const getAllMembers = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id description listId"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    if (!list) {
      return next(new ErrorHandler(404, "List not found."));
    }

    const board = await Board.findOne({ _id: list.boardId })
      .select("_id lists workspaceId members visibility")
      .populate({
        path: "members",
        populate: {
          path: "memberId",
          select: "_id username avatar",
        },
      })
      .populate({
        path: "workspaceId",
        select: "_id visibility members",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) =>
        member.memberId._id.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    res.status(201).json({
      success: true,
      AllMembers: board.members.map((member: any) => {
        return {
          _id: member.memberId._id,
          username: member.memberId.username,
          avatar: member.memberId.avatar,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops! Something went wrong.",
    });
  }
};

export const addMember = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { memberId } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "cardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "cardId is invalid"));
    }

    if (!memberId) {
      return next(new ErrorHandler(400, "memberId is required"));
    } else if (!mongoose.isValidObjectId(memberId)) {
      return next(new ErrorHandler(400, "memberId is invalid"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id listId members"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id name visibility workspaceId members")
      .populate({
        path: "workspaceId",
        select: "_id members",
      });

    const boardMemberrole = board?.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board?.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;
    //check if the user is the boardAdmin or the workspaceAdmin

    if (!boardMemberrole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberrole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    //now check if memberId is a member of workspace or a board
    if (
      !board?.members
        .map((member: any) => member.memberId.toString())
        .includes(memberId) &&
      !board?.workspaceId.members
        .map((member: any) => member.memberId.toString())
        .includes(memberId)
    ) {
      return next(
        new ErrorHandler(400, "This member cannot be added to the board")
      );
    }

    if (
      card.members
        .map((member: any) => member.memberId.toString())
        .includes(memberId)
    ) {
      return next(new ErrorHandler(400, "Already a member of a card"));
    }

    card.members.push(memberId);
    await card.save();

    const newCardMember = await User.findOne({ _id: memberId })
      .select("_id username avatar")
      .lean();

    return res.status(200).json({
      success: true,
      newAddedMember: newCardMember,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Oops! Something went wrong!",
    });
  }
};

export const removeCardMember = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { memberId } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "cardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "cardId is invalid"));
    }

    if (!memberId) {
      return next(new ErrorHandler(400, "memberId is required"));
    } else if (!mongoose.isValidObjectId(memberId)) {
      return next(new ErrorHandler(400, "memberId is invalid"));
    }

    const card = await Card.findOne({ _id: cardId }).select("_id listId members");

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

 

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id name visibility workspaceId members")
      .populate({
        path: "workspaceId",
        select: "_id members",
      });

     if(!board){
       return next(new ErrorHandler(404, "board not found"))
     }


    const boardMemberrole = board.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;
    //check if the user is the boardAdmin or the workspaceAdmin

    if (!boardMemberrole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberrole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberrole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    //check if memberId is a card member or not
    if (
      !card.members
        .map((member: any) => member._id.toString())
        .includes(memberId)
    ) {
      return next(new ErrorHandler(400, "MemberId is not a member of card"));
    }

    //remove memberId from card members
    card.members = card.members.filter(
      (member: any) => member._id.toString() !== memberId.toString()
    );

    await card.save();

    res
      .status(200)
      .json({ success: true, message: "Member removed from card" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const updateACardName = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { name } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    if (!name) {
      return next(new ErrorHandler(400, "Card name is required"));
    } else if (name.length > 50) {
      return next(
        new ErrorHandler(
          400,
          "Card Name should be less than or equal to 50 characters"
        )
      );
    }

    const card = await Card.findOne({ _id: cardId }).select("_id name listId");

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id lists workspaceId members visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    card.name = validator.escape(name);

    await card.save();

    res.status(201).json({
      success: true,
      message: "Card name updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops, Something went wrong!",
    });
  }
};

export const updateACardDescription = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { description } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    if (!description) {
      return next(new ErrorHandler(400, "Card Description is required"));
    } else if (description.length > 255) {
      return next(
        new ErrorHandler(
          400,
          "Card Description should be less than or equal to 255 characters"
        )
      );
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id description listId"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id lists workspaceId members visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    card.description = validator.escape(description);

    await card.save();

    res.status(201).json({
      success: true,
      message: "Card description updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops, Something went wrong!",
    });
  }
};

//update the expire Date

export const updateExpireDate = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { expireDate } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    if (!expireDate) {
      return next(new ErrorHandler(400, "Expire Date is required"));
    } else if (!validator.isDate(expireDate)) {
      return next(new ErrorHandler(400, "Expire Date is Invalid"));
    } else if (expireDate < new Date(Date.now())) {
      return next(
        new ErrorHandler(
          400,
          "Expire Date must be greater than the current date"
        )
      );
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id description listId"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id lists workspaceId members visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    card.expireDate = expireDate;

    await card.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Card Expire Date updated successfully.",
      });
  } catch (error) {}
};

export const updateCardIsComplete = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id description listId isComplete"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id lists workspaceId members visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    card.isComplete = card.isComplete ? false : true;

    await card.save();

    res.status(201).json({ success: true, isComplete: card.isComplete });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops! Something went wrong." });
  }
};

export const getCardLabels = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is invalid!"));
    }

    const card = await Card.findOne({ _id: cardId })
      .select("_id listId labels")
      .lean();

    if (!card) {
      return next(new ErrorHandler(404, "Card not found."));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members labels visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .populate({
        path: "labels",
        select: "_id name color",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    res.status(201).json({
      success: true,
      labels: board.labels.map((label: any) => {
        return {
          ...label,
          isCardLabel: card.labels
            .map((label: any) => label._id.toString())
            .includes(label._id.toString()),
        };
      }),
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: true, message: "Oops, something went wrong!" });
  }
};

export const addCardLabel = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    const { labelId } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is invalid!"));
    }

    if (!labelId) {
      return next(new ErrorHandler(400, "labelId is required"));
    } else if (!mongoose.isValidObjectId(labelId)) {
      return next(new ErrorHandler(400, "labelId is valid"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id listId labels"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found."));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members labels visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .populate({
        path: "labels",
        select: "_id name color",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    if (
      !board.labels.map((label: any) => label._id.toString()).includes(labelId)
    ) {
      return next(new ErrorHandler(400, "LabelId does not exist"));
    }

    if (card.labels.map((label: any) => label.toString()).includes(labelId)) {
      return next(new ErrorHandler(400, "Label already added to card"));
    }

    card.labels.push(labelId);

    await card.save();

    res.status(200).json({
      success: true,
      label: board.labels.find(
        (label: any) => label._id.toString() === labelId
      ),
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Oops something went wrong!" });
  }
};

export const removeCardLabel = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    const { labelId } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is invalid!"));
    }

    if (!labelId) {
      return next(new ErrorHandler(400, "labelId is required"));
    } else if (!mongoose.isValidObjectId(labelId)) {
      return next(new ErrorHandler(400, "labelId is valid"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id listId labels"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found."));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members labels visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .populate({
        path: "labels",
        select: "_id name color",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    if (
      !board.labels.map((label: any) => label._id.toString()).includes(labelId)
    ) {
      return next(new ErrorHandler(400, "LabelId does not exist"));
    }

    if (!card.labels.map((label: any) => label.toString()).includes(labelId)) {
      return next(new ErrorHandler(400, "Label already removed from card"));
    }

    card.labels = card.labels.filter(
      (label: any) => label.toString() !== labelId
    );

    await card.save();

    res.status(200).json({
      success: true,
      message: "Card label removed",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Oops, something went wrong!",
    });
  }
};

export const createCardComment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { comment } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "Invalid cardId"));
    }

    if (!comment) {
      return next(new ErrorHandler(400, "Comment is required."));
    }else if(comment.length > 500){
       return next(new ErrorHandler(400, "Camment must have less than 500 chars."))
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id listId comments"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      });

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    const newComment = new Comment({
      comment: validator.escape(comment),
      user: req.user._id,
      cardId: card._id,
     
    });

    card.comments.push(newComment._id);

    await newComment.save();
    await card.save();

    res.status(201).send({
      success: true,
      comment: {
        _id: newComment._id,
        comment: newComment.comment,
        isUpdated: newComment.isUpdated,
        createdAt: new Date(Date.now()),
        user: {
          _id: newComment.user._id,
          username: req.user.username,
          avatar: req.user.avatar,
          isAdmin:
            board.members.find(
              (member: any) =>
                member.memberId.toString() === req.user._id.toString() &&
                member.role === "ADMIN"
            ) ||
            board.workspaceId.members.find(
              (member: any) =>
                member.memberId.toString() === req.user._id.toString() &&
                member.role === "ADMIN"
            )
              ? true
              : false,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oops, something went wrong!",
    });
  }
};

export const updateComment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    const { commentId, comment } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required."));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is invalid."));
    }

    if (!comment) {
      return next(new ErrorHandler(400, "Comment is required."));
    }

    if (!commentId) {
      return next(new ErrorHandler(400, "CommentId is required."));
    } else if (!mongoose.isValidObjectId(commentId)) {
      return next(new ErrorHandler(400, "Invalid CommentId"));
    }

    const card = await Card.findOne({ _id: cardId })
      .select("_id listId comments")
      .lean();

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    //you can update that comment if you are authorized and  if you have created it.

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    //check if you have created the comment
    if (
      !card.comments
        .map((comment: any) => comment.toString())
        .includes(commentId)
    ) {
      return next(new ErrorHandler(400, "Comment doesnot exist"));
    }

    const commentToUpdate = await Comment.findOne({ _id: commentId }).select(
      "_id user comment isUpdated"
    );

    if (!commentToUpdate) {
      return next(new ErrorHandler(400, "Comment not found"));
    }

    if (commentToUpdate?.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler(403, "You are not authorized to update the comment")
      );
    }

    //now the comment can be updated
    commentToUpdate.comment = validator.escape(comment);
    commentToUpdate.isUpdated = true;

    await commentToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Comment has been updated successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: "Oops, something went wrong!",
    });
  }
};

export const deleteComment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { commentId } = req.body;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required."));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is invalid."));
    }

    if (!commentId) {
      return next(new ErrorHandler(400, "CommentId is required."));
    } else if (!mongoose.isValidObjectId(commentId)) {
      return next(new ErrorHandler(400, "Invalid CommentId"));
    }

    const card = await Card.findOne({ _id: cardId }).select(
      "_id listId comments"
    );

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId })
      .select("_id boardId")
      .lean();

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    //you can delete that comment if (either you are the creator of the comment or you are the ADMIN and the comment creator is not ADMIN).

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    //check if you have created the comment
    if (
      !card.comments
        .map((comment: any) => comment.toString())
        .includes(commentId)
    ) {
      return next(new ErrorHandler(400, "Comment doesnot exist"));
    }

    const commentToDelete = await Comment.findOne({ _id: commentId }).select(
      "_id user comment isUpdated"
    );

    if (!commentToDelete) {
      return next(new ErrorHandler(400, "Comment not found"));
    }

    // if you created the comment , you can delete it
    if (commentToDelete.user.toString() === req.user._id.toString()) {
      card.comments = card.comments.filter(
        (comment: any) => comment.toString() !== commentToDelete._id.toString()
      );
      await card.save();
      await Comment.deleteOne({ _id: commentToDelete._id });

      return res
        .status(200)
        .json({
          success: true,
          message: "Comment has been deleted successfully",
        });
    }

    //if you are not the creator of the comment, then

    if (boardMemberRole !== "ADMIN") {
      return next(
        new ErrorHandler(403, "You are not authorized to delete the comment")
      );
    }

    //if you are board ADMIN then check if card creator is also an ADMIN or not
    const commentCreatorBoardRole = board.members.find(
      (member: any) =>
        member.memberId.toString() === commentToDelete.user.toString()
    )?.role;

    const commentCreatorWorkSpaceRole = board.workspaceId.members.find(
      (member: any) =>
        member.memberId.toString() === commentToDelete.user.toString()
    )?.role;

    if (commentCreatorBoardRole && commentCreatorBoardRole === "ADMIN") {
      return next(
        new ErrorHandler(403, "you can't delete other admin's comment")
      );
    }

    card.comments = card.comments.filter(
      (comment: any) => comment.toString() !== commentToDelete._id.toString()
    );

    await card.save();
    await Comment.deleteOne({ _id: commentToDelete._id });

    return res
      .status(200)
      .json({
        success: true,
        message: "Comment has been deleted successfully",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: true, message: "Oops, something went wrong!" });
  }
};

export const deleteACard = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return next(new ErrorHandler(400, "CardId is required"));
    } else if (!mongoose.isValidObjectId(cardId)) {
      return next(new ErrorHandler(400, "CardId is not valid"));
    }

    const card = await Card.findOne({ _id: cardId })
      .select("_id listId comments")
      .lean();

    if (!card) {
      return next(new ErrorHandler(404, "Card not found"));
    }

    const list = await List.findOne({ _id: card.listId }).select(
      "_id cards boardId"
    );

    if (!list) {
      return next(new ErrorHandler(400, "list not found"));
    }

    const board = await Board.findOne({ _id: list?.boardId })
      .select("_id workspaceId members lists visibility")
      .populate({
        path: "workspaceId",
        select: "_id name members visibility",
      })
      .lean();

    if (!board) {
      return next(new ErrorHandler(404, "Board not found"));
    }

    //you can update that comment if you are authorized and  if you have created it.

    const boardMemberRole = board.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    const workspaceMemberRole = board.workspaceId.members.find(
      (member: any) => member.memberId.toString() === req.user._id.toString()
    )?.role;

    if (!boardMemberRole && !workspaceMemberRole) {
      return next(new ErrorHandler(400, "board not found"));
    }

    if (
      !boardMemberRole &&
      workspaceMemberRole &&
      board?.visibility === "PRIVATE"
    ) {
      return next(new ErrorHandler(400, "Board not found"));
    }

    if (!boardMemberRole && workspaceMemberRole !== "ADMIN") {
      return next(new ErrorHandler(400, "You can't access the board details"));
    }

    //delelte the card
    list.cards = list.cards.filter(
      (c: any) => c.toString() !== card._id.toString()
    );

    await list.save();

    await Comment.deleteMany({ _id: { $in: card.comments } });

    await Card.deleteOne({ _id: card._id });

    res.status(200).json("Card has been deleted successfully");
  } catch (error) {
    res.status(500).json("Oops, something went wrong!");
  }
};

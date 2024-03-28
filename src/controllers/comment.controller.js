import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

/* CREATE COMMENT - TESTED*/
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const video = await Video.findById(videoId);

  if (!content) {
    throw new ApiErrors(400, "Content is required");
  } else if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiErrors(500, "Unable to add a comment, try again.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

/* READ ALL COMMENTS - TESTED */
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  const commentAggregate = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        [comments, commentAggregate],
        "Comments fetched successfully"
      )
    );
});

/* UPDATE A COMMENT - TESTED */
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const comment = await Comment.findById(commentId);
  const ownerId = comment?.owner.toString();
  const userId = req.user?._id.toString();

  if (!content) {
    throw new ApiErrors(400, "content is required");
  } else if (!comment) {
    throw new ApiErrors(404, "Comment not found");
  } else if (ownerId !== userId) {
    throw new ApiErrors(400, "You are not allowed to edit this comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updateComment) {
    throw new ApiErrors(500, "Unable to edit comment. Try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"));
});

/* DELETE A COMMENT - TESTED*/
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  const commentOwner = comment?.owner.toString();
  const userId = req.user?._id.toString();

  if (!comment) {
    throw new ApiErrors(404, "Comment not found");
  } else if (commentOwner !== userId) {
    throw new ApiErrors(400, "Unauthorized delete request.");
  }

  await Comment.findByIdAndDelete(commentId);

  //   await Like.deleteMany({
  //     comment: commentId,
  //     likedBy: req.user,
  //   });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };

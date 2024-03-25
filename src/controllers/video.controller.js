import mongoose, { Mongoose, isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/cloudinary.fileuplaod.js";

/* PUBLISH VIDEO - TESTED */
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  /* validations: check 4 empty field - preffered way */
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiErrors(400, "All fields are required");
  }

  /* CHECK FOR THUMBNAIL */
  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  /* CHECK FOR THUMBNAIL */
  let videoLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
  }

  /* Upload thumbnail to cloudinary */
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiErrors(400, "Thumbnail is required");
  }
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  if (!videoFile) {
    throw new ApiErrors(400, "Video is required");
  }

  /* create user object-create entry in db */
  const video = await Video.create({
    title,
    description,
    thumbnail: {
      url: thumbnail?.url || "",
      public_id: thumbnail.public_id,
    },
    videoFile: {
      url: videoFile?.url || "",
      public_id: videoFile.public_id,
    },
    owner: req.user?._id,
    isPublished: true,
    views: 0,
    duration: videoFile.duration,
  });

  const newVideoCreated = await Video.findById(video._id);

  /* check for video creation */
  if (!newVideoCreated) {
    throw new ApiErrors(
      500,
      "Something went wrong while creating and entering the video to DB"
    );
  }

  /* return response */
  return res
    .status(201)
    .json(
      new ApiResponse(201, newVideoCreated, "Video Created successfully..!")
    );
});

/* UPDATE TITLE & DESCRIPTION OF PUBLISHED VIDEO - TESTED */
const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  console.log(id);

  if (!isValidObjectId(id)) {
    throw new ApiErrors(400, "Invalid videoId");
  }

  if (!title && !description) {
    throw new ApiErrors(400, "title and description are required");
  }

  const videoId = await Video.findById(id);

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  ).select("-videoFile -thumbnail -duration -views -isPublished -owner");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));
});

/* UPDATE VIDEO THUMBNAIL - TESTED */
const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const videoId = await Video.findById(id);

  const thumbnailLocalPath = req.file?.path;
  const thumbnailToDelete = videoId.thumbnail.public_id;

  if (!thumbnailLocalPath) {
    throw new ApiErrors(400, "Thumbnail file is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail.url) {
    throw new ApiErrors(400, "Error while while uploading thumbnail");
  }

  const updatedThumbnail = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
      },
    },
    { new: true }
  ).select(
    "-videoFile -title -description -duration -views -isPublished -owner"
  );

  if (!updatedThumbnail) {
    throw new ApiErrors(400, "Thumbnail updation failed");
  } else {
    await deleteImageFromCloudinary(thumbnailToDelete);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedThumbnail, "Thumbnail updated successfully")
    );
});

/* DELETE VIDEO - TESTED */
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const videoId = await Video.findById(id);
  const owner = req.user?._id;
  const videoOwner = videoId.owner;
  const thumbnailId = videoId.thumbnail.public_id;
  const videoPublicId = videoId.videoFile.public_id;

  try {
    if (!isValidObjectId(id)) {
      throw new ApiErrors(400, "Invalid videoId");
    }

    if (!videoId) {
      throw new ApiErrors(404, "Not found");
    }

    if (videoOwner.toString() !== owner.toString()) {
      throw new ApiErrors(400, "Unauthorised delete request.");
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId?._id);

    if (!videoDeleted) {
      throw new ApiErrors(401, "Video deletion failed");
    } else {
      console.log(`Video: ${videoId.title} deleted from mongo db`);
    }
  } catch (error) {
    throw new ApiErrors(402, "Unable to delete data from mongoDB", error);
  }

  await deleteImageFromCloudinary(thumbnailId);
  await deleteVideoFromCloudinary(videoPublicId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Video deleted from mongodb and clodinary.")
    );
});

/* GET VIDEO BY ID - TESTED */
const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const videoId = id;

  if (!isValidObjectId(videoId)) {
    throw new ApiErrors(400, "Invalid videoId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              email: 1,
            },
          },
        ],
      },
    },
    {
      $project: { title: 1, description: 1, views: 1, ownerDetails: 1 },
    },
  ]);

  // console.log(video);

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));

  //TODO: get video by id
});

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination
// });

// const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
// });

export {
  publishVideo,
  updateVideo,
  updateVideoThumbnail,
  deleteVideo,
  getVideoById,
};

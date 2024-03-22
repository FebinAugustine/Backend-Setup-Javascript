import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.fileuplaod.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

/* GENERATE ACCESS & REFRESH TOKEN FUNCTION */
const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.createAccessToken();
    const refreshToken = await user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Something went wrong while creating access and refresh tokens"
    );
  }
};

/* REGISTER USER FUNCTION */
const registerUser = asyncHandler(async (req, res) => {
  /*  await res.status(200).json({
    message: "Success from febin",
  });
*/

  /* Get user detail from frontend */
  const { fullName, userName, email, password } = req.body;

  /* validations - first way of one by one checking */
  /*  if (fullName === "") {
    throw new ApiErrors(400, "full name is required");
  }
*/

  /* validations: check 4 empty field - preffered way */
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiErrors(400, "All fields are required");
  }

  /* Check if user already exists - email & username. This will check the db and say whether any user with this matching values exists the return a response */
  const userExist = await User.findOne({ $or: [{ userName }, { email }] });

  if (userExist) {
    throw new ApiErrors(409, "user with email or username exist");
  }
  /* Now check for the images. Get the path multer gave through below method. */
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  /* Now check for avatar */
  if (!avatarLocalPath) {
    throw new ApiErrors(400, "CHeck avatar, avatar is required");
  }

  /* Upload them to cloudinary, avatar */
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "avatar is required");
  }

  /* create user object-create entry in db */
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  /* Check whether user is created by checking the id of the same. If ecreated then return the values except password and refresh token. */
  const newUserCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  /* check for user creation */
  if (!newUserCreated) {
    throw new ApiErrors(
      500,
      "Something went wrong while creating and entering the user to DB"
    );
  }

  /* return response */
  return res
    .status(201)
    .json(
      new ApiResponse(201, newUserCreated, "User registered successfully..!")
    );
});

/* LOGIN USER FUNCTION */
const loginUser = asyncHandler(async (req, res) => {
  /* req.body - data */
  const { userName, email, password } = req.body;

  /* userName or email */
  if (!userName) {
    throw new ApiErrors(400, "username is required");
  }

  /* find the user */
  const user = await User.findOne({ $or: [{ userName }, { email }] });

  /* if found */
  if (!user) {
    throw new ApiErrors(404, "User does not exist..!");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiErrors(401, "Incorrect Password.");
  }

  // generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user Loggedin successfuly"
      )
    );
});

/* LOGOUT USER FUNCTION */
const logoutUser = asyncHandler(async (req, res) => {
  /* Clear cookies */
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Loggedout"));
});

/* ACCESS REFRESH TOKEN ENDPOINT FUNCTION */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiErrors(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiErrors(401, "Refresh token expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateAccessRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed SUccessfuly"
        )
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid Refresh TOKEN");
  }
});

export { loginUser, registerUser, logoutUser, refreshAccessToken };
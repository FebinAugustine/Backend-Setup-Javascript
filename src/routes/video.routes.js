import { Router } from "express";
import {
  deleteVideo,
  getVideoById,
  publishVideo,
  updateVideo,
  updateVideoThumbnail,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);
router.route("/update-video/:id").patch(verifyJWT, updateVideo);
router
  .route("/update-video-thumbnail/:id")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideoThumbnail);

router.route("/delete-video/:id").delete(verifyJWT, deleteVideo);
router.route("/get-video/:id").get(verifyJWT, getVideoById);

/* Secured Routes */

export default router;

import { Router } from "express";
import {
  deleteVideo,
  getAllVideosBasedOnQuery,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
  updateVideoThumbnail,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/publish-video").post(
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
router.route("/update-video/:id").patch(updateVideo);
router
  .route("/update-video-thumbnail/:id")
  .patch(upload.single("thumbnail"), updateVideoThumbnail);

router.route("/delete-video/:id").delete(deleteVideo);
router.route("/get-video/:id").get(getVideoById);
router.route("/is-published/:id").patch(togglePublishStatus);
router.route("/get-videos-query").get(getAllVideosBasedOnQuery);

/* Secured Routes */

export default router;

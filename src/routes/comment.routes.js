import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create-comment/:videoId").post(addComment);
router.route("/read-all-comments/:videoId").get(getVideoComments);
router.route("/update-comment/:commentId").patch(updateComment);
router.route("/delete-comment/:commentId").delete(deleteComment);

/* Secured Routes */

export default router;

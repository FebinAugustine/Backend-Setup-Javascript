import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create-comment/:id").post(addComment);
router.route("/update-comment/:id").patch(updateComment);
router.route("/read-all-comment").get(getVideoComments);
router.route("/delete-comment").delete(deleteComment);

/* Secured Routes */

export default router;

const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addForum,
  addCommentToForum,
  getAllForums,
  getAllCommentsOfAForum,
  getForumById,
  getForumByUserId,
  updateForumById,
  deleteForumById,
} = require("../controller/forum.controller");

const { isAuthorizedUser } = require("../middleware/authValidationJWT");

routes.post("/add-post", isAuthorizedUser, fileUpload(), addForum);
routes.post(
  "/add-comment-to-forum/:postId",
  isAuthorizedUser,
  addCommentToForum
);

routes.get("/get-all-posts", getAllForums);

routes.get("/get-all-comments-of-a-forum/:forumId", getAllCommentsOfAForum);

routes.get("/get-post-by-id/:id", getForumById);

routes.get("/get-post-by-user-id/:id", isAuthorizedUser, getForumByUserId);

routes.put(
  "/update-post-by-id/:id",
  isAuthorizedUser,
  fileUpload(),
  updateForumById
);

routes.delete("/delete-post-by-id/:id", isAuthorizedUser, deleteForumById);

module.exports = routes;

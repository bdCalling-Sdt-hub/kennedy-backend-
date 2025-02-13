const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addPost,
  addCommentToForum,
  getAllPosts,
  getAllCommentsOfAForum,
  getPostById,
  getPostByUserId,
  updatePostById,
  deletePostById,
} = require("../controller/forum.controller");

const { isAuthorizedUser } = require("../middleware/authValidationJWT");

routes.post("/add-post", isAuthorizedUser, fileUpload(), addPost);
routes.post(
  "/add-comment-to-forum/:postId",
  isAuthorizedUser,
  addCommentToForum
);

routes.get("/get-all-posts", getAllPosts);

routes.get("/get-all-comments-of-a-forum/:forumId", getAllCommentsOfAForum);

routes.get("/get-post-by-id/:id", getPostById);

routes.get("/get-post-by-user-id/:id", isAuthorizedUser, getPostByUserId);

routes.put(
  "/update-post-by-id/:id",
  isAuthorizedUser,
  fileUpload(),
  updatePostById
);

routes.delete("/delete-post-by-id/:id", isAuthorizedUser, deletePostById);

module.exports = routes;

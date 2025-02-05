const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addPost,
  getAllPosts,
  getPostById,
  getPostByUserId,
  updatePostById,
  deletePostById,
} = require("../controller/forum.controller");

const { isAuthorizedUser } = require("../middleware/authValidationJWT");

routes.post("/add-post", isAuthorizedUser, fileUpload(), addPost);

routes.get("/get-all-posts", getAllPosts);

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

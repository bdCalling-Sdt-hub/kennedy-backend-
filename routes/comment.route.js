const express = require("express");
const routes = express();

const {
  addCommentToConfession,
  getAllConfessionComments,
  getAllConfessionCommentsByConfessionId,
  deleteConfessionComment,

  addCommentToPodcast,
  getAllPodcastComments,
  getAllPodcastCommentsByPodcastId,
  deletePodcastComment,
} = require("../controller/comment.controller");

const { isAuthorizedUser } = require("../middleware/authValidationJWT");

routes.get("/get-all-confession-comments", getAllConfessionComments);
routes.get(
  "/get-all-confession-comments-by-confession-id/:confessionId",
  getAllConfessionCommentsByConfessionId
);
routes.delete(
  "/delete-confession-comment/:commentId",
  isAuthorizedUser,
  deleteConfessionComment
);

routes.post(
  "/add-comment-to-confession",

  isAuthorizedUser,
  addCommentToConfession
);

routes.get("/get-all-podcast-comments", getAllPodcastComments);
routes.get(
  "/get-all-podcast-comments-by-podcast-id/:podcastId",
  getAllPodcastCommentsByPodcastId
);
routes.delete(
  "/delete-podcast-comment/:commentId",
  isAuthorizedUser,
  deletePodcastComment
);

routes.post("/add-comment-to-podcast", isAuthorizedUser, addCommentToPodcast);

module.exports = routes;

const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addPodcast,
  getAllPodcasts,
  getPodcastById,
  updatePodcastById,
  deletePodcastById,
} = require("../controller/podcast.controller");

const { isAuthorizedAdmin } = require("../middleware/authValidationJWT");

routes.post("/add-podcast", isAuthorizedAdmin, fileUpload(), addPodcast);

routes.get("/get-all-podcasts", getAllPodcasts);

routes.get("/get-podcast-by-id/:id", getPodcastById);

routes.put(
  "/update-podcast-by-id/:id",
  isAuthorizedAdmin,
  fileUpload(),
  updatePodcastById
);

routes.delete(
  "/delete-podcast-by-id/:id",
  isAuthorizedAdmin,
  deletePodcastById
);

module.exports = routes;

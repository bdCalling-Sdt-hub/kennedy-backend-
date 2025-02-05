const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addConfession,
  getAllConfessions,
  getConfessionById,
  updateConfessionById,
  deleteConfessionById,
} = require("../controller/confession.controller");

const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");

routes.post("/add-confession", isAuthorizedUser, fileUpload(), addConfession);

routes.get("/get-all-confessions", getAllConfessions);

routes.get("/get-confession-by-id/:id", getConfessionById);

routes.put(
  "/update-confession-by-id/:id",
  isAuthorizedUser,
  fileUpload(),
  updateConfessionById
);

routes.delete(
  "/delete-confession-by-id/:id",
  isAuthorizedUser,
  deleteConfessionById
);

module.exports = routes;

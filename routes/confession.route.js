const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addConfession,
  getAllConfessions,
  getConfessionById,
  updateConfessionById,
  deleteConfessionById,
  approveConfessionById,
  cancelConfessionById,
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

routes.put(
  "/approve-confession-by-id/:id",
  isAuthorizedAdmin,
  approveConfessionById
);

routes.put(
  "/cancel-confession-by-id/:id",
  isAuthorizedAdmin,
  cancelConfessionById
);

module.exports = routes;

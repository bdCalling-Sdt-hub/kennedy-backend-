const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addConfession,
  getAllConfessions,
  getConfessionById,
  getConfessionByUser,
  updateConfessionById,
  deleteConfessionById,
  approveConfession,
  cancelConfession,
} = require("../controller/confession.controller");

const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");

routes.post("/add-confession", isAuthorizedUser, fileUpload(), addConfession);

routes.get("/get-all-confessions", getAllConfessions);

routes.get("/get-confession-by-id/:id", getConfessionById);
routes.get("/get-confession-by-user", isAuthorizedUser, getConfessionByUser);
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

routes.post("/approve-confession/:id", isAuthorizedAdmin, approveConfession);

routes.post("/cancel-confession/:id", isAuthorizedAdmin, cancelConfession);

module.exports = routes;

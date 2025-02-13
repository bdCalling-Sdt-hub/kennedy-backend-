const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  getAllUsers,
  getOneUserById,
  getUsersAppliedForAffiliate,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  profile,
  updateProfileByUser,
} = require("../controller/user.controller");

const {
  isAuthorized,
  isAuthorizedUser,
} = require("../middleware/authValidationJWT");
const { userValidator } = require("../middleware/validation");

// gets all user data
// routes.get("/", isAuthorized, UserController.getAll);
routes.get("/", getAllUsers);

// Route to get notifications by userId
routes.get("/notifications-by-user", getNotificationsByUserId);

// Route to get notifications by userId
routes.get("/all-notifications", getAllNotifications);

// // get one user data
routes.get("/get-one-user/:id", getOneUserById);

// updates user data
routes.patch(
  "/get-one-user/:id",
  fileUpload(),
  // isAuthorizedUser,
  // userValidator.update,
  updateUserById
);

routes.get("/profile", isAuthorizedUser, profile);

routes.get(
  "/users-applied-for-affiliate",

  getUsersAppliedForAffiliate
);

routes.patch(
  "/update-profile-by-user",
  isAuthorizedUser,
  fileUpload(),
  updateProfileByUser
);

module.exports = routes;

const express = require("express");
const routes = express();
const {
  signup,
  createAdmin,
  verifyEmail,
  login,
  logout,
  signupAsAffiliate,
  approveAffiliate,
  cancelAffiliate,
  // loginAsDoctor,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controller/auth.controller");
const { userValidator, authValidator } = require("../middleware/validation");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} = require("../middleware/authValidationJWT");
// const { authValidator } = require("../middleware/authValidation");

// for signing up
routes.post(
  "/auth/signup",
  // userValidator.create,
  // authValidator.create,
  signup
);

routes.post(
  "/auth/create-admin",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedSuperAdmin,
  createAdmin
);

// for signing up as doctor
routes.post(
  "/auth/signup-as-affiliate",
  // userValidator.create,
  // authValidator.create,
  signupAsAffiliate
);

routes.post(
  "/auth/verify-email",
  // userValidator.create,
  // authValidator.create,
  verifyEmail
);

routes.post(
  "/auth/forgot-password",
  // userValidator.create,
  // authValidator.create,
  forgotPassword
);

routes.post(
  "/auth/reset-password",
  // userValidator.create,
  // authValidator.create,
  resetPassword
);

routes.post(
  "/auth/change-password",
  // userValidator.create,
  // authValidator.create,
  changePassword
);

// for approving doctor
routes.post(
  "/auth/approve-affiliate",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  approveAffiliate
);

// for canceling doctor
routes.post(
  "/auth/cancel-affiliate",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedAdmin,
  cancelAffiliate
);

// for logging in
routes.post("/auth/login", authValidator.login, login);

// for logging in
// routes.post("/auth/login-as-doctor", authValidator.login, loginAsDoctor);

// for logging in
routes.post("/auth/logout", logout);

module.exports = routes;

const express = require("express");
const routes = express();
const {
  createSubscription,
  getAllSubscriptionPlans,
  getSubscriptionById,
  getSubscriptionTimeLeftOfAUser,
  getSubscriptionTimeLeftOfAllUsers,
  updateSubscriptionById,
  deleteSubscriptionById,
} = require("../controller/subscription.controller");

const {
  isAuthorizedAdmin,
  isAuthorizedUser,
} = require("../middleware/authValidationJWT");

routes.post(
  "/create-subscription",
  // isAuthorizedAdmin,
  createSubscription
);

routes.get("/get-all-subscriptions", getAllSubscriptionPlans);

routes.get(
  "/get-subscription-time-left-of-a-user",
  isAuthorizedUser,
  getSubscriptionTimeLeftOfAUser
);

routes.get(
  "/get-subscription-time-left-of-all-users",
  isAuthorizedAdmin,
  getSubscriptionTimeLeftOfAllUsers
);

routes.put(
  "/update-subscription-by-id/:id",
  //   isAuthorizedAdmin,
  updateSubscriptionById
);

routes.delete(
  "/delete-subscription-by-id/:id",
  //   isAuthorizedAdmin,
  deleteSubscriptionById
);

module.exports = routes;

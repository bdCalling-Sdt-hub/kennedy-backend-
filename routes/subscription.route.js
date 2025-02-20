const express = require("express");
const routes = express();
const {
  createSubscription,
  getAllSubscriptionPlans,
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionTimeLeftOfAUser,
  getSubscriptionTimeLeftOfAllUsers,
  updateSubscriptionById,
  deleteSubscriptionPlanById,
} = require("../controller/subscription.controller");

const {
  isAuthorizedAdmin,
  isAuthorizedUser,
} = require("../middleware/authValidationJWT");

routes.post("/create-subscription", isAuthorizedAdmin, createSubscription);

routes.get("/get-all-subscription-plans", getAllSubscriptionPlans);

routes.get("/get-all-subscriptions", getAllSubscriptions);

routes.get("/get-subscription-by-id/:id", getSubscriptionById);

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
  "/delete-subscription-plan-by-id/:id",
  //   isAuthorizedAdmin,
  deleteSubscriptionPlanById
);

module.exports = routes;

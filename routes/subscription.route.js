const express = require("express");
const routes = express();
const {
  createSubscription,
  getAllSubscriptionPlans,
  getSubscriptionById,
  updateSubscriptionById,
  deleteSubscriptionById,
} = require("../controller/subscription.controller");

const { isAuthorizedAdmin } = require("../middleware/authValidationJWT");

routes.post(
  "/create-subscription",
  // isAuthorizedAdmin,
  createSubscription
);

routes.get("/get-all-subscriptions", getAllSubscriptionPlans);

routes.get("/get-subscription-by-id/:id", getSubscriptionById);

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

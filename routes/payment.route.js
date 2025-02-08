const express = require("express");
const routes = express();
const {
  createPaymentIntent,
  createCustomer,
  getPaymentIntent,
  getAllPaymentIntents,
  confirmPaymentbyPaymentIntent,
} = require("../controller/payment.controller");
const {
  isAuthorizedUser,
  isAuthorizedAdmin,
} = require("../middleware/authValidationJWT");

routes.post("/create-payment-intent", isAuthorizedUser, createPaymentIntent);
routes.post(
  "/confirm-payment",
  isAuthorizedUser,
  confirmPaymentbyPaymentIntent
);
routes.post("/get-payment-intent", getPaymentIntent);
routes.get("/get-all-payment-intents", isAuthorizedAdmin, getAllPaymentIntents);

routes.post("/create-customer", createCustomer);

module.exports = routes;

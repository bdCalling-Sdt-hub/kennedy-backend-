const express = require("express");
const routes = express();
const {
  createPaymentIntent,
  createCustomer,
  getAffiliateByCode,
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
routes.get("/get-affiliate-by-code/:affiliateCode", getAffiliateByCode);
routes.post("/create-customer", createCustomer);

module.exports = routes;

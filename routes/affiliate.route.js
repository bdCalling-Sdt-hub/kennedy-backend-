const express = require("express");
const routes = express();
const {
  getAllAffiliates,
  getOneAffiliateById,
  getAffiliateByCode,
  getAffiliateByUser,
} = require("../controller/affiliate.controller");

const { isAuthorizedUser } = require("../middleware/authValidationJWT");

routes.get("/get-all-affiliates", getAllAffiliates);
routes.get("/get-one-affiliate/:id", getOneAffiliateById);

routes.get("/get-affiliate-by-code/:affiliateCode", getAffiliateByCode);
routes.get("/get-affiliate-by-user", isAuthorizedUser, getAffiliateByUser);

module.exports = routes;

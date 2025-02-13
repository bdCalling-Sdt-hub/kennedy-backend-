const express = require("express");
const routes = express();
const { addAboutUs, getAboutUs } = require("../controller/aboutUs.controller");

routes.get("/get-about-us", getAboutUs);
routes.post("/add-about-us", addAboutUs);
module.exports = routes;

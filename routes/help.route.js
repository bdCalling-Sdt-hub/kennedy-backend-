const express = require("express");
const routes = express();
const { addHelp, getHelp } = require("../controller/help.controller");

routes.get("/get-help", getHelp);
routes.post("/add-help", addHelp);
module.exports = routes;

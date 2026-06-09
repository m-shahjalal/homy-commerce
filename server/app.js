const express = require("express");
const error = require("./lib/error");
const middlewares = require("./middleware");
const routes = require("./routes");

const app = express();
middlewares(app);
routes(app);
error(app);

module.exports = app;

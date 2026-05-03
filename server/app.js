const express = require("express");
const path = require("path");
const db = require("./lib/db");
const error = require("./lib/error");
const middlewares = require("./middleware");
const routes = require("./routes");

const app = express();
db(app);
middlewares(app);
routes(app);
error(app);

module.exports = app;

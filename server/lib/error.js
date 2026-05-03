const logger = require("../utils/logger");

module.exports = (app) => {
  app.use((req, res, next) => {
    if (res.headersSent === true) {
      logger.error("Header already sent to client");
      next("Header already sent to client");
    }
  });

  app.use("/api", (req, res, next) => {
    let error = new Error("404 page not found");
    error.status = 404;
    next(error);
  });

  app.use((error, _req, res, next) => {
    console.log(error);
    if (error.status === 404) {
      logger.error(error.message || error.error);
      res.json({ error: error.message, status: error.status });
    } else {
      res.json({
        error: error.message || error || "internal server error",
        status: error.status || 500,
      });
      logger.error(error.message || "internal server error");
    }
    next();
  });
};

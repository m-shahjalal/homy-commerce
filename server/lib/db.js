const mongoose = require("mongoose");
const logger = require("../utils/logger");


const db = async (app) => {
  if (mongoose.connection.readyState >= 1) return app;

  // strictQuery is a Mongoose-level setting, not a driver option.
  // Set it before connecting so query fields absent from the schema are
  // not silently stripped (preserves Mongoose 5 behaviour).
  mongoose.set("strictQuery", false);

  try {
    await mongoose.connect(process.env.DB_URI);
    logger.info("db connection established");
    return app;
  } catch (err) {
    logger.error(err);
    if (!process.env.VERCEL) process.exit(1);
    throw err;
  }
};

module.exports = db;

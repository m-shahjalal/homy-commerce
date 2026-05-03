const mongoose = require("mongoose");
const logger = require("../utils/logger");

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const url = `mongodb+srv://${username}:${password}@cluster0.1gsip.mongodb.net/ecom?appName=Cluster0`;

const db = async (app) => {
  if (mongoose.connection.readyState >= 1) return app;

  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    logger.info("db connection established");
    return app;
  } catch (err) {
    console.error("DB Connection Error:", err);
    if (!process.env.VERCEL) process.exit(1);
    throw err;
  }
};

module.exports = db;

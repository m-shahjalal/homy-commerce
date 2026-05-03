require("dotenv").config();
const http = require("http");
const app = require("./server/app");
const logger = require("./server/utils/logger");
const port = process.env.PORT || 4000;

// Only listen if not running as a Vercel serverless function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	const server = http.createServer(app);
	server.listen(port, () => logger.info(`server listening on port ${port}`));
}

module.exports = app;

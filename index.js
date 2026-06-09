require("dotenv").config();
const http = require("http");
const app = require("./server/app");
const db = require("./server/lib/db");
const logger = require("./server/utils/logger");
const port = process.env.PORT || 4000;

// On Vercel (serverless), wrap the app so the DB is connected before each
// cold-start request. The readyState guard in db.js makes subsequent calls
// a no-op once the connection is established.
if (process.env.VERCEL) {
	module.exports = async (req, res) => {
		await db(app);
		app(req, res);
	};
} else {
	// Local / non-serverless: connect once then start the HTTP server.
	db(app)
		.then(() => {
			const server = http.createServer(app);
			server.listen(port, () => logger.info(`server listening on port ${port}`));
		})
		.catch((err) => {
			logger.error(err);
			process.exit(1);
		});

	module.exports = app;
}

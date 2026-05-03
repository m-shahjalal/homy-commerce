const express = require('express');
const path = require('path');
const db = require('./lib/db');
const error = require('./lib/error');
const middlewares = require('./middleware');
const routes = require('./routes');

const app = express();
db(app);
middlewares(app);
routes(app);

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

error(app);

module.exports = app;

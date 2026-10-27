const express = require('express');
const path = require('node:path');
const commandRoutes = require('./routes/commandRoutes');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', commandRoutes);

// Return a JSON error rather than an HTML stack trace if JSON parsing fails.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body.' });
  }
  return res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = app;

'use strict';

// middleware/notFound.js — 404 fallback for unmatched routes.

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = notFound;

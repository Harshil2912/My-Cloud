'use strict';

// middleware/errorHandler.js — Global error handler. Never exposes stack traces in production.

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Log full error server-side
  logger.error({ err, url: req.url, method: req.method, ip: req.ip }, 'Unhandled error');

  // Never send stack traces to client in production
  const body = process.env.NODE_ENV === 'production'
    ? { error: status < 500 ? err.message : 'Internal server error' }
    : { error: err.message, stack: err.stack };

  res.status(status).json(body);
}

module.exports = errorHandler;

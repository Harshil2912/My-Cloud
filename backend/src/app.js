'use strict';

// app.js — Express app factory. All middleware wired here.
// HTTPS server is started in server.js.

require('./config/env'); // Validate all env vars first (fail-fast)

const express    = require('express');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const { jsonBodyLimit, urlencodedLimit } = require('./middleware/requestSize');
const securityHeaders  = require('./middleware/securityHeaders');
const globalRateLimit  = require('./middleware/globalRateLimit');
const errorHandler     = require('./middleware/errorHandler');
const notFound         = require('./middleware/notFound');
const routes           = require('./routes/index');
const logger           = require('./utils/logger');

const app = express();

// Trust proxy when behind Nginx/Caddy (internet deployment)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// CORS — must come before other middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error(`CORS blocked: ${origin}`);
    error.status = 403;
    callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Disposition', 'Content-Range', 'ETag'],
  maxAge: 86400,
}));

// Security headers (helmet)
app.use(securityHeaders);

// Body parsers
app.use(jsonBodyLimit);
app.use(urlencodedLimit);
app.use(cookieParser());

// Global rate limiter
app.use(globalRateLimit);

// Request logging
app.use((req, res, next) => {
  logger.debug({ 
    method: req.method, 
    url: req.url, 
    ip: req.ip,
    hasAuth: !!req.headers['authorization'],
    hasCsrf: !!req.headers['x-csrf-token'],
    contentType: req.headers['content-type']
  }, 'Incoming request');
  next();
});

// API routes
app.use('/api', routes);

// Force HTTPS redirect if HTTP (when not behind proxy)
app.use((req, res, next) => {
  if (!req.secure && process.env.TRUST_PROXY !== 'true') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});

// 404 + Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;

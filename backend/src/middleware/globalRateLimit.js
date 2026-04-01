'use strict';

// middleware/globalRateLimit.js — 200 requests per 15 min per IP.

const rateLimit = require('express-rate-limit');
const config    = require('../config/rateLimitConfig');

module.exports = rateLimit({
  ...config.global,
  message: { error: 'Too many requests. Please try again later.' },
});

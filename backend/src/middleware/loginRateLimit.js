'use strict';

// middleware/loginRateLimit.js — 10 attempts per 15 min per IP on login.

const rateLimit = require('express-rate-limit');
const config    = require('../config/rateLimitConfig');

module.exports = rateLimit({
  ...config.login,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

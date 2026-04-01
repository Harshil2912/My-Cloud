'use strict';

// config/rateLimitConfig.js — Centralized rate limit window/max definitions.

const WINDOW_MS         = parseInt(process.env.RATE_LIMIT_WINDOW_MS  || '900000',  10); // 15 min
const GLOBAL_MAX        = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '200',     10);
const LOGIN_MAX         = parseInt(process.env.RATE_LIMIT_LOGIN_MAX  || '10',      10);
const UPLOAD_MAX        = parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '20',      10);
const REGISTER_MAX      = 5;
const REGISTER_WINDOW   = 60 * 60 * 1000; // 1 hour

module.exports = {
  global:   { windowMs: WINDOW_MS,       max: GLOBAL_MAX,   standardHeaders: true, legacyHeaders: false },
  login:    { windowMs: WINDOW_MS,       max: LOGIN_MAX,    standardHeaders: true, legacyHeaders: false },
  upload:   { windowMs: 60 * 1000,       max: UPLOAD_MAX,   standardHeaders: true, legacyHeaders: false },
  register: { windowMs: REGISTER_WINDOW, max: REGISTER_MAX, standardHeaders: true, legacyHeaders: false },
};

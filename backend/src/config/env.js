'use strict';

// config/env.js — Validates ALL required env vars on startup (fail-fast).
// Import this module FIRST in server.js before anything else.

require('dotenv').config();

const REQUIRED = [
  'NODE_ENV',
  'PORT',
  'TLS_CERT_PATH',
  'TLS_KEY_PATH',
  'JWT_PRIVATE_KEY_PATH',
  'JWT_PUBLIC_KEY_PATH',
  'ENCRYPTION_MASTER_KEY',
  'DB_PATH',
  'UPLOADS_DIR',
  'CSRF_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`[env] Missing required environment variables:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

if (process.env.ENCRYPTION_MASTER_KEY.length !== 64) {
  console.error('[env] ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes)');
  process.exit(1);
}

module.exports = process.env;

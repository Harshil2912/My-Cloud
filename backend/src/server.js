'use strict';

// server.js — HTTPS server entry point.
// Source of truth for running the application.
// CRITICAL: env + migrations MUST run before any model files are loaded.

// 1. Load env vars first (fail-fast validation)
require('./config/env');

// 2. Run DB migrations before any model files are require()'d.
//    Model files call db.prepare() at module level — tables must exist first.
const runMigrations = require('./scripts/migrate');
runMigrations();

// 3. Now load app (routes → controllers → models use already-migrated DB)
const https   = require('https');
const app     = require('./app');
const db      = require('./config/db');
const { getTlsOptions }  = require('./config/tls');
const { startScheduler } = require('./services/backupService');
const compressionQueue   = require('./workers/compressionQueue');
const logger             = require('./utils/logger');

require('express-async-errors'); // propagate async errors to express error handler

const PORT = parseInt(process.env.PORT || '443', 10);
const HOST = process.env.HOST || '0.0.0.0';

let server;
try {
  server = https.createServer(getTlsOptions(), app);
} catch (err) {
  logger.fatal({ err }, 'Failed to create HTTPS server — check TLS_CERT_PATH and TLS_KEY_PATH');
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  logger.info({ port: PORT, host: HOST }, 'Pvt Cloud server listening (HTTPS)');
  startScheduler();
  compressionQueue.start();
});

server.on('error', (err) => {
  logger.fatal({ err }, 'Server error');
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(() => {
    db.close();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  // Force exit after 30s if connections stall
  setTimeout(() => process.exit(1), 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = { server, db };

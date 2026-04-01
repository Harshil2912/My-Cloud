'use strict';

// services/shutdownService.js
// Graceful shutdown: waits for in-flight uploads to complete before exiting.

const logger = require('../utils/logger');

let activeUploads = 0;
let shuttingDown  = false;

function increment() { activeUploads++; }
function decrement() { activeUploads = Math.max(0, activeUploads - 1); }
function isShuttingDown() { return shuttingDown; }

function gracefulShutdown(server, db) {
  shuttingDown = true;
  logger.info({ activeUploads }, 'Graceful shutdown initiated');

  server.close(() => {
    logger.info('HTTP server closed');
    waitForUploads(() => {
      db.close();
      logger.info('Database closed. Exiting.');
      process.exit(0);
    });
  });
}

function waitForUploads(cb, maxWaitMs = 30_000) {
  const deadline = Date.now() + maxWaitMs;
  const poll = () => {
    if (activeUploads === 0 || Date.now() > deadline) return cb();
    setTimeout(poll, 200);
  };
  poll();
}

process.on('SIGTERM', () => {
  const { server, db } = require('../server');
  gracefulShutdown(server, db);
});

process.on('SIGINT', () => {
  const { server, db } = require('../server');
  gracefulShutdown(server, db);
});

module.exports = { increment, decrement, isShuttingDown };

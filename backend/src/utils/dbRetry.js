'use strict';

// utils/dbRetry.js — Wraps better-sqlite3 write operations with SQLITE_BUSY retry.
// Used for write operations that could fail when backup WAL checkpoint is running.

const logger = require('./logger');

/**
 * Retry a synchronous better-sqlite3 operation up to maxAttempts times.
 * @param {Function} fn  - Synchronous function to execute (e.g. () => stmt.run(...))
 * @param {number}   maxAttempts - Default 3
 * @param {number}   delayMs     - Default 200ms between retries
 */
function dbRetry(fn, maxAttempts = 3, delayMs = 200) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
      if (err.code !== 'SQLITE_BUSY' || attempt === maxAttempts) throw err;
      logger.warn({ attempt, code: err.code }, 'SQLITE_BUSY — retrying');
      // Synchronous sleep — acceptable since this is a brief retry
      const end = Date.now() + delayMs;
      while (Date.now() < end) { /* spin wait */ }
    }
  }
  throw lastErr;
}

module.exports = { dbRetry };

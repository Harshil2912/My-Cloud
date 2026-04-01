'use strict';

// utils/logger.js — Pino JSON logger. Writes to file + console.

const pino = require('pino');
const path = require('path');
const fs   = require('fs');

const LOG_FILE    = process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log');
const LOG_LEVEL   = process.env.LOG_LEVEL || 'info';

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const logger = pino({
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream([
  { stream: process.stdout },
  { stream: pino.destination({ dest: LOG_FILE, sync: false }) },
]));

module.exports = logger;

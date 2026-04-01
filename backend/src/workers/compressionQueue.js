'use strict';

// workers/compressionQueue.js
// Main-thread persistent compression task queue backed by SQLite.
// Polls compression_tasks table every 5s for pending work.
// Spawns a single compressionWorker.js worker_thread.
// Auto-respawns worker on crash.

const { Worker } = require('worker_threads');
const path       = require('path');
const db         = require('../config/db');
const storageService = require('../services/storageService');
const logger     = require('../utils/logger');

const WORKER_PATH = path.join(__dirname, 'compressionWorker.js');
const POLL_MS     = 5_000;
const MAX_ATTEMPTS= 3;

let worker    = null;
let busy      = false;
let workerAlive = false;

// On startup: reset any tasks stuck as 'processing' from a previous crash
db.prepare(`UPDATE compression_tasks SET status='pending' WHERE status='processing'`).run();
// Recover tasks that failed due to old zstd API mismatch in prior builds.
db.prepare(`
  UPDATE compression_tasks
  SET status='pending', attempts=0, error_message=NULL
  WHERE status='error' AND error_message LIKE '%createCompressStream is not a function%'
`).run();

function spawnWorker() {
  if (worker) { try { worker.terminate(); } catch {} }

  worker     = new Worker(WORKER_PATH);
  workerAlive= true;

  worker.on('message', (result) => {
    busy = false;
    logger.info({ result }, 'Compression task result');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Compression worker error — respawning');
    workerAlive = false;
    busy        = false;
    setTimeout(spawnWorker, 1000);
  });

  worker.on('exit', (code) => {
    workerAlive = false;
    busy        = false;
    if (code !== 0) {
      logger.warn({ code }, 'Compression worker exited unexpectedly — respawning');
      setTimeout(spawnWorker, 1000);
    }
  });

  logger.info('Compression worker spawned');
}

function enqueue(fileId) {
  db.prepare(`
    INSERT OR IGNORE INTO compression_tasks (file_id, status, attempts, created_at)
    VALUES (?, 'pending', 0, ?)
  `).run(fileId, Date.now());
}

function poll() {
  if (busy || !workerAlive) return;

  const task = db.prepare(`
    SELECT ct.file_id, f.stored_filename, f.user_id
    FROM compression_tasks ct
    JOIN files f ON ct.file_id = f.id
    WHERE ct.status = 'pending' AND ct.attempts < ?
    ORDER BY ct.created_at ASC
    LIMIT 1
  `).get(MAX_ATTEMPTS);

  if (!task) return;

  db.prepare(`
    UPDATE compression_tasks
    SET status='processing', attempts=attempts+1, last_attempt_at=?
    WHERE file_id=?
  `).run(Date.now(), task.file_id);

  const encPath = storageService.getFilePath(task.user_id, task.stored_filename);
  busy = true;
  worker.postMessage({ fileId: task.file_id, encPath, userId: task.user_id });
}

function start() {
  spawnWorker();
  setInterval(poll, POLL_MS);
  logger.info({ pollMs: POLL_MS }, 'Compression queue started');
}

function getStatus() {
  const counts = db.prepare(`
    SELECT status, COUNT(*) AS cnt FROM compression_tasks GROUP BY status
  `).all();
  return { counts, workerAlive };
}

module.exports = { start, enqueue, getStatus };

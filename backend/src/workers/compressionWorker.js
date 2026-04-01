'use strict';

// workers/compressionWorker.js
// worker_thread: STREAMING decrypt -> compress -> re-encrypt pipeline.
// Memory usage: ~64-256 KB of stream buffers regardless of file size.
// Plaintext is NEVER written to disk.
//
// PIPELINE ORDER (CRITICAL):
//   disk -> DECRYPT -> COMPRESS -> ENCRYPT -> disk(.enc.zst.tmp)
//   This is correct because we are re-compressing an already-encrypted file.
//   The worker FIRST decrypts to get plaintext, THEN compresses it, THEN re-encrypts.

const { workerData, parentPort } = require('worker_threads');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const zlib   = require('zlib');

const { createDecryptStream } = require('../services/encryptionService');

async function processTask(task) {
  const { fileId, encPath, userId } = task;

  const db = require('../config/db');
  const row = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!row) throw new Error(`File not found: ${fileId}`);

  const { shouldSkipCompression } = require('../services/compressionService');
  if (shouldSkipCompression(row.mime_type)) {
    db.prepare(`UPDATE files SET compression_status='skipped', compression_algorithm='none', updated_at=? WHERE id=?`)
      .run(Date.now(), fileId);
    db.prepare(`UPDATE compression_tasks SET status='done' WHERE file_id=?`).run(fileId);
    parentPort.postMessage({ fileId, status: 'skipped' });
    return;
  }

  const { COMPRESSION_ZSTD_LEVEL, COMPRESSION_MIN_RATIO } = require('../config/constants');

  const tmpPath   = encPath + '.zst.tmp';
  const newIV     = crypto.randomBytes(16);
  const derivedKey= require('../services/encryptionService').deriveFileKey(fileId);
  const newCipher = crypto.createCipheriv('aes-256-gcm', derivedKey, newIV);

  const readStream    = fs.createReadStream(encPath);
  const decryptStream = createDecryptStream(fileId, row.encryption_iv, row.encryption_auth_tag);
  // Use built-in gzip streaming compression for stable cross-platform support.
  const compressLevel = Math.max(1, Math.min(9, Number(COMPRESSION_ZSTD_LEVEL) || 6));
  const compressStream= zlib.createGzip({ level: compressLevel });
  const writeStream   = fs.createWriteStream(tmpPath);

  let writtenBytes = 0;
  newCipher.on('data', (chunk) => { writtenBytes += chunk.length; });

  // Pipeline: disk -> decrypt -> compress -> re-encrypt -> disk(.tmp)
  await pipeline(readStream, decryptStream, compressStream, newCipher, writeStream);

  const newAuthTag = newCipher.getAuthTag().toString('hex');
  const ratio      = writtenBytes / row.original_size_bytes;

  if (ratio > COMPRESSION_MIN_RATIO) {
    // Poor compression gain — discard
    await fs.promises.unlink(tmpPath);
    db.prepare(`UPDATE files SET compression_status='skipped', compression_algorithm='none', updated_at=? WHERE id=?`)
      .run(Date.now(), fileId);
    db.prepare(`UPDATE compression_tasks SET status='skipped' WHERE file_id=?`).run(fileId);
    parentPort.postMessage({ fileId, status: 'skipped' });
    return;
  }

  // Good compression — commit
  const newStoredFilename = path.basename(encPath) + '.zst';
  const newPath = path.join(path.dirname(encPath), newStoredFilename);
  await fs.promises.rename(tmpPath, newPath);
  await fs.promises.unlink(encPath);

  db.prepare(`
    UPDATE files SET
      stored_filename       = ?,
      compression_status    = 'compressed',
      compression_algorithm = 'gzip',
      compressed_size_bytes = ?,
      encryption_iv         = ?,
      encryption_auth_tag   = ?,
      updated_at            = ?
    WHERE id = ?
  `).run(newStoredFilename, writtenBytes, newIV.toString('hex'), newAuthTag, Date.now(), fileId);

  db.prepare(`UPDATE compression_tasks SET status='done' WHERE file_id=?`).run(fileId);
  parentPort.postMessage({ fileId, status: 'compressed', savedBytes: row.original_size_bytes - writtenBytes });
}

// Main worker message handler
parentPort.on('message', async (task) => {
  try {
    await processTask(task);
  } catch (err) {
    const logger = require('../utils/logger');
    logger.error({ err, fileId: task.fileId }, 'Compression worker error');

    // Clean up temp file if it exists
    if (task.encPath) {
      await fs.promises.unlink(task.encPath + '.zst.tmp').catch(() => {});
    }

    const db = require('../config/db');
    db.prepare(`UPDATE files SET compression_status='error', updated_at=? WHERE id=?`).run(Date.now(), task.fileId);
    db.prepare(`
      UPDATE compression_tasks
      SET status = CASE WHEN attempts >= 3 THEN 'error' ELSE 'pending' END,
          error_message = ?,
          last_attempt_at = ?
      WHERE file_id = ?
    `).run(err.message, Date.now(), task.fileId);

    parentPort.postMessage({ fileId: task.fileId, status: 'error', error: err.message });
  }
});

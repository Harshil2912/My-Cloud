'use strict';

// services/compressionService.js
// Provides MIME-type decision logic and streaming compress/decompress.
// The actual streaming pipeline runs in compressionWorker.js (worker_thread).

const { COMPRESSION_SKIP_MIME } = require('../config/constants');

/**
 * Returns true if this MIME type should be skipped for compression.
 * (Already compressed formats gain nothing from zstd.)
 */
function shouldSkipCompression(mimeType) {
  if (!mimeType) return true;
  const base = mimeType.split(';')[0].trim().toLowerCase();
  if (COMPRESSION_SKIP_MIME.has(base)) return true;
  if (base.startsWith('video/'))  return true;
  if (base.startsWith('audio/') && !['audio/wav','audio/flac','audio/aiff'].includes(base)) return true;
  return false;
}

module.exports = { shouldSkipCompression };

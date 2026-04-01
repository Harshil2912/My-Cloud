'use strict';

// middleware/diskSafety.js
// Checks available disk space before accepting an upload.
// Returns 507 Insufficient Storage if below the safety threshold.

const fs = require('fs');

const UPLOADS_DIR        = process.env.UPLOADS_DIR || './data/uploads';
const DISK_MIN_FREE      = parseInt(process.env.DISK_MIN_FREE_BYTES || '524288000', 10); // 500 MB

async function diskSafety(req, res, next) {
  try {
    const stats = await fs.promises.statfs(UPLOADS_DIR);
    const freeBytes = stats.bfree * stats.bsize;

    if (freeBytes < DISK_MIN_FREE) {
      return res.status(507).json({
        error: 'Insufficient storage available on server',
        freeBytes,
        thresholdBytes: DISK_MIN_FREE,
      });
    }

    // Check if the incoming file would fit
    const uploadSize = parseInt(req.headers['content-length'] || '0', 10);
    if (uploadSize > 0 && uploadSize > freeBytes - DISK_MIN_FREE) {
      return res.status(507).json({
        error: 'File too large for available storage',
        uploadSize,
        availableBytes: freeBytes - DISK_MIN_FREE,
      });
    }

    next();
  } catch (err) {
    // fs.statfs not available on older Node — skip check and proceed
    if (err.code === 'ENOSYS' || err.code === 'ERR_FS_EISDIR') return next();
    next(err);
  }
}

module.exports = diskSafety;

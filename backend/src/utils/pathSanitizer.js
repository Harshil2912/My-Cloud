'use strict';

// utils/pathSanitizer.js — Safe filename resolution, strip traversal.

const path = require('path');

function sanitizeFilename(rawName) {
  // Strip directory components and dangerous characters
  const base = path.basename(rawName || 'file')
    .replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '_')
    .replace(/^\.+/, '_')
    .slice(0, 255);
  return base || 'file';
}

function safeStoragePath(uploadsDir, userId, filename) {
  const userDir   = path.resolve(uploadsDir, userId);
  const filePath  = path.resolve(userDir, filename);
  // Verify resolved path is still inside userDir (prevent traversal)
  if (!filePath.startsWith(userDir + path.sep) && filePath !== userDir) {
    throw new Error('Path traversal attempt detected');
  }
  return filePath;
}

module.exports = { sanitizeFilename, safeStoragePath };

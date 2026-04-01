'use strict';

// utils/etag.js — ETag generation per file (for HTTP cache validation).

const crypto = require('crypto');

function generateETag(fileId, updatedAt) {
  return crypto
    .createHash('sha256')
    .update(`${fileId}:${updatedAt}`)
    .digest('hex')
    .slice(0, 16);
}

module.exports = { generateETag };

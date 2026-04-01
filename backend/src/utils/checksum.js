'use strict';

// utils/checksum.js — SHA-256 of a file path or buffer.

const crypto = require('crypto');
const fs     = require('fs');

function checksumFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end',  ()      => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function checksumBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

module.exports = { checksumFile, checksumBuffer };

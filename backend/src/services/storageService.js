'use strict';

// services/storageService.js
// Manages per-user subdirectories and quota enforcement.
// Phase 1: local filesystem. Phase 2: swap to storageService (MinIO/S3) only.

const fs   = require('fs');
const path = require('path');
const { safeStoragePath } = require('../utils/pathSanitizer');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../data/uploads');

function getUserDir(userId) {
  const dir = path.join(UPLOADS_DIR, userId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getFilePath(userId, filename) {
  return safeStoragePath(UPLOADS_DIR, userId, filename);
}

function createWriteStream(userId, filename) {
  const filePath = getFilePath(userId, filename);
  return fs.createWriteStream(filePath);
}

function createReadStream(userId, filename) {
  const filePath = getFilePath(userId, filename);
  return fs.createReadStream(filePath);
}

async function deleteFile(userId, filename) {
  const filePath = getFilePath(userId, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // ignore already-deleted
  }
}

module.exports = {
  UPLOADS_DIR,
  getUserDir,
  getFilePath,
  createWriteStream,
  createReadStream,
  deleteFile,
};

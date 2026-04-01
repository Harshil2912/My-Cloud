'use strict';

// controllers/fileController.js
// upload, download (with range request support), list, delete, metadata

const fs           = require('fs');
const path         = require('path');
const zlib         = require('zlib');
const { pipeline } = require('stream/promises');
const { v4: uuidv4 } = require('uuid');
const fileModel      = require('../models/fileModel');
const userModel      = require('../models/userModel');
const cacheService   = require('../services/cacheService');
const encService     = require('../services/encryptionService');
const auditService   = require('../services/auditService');
const storageService = require('../services/storageService');
const compressionQueue = require('../workers/compressionQueue');
const { generateETag } = require('../utils/etag');
const { nowMs }        = require('../utils/timeUtils');
const logger           = require('../utils/logger');

// POST /api/files/upload
async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const userId     = req.user.userId;
  const fileId     = uuidv4();
  const originalName = req.sanitizedFilename || req.file.originalname;
  const mimeType   = req.detectedMime        || req.file.mimetype;
  const tempPath   = req.file.path;
  const encFilename= `${fileId}.enc`;
  const encPath    = storageService.getFilePath(userId, encFilename);

  storageService.getUserDir(userId);

  // Check quota
  const { storage_used, storage_quota } = userModel.getStorageInfo(userId);
  if (storage_used + req.file.size > storage_quota) {
    await fs.promises.unlink(tempPath).catch(() => {});
    return res.status(507).json({ error: 'Storage quota exceeded' });
  }

  // Encrypt plaintext to .enc
  const { iv, stream: encryptStream, getAuthTag } = encService.createEncryptStream(fileId);
  const readStream  = fs.createReadStream(tempPath);
  const writeStream = fs.createWriteStream(encPath);

  try {
    await pipeline(readStream, encryptStream, writeStream);
  } catch (err) {
    await fs.promises.unlink(tempPath).catch(() => {});
    await fs.promises.unlink(encPath).catch(() => {});
    throw err;
  }

  await fs.promises.unlink(tempPath); // remove plaintext raw

  const authTag  = getAuthTag();
  const fileSize = req.file.size;

  fileModel.create({
    id: fileId, userId, originalFilename: originalName,
    storedFilename: encFilename, mimeType,
    originalSizeBytes: fileSize, encryptionIv: iv,
    encryptionAuthTag: authTag, createdAt: nowMs(), updatedAt: nowMs(),
  });

  userModel.updateQuota(userId, fileSize);
  cacheService.delFileList(userId);

  auditService.logEvent('file_upload', req, {
    fileId, metadata: { filename: originalName, size: fileSize },
  });

  // Enqueue async compression (after response)
  setImmediate(() => compressionQueue.enqueue(fileId));

  res.status(201).json({
    id: fileId, filename: originalName,
    size: fileSize, mimeType, createdAt: nowMs(),
  });
}

async function streamFile(req, res, opts = {}) {
  const { contentDisposition = 'attachment' } = opts;
  const { fileId } = req.params;
  let file = cacheService.getFileMeta(fileId);
  if (!file) {
    file = fileModel.findById(fileId);
    if (file) cacheService.setFileMeta(fileId, file);
  }
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (file.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const etag         = generateETag(fileId, file.updated_at);
  const lastModified = new Date(file.created_at).toUTCString();

  if (req.headers['if-none-match'] === `"${etag}"`) return res.status(304).end();

  // LRU stream cache check
  const cached = cacheService.getStream(fileId);

  res.setHeader('Content-Type',        file.mime_type);
  res.setHeader('Content-Disposition', `${contentDisposition}; filename="${encodeURIComponent(file.original_filename)}"`);
  res.setHeader('ETag',                `"${etag}"`);
  res.setHeader('Last-Modified',       lastModified);
  res.setHeader('Cache-Control',       'private, max-age=3600');
  res.setHeader('Accept-Ranges',       'bytes');

  const rangeHeader = req.headers['range'];
  const totalSize   = file.original_size_bytes;
  let rangeStart = 0, rangeEnd = totalSize - 1;
  let isRange = false;

  if (rangeHeader && process.env.RANGE_REQUEST_ENABLED !== 'false') {
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) {
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      return res.status(416).end();
    }
    rangeStart = match[1] ? parseInt(match[1], 10) : 0;
    rangeEnd   = match[2] ? parseInt(match[2], 10) : totalSize - 1;
    if (rangeStart > rangeEnd || rangeEnd >= totalSize) {
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      return res.status(416).end();
    }
    isRange = true;
    res.setHeader('Content-Range',  `bytes ${rangeStart}-${rangeEnd}/${totalSize}`);
    res.setHeader('Content-Length', rangeEnd - rangeStart + 1);
    res.status(206);
  } else {
    res.setHeader('Content-Length', totalSize);
    res.status(200);
  }

  if (cached) {
    // Serve from LRU cache
    const slice = isRange ? cached.slice(rangeStart, rangeEnd + 1) : cached;
    return res.end(slice);
  }

  // Decrypt + decompress from disk
  const encFilename = file.stored_filename;
  const userId      = file.user_id;
  const readStream  = storageService.createReadStream(userId, encFilename);
  const decryptStr  = encService.createDecryptStream(fileId, file.encryption_iv, file.encryption_auth_tag);

  const chunks = [];
  let byteCount = 0;
  const { Transform, PassThrough } = require('stream');

  // Range slicing transform
  const rangeSlice = isRange ? new Transform({
    transform(chunk, _, cb) {
      const startOff = Math.max(0, rangeStart - byteCount);
      const endOff   = Math.min(chunk.length, rangeEnd - byteCount + 1);
      byteCount += chunk.length;
      if (endOff > startOff) this.push(chunk.slice(startOff, endOff));
      cb();
    },
  }) : null;

  const bufferCollect = new PassThrough();
  bufferCollect.on('data', (chunk) => chunks.push(chunk));

  try {
    if (file.compression_status === 'compressed') {
      const algorithm = (file.compression_algorithm || '').toLowerCase();
      let decomp = null;

      if (algorithm === 'gzip') {
        decomp = zlib.createGunzip();
      } else if (algorithm === 'zstd') {
        const zstd = require('@mongodb-js/zstd');
        if (typeof zstd.createDecompressStream === 'function') {
          decomp = zstd.createDecompressStream();
        } else {
          throw new Error('zstd decompression stream is not available in this runtime');
        }
      } else {
        throw new Error(`Unsupported compression algorithm: ${algorithm || 'unknown'}`);
      }

      if (isRange) {
        await pipeline(readStream, decryptStr, decomp, rangeSlice, res);
      } else {
        await pipeline(readStream, decryptStr, decomp, bufferCollect);
        const buf = Buffer.concat(chunks);
        cacheService.setStream(fileId, buf);
        res.end(buf);
      }
    } else {
      if (isRange) {
        await pipeline(readStream, decryptStr, rangeSlice, res);
      } else {
        await pipeline(readStream, decryptStr, bufferCollect);
        const buf = Buffer.concat(chunks);
        cacheService.setStream(fileId, buf);
        res.end(buf);
      }
    }
  } catch (err) {
    logger.error({ err, fileId }, 'Download pipeline error');
    if (!res.headersSent) res.status(500).json({ error: 'Download failed — file may be corrupted' });
  }

  auditService.logEvent('file_download', req, {
    fileId, metadata: { filename: file.original_filename },
  });
}

// GET /api/files/:fileId/download
async function download(req, res) {
  return streamFile(req, res, { contentDisposition: 'attachment' });
}

// GET /api/files/:fileId/preview
async function preview(req, res) {
  return streamFile(req, res, { contentDisposition: 'inline' });
}

// GET /api/files
function list(req, res) {
  const userId  = req.user.userId;
  const page    = Math.max(1, parseInt(req.query.page  || '1',  10));
  const limit   = Math.min(100, parseInt(req.query.limit || '50', 10));
  const offset  = (page - 1) * limit;
  const cacheKey= `${userId}:p${page}:l${limit}`;

  const cached = cacheService.getFileList(cacheKey);
  if (cached) return res.json(cached);

  const files = fileModel.findByUser(userId, limit, offset);
  const total = fileModel.countByUser(userId);
  const result = { files, total, page, pages: Math.ceil(total / limit) };

  cacheService.setFileList(cacheKey, result);
  res.json(result);
}

// GET /api/files/:fileId/metadata
function metadata(req, res) {
  const { fileId } = req.params;
  let file = cacheService.getFileMeta(fileId);
  if (!file) {
    file = fileModel.findById(fileId);
    if (file) cacheService.setFileMeta(fileId, file);
  }
  if (!file)                           return res.status(404).json({ error: 'File not found' });
  if (file.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  res.json({
    id: file.id, filename: file.original_filename, mimeType: file.mime_type,
    originalSize: file.original_size_bytes, compressedSize: file.compressed_size_bytes,
    compressionStatus: file.compression_status, createdAt: file.created_at,
  });
}

// DELETE /api/files/:fileId
async function deleteFile(req, res) {
  const { fileId } = req.params;
  const userId     = req.user.userId;

  const file = fileModel.findById(fileId);
  if (!file)                       return res.status(404).json({ error: 'File not found' });
  if (file.user_id !== userId)     return res.status(403).json({ error: 'Forbidden' });

  fileModel.softDelete(fileId, userId);

  // Async physical delete
  setImmediate(async () => {
    try {
      await storageService.deleteFile(userId, file.stored_filename);
    } catch (err) {
      logger.error({ err, fileId }, 'Physical file delete failed');
    }
    userModel.updateQuota(userId, -file.original_size_bytes);
    cacheService.delFileList(userId);
    cacheService.delFileMeta(fileId);
    cacheService.delStream(fileId);
  });

  auditService.logEvent('file_delete', req, { fileId });
  res.status(204).end();
}

module.exports = { upload, download, preview, list, metadata, deleteFile };

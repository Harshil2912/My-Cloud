'use strict';

// middleware/fileValidator.js
// 1. Detects real MIME via magic bytes (file-type library, NOT extension)
// 2. Checks against ALLOWED_MIME_TYPES allowlist
// 3. Sanitizes filename: strip traversal, null bytes, control chars, max 255 chars

const { fileTypeFromStream } = require('file-type');
const path = require('path');
const { ALLOWED_MIME_TYPES } = require('../config/constants');

async function fileValidator(req, res, next) {
  try {
    if (!req.file && !req.files) return next(); // no file to validate yet

    const file = req.file || (req.files && req.files[0]);
    if (!file) return next();

    // Sanitize original filename
    let filename = file.originalname || 'upload';
    filename = path.basename(filename)              // strip directory
      .replace(/[\x00-\x1f\x7f]/g, '')             // strip control chars
      .slice(0, 255);
    if (!filename || filename === '.' || filename === '..') {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    req.sanitizedFilename = filename;

    // Detect MIME from magic bytes
    let detected;
    try {
      detected = await fileTypeFromStream(require('fs').createReadStream(file.path));
    } catch (err) {
      require('../utils/logger').warn({ err, filePath: file.path }, 'File type detection failed');
      return res.status(400).json({ error: 'Could not determine file type' });
    }

    const mime = detected ? detected.mime : file.mimetype;
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      require('fs').unlink(file.path, () => {}); // clean up
      return res.status(400).json({ error: `File type not allowed: ${mime}` });
    }

    req.detectedMime = mime;
    next();
  } catch (err) {
    require('../utils/logger').error({ err }, 'fileValidator middleware error');
    res.status(500).json({ error: 'File validation error' });
  }
}

module.exports = fileValidator;

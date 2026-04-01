'use strict';

// routes/fileRoutes.js

const express      = require('express');
const router       = express.Router();
const multer       = require('multer');
const path         = require('path');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');
const fileValidator  = require('../middleware/fileValidator');
const diskSafety     = require('../middleware/diskSafety');
const uploadAbuse    = require('../middleware/uploadAbuse');
const uploadRL       = require('../middleware/uploadRateLimit');
const fileController = require('../controllers/fileController');
const { UPLOADS_DIR, MAX_FILE_SIZE_BYTES } = require('../config/constants');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!req.user || !req.user.userId) {
        return cb(new Error('User not authenticated'));
      }
      const userDir = path.join(process.env.UPLOADS_DIR || './data/uploads', req.user.userId);
      require('fs').mkdirSync(userDir, { recursive: true });
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => cb(null, uuidv4() + '_raw'),
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '5368709120', 10) },
});

router.use(authenticate);

router.get('/',                  fileController.list);
router.get('/:fileId/metadata',  fileController.metadata);
router.get('/:fileId/download',  fileController.download);
router.get('/:fileId/preview',   fileController.preview);

router.post('/upload',
  doubleCsrfProtection,   // Reads x-csrf-token header + __Host-csrf cookie — works before multer
  diskSafety,
  uploadAbuse,
  uploadRL,
  upload.single('file'),
  fileValidator,
  fileController.upload,
);

router.delete('/:fileId',
  doubleCsrfProtection,
  fileController.deleteFile,
);

module.exports = router;

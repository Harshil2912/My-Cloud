'use strict';

// routes/index.js — Mounts all route groups under /api.

const express = require('express');
const router  = express.Router();

router.use('/auth',    require('./authRoutes'));
router.use('/files',   require('./fileRoutes'));
router.use('/shares',  require('./shareRoutes'));
router.use('/backup',  require('./backupRoutes'));
router.use('/health',  require('./healthRoutes'));
router.use('/csrf-token', require('./csrfRoutes'));

module.exports = router;

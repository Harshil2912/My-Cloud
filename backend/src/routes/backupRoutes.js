'use strict';

// routes/backupRoutes.js — Admin only.

const express            = require('express');
const router             = express.Router();
const authenticate       = require('../middleware/authenticate');
const requireAdmin       = require('../middleware/requireAdmin');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');
const backupController   = require('../controllers/backupController');

router.use(authenticate, requireAdmin);

router.get('/list',           backupController.list);
router.get('/:backupId/verify', backupController.verify);
router.post('/trigger', doubleCsrfProtection, backupController.trigger);

module.exports = router;

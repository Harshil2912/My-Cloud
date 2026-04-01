'use strict';

// routes/shareRoutes.js

const express        = require('express');
const router         = express.Router();
const authenticate   = require('../middleware/authenticate');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');
const shareController= require('../controllers/shareController');

router.use(authenticate);

router.get('/my-shares',   shareController.listMyShares);
router.get('/mine',        shareController.listSharedWithMe);
router.get('/with-me',     shareController.listSharedWithMe);
router.get('/:shareId/download', shareController.downloadShared);
router.post('/',           doubleCsrfProtection, shareController.createShare);
router.delete('/:shareId', doubleCsrfProtection, shareController.revokeShare);

module.exports = router;

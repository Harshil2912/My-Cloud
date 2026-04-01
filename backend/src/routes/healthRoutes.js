'use strict';

const express     = require('express');
const router      = express.Router();
const authenticate= require('../middleware/authenticate');
const requireOwner= require('../middleware/requireOwner');
const healthCtrl  = require('../controllers/healthController');

router.get('/', authenticate, requireOwner, healthCtrl.health);

module.exports = router;

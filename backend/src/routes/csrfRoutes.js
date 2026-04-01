'use strict';

const express = require('express');
const router  = express.Router();
const { generateToken } = require('../middleware/csrfProtection');

router.get('/', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

module.exports = router;

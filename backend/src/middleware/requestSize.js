'use strict';

// middleware/requestSize.js — JSON body 10kb max, multipart handled by multer config.

const express = require('express');

const jsonBodyLimit = express.json({ limit: '10kb' });
const urlencodedLimit = express.urlencoded({ extended: false, limit: '10kb' });

module.exports = { jsonBodyLimit, urlencodedLimit };

'use strict';

// controllers/backupController.js — trigger, list, verify (admin only)

const backupModel   = require('../models/backupModel');
const backupService = require('../services/backupService');
const { checksumFile } = require('../utils/checksum');

// POST /api/backup/trigger
function trigger(req, res) {
  const { type } = req.body;
  if (!['db', 'files', 'all'].includes(type)) {
    return res.status(400).json({ error: 'type must be "db", "files", or "all"' });
  }

  setImmediate(async () => {
    if (type === 'db' || type === 'all')    await backupService.backupDatabase().catch(() => {});
    if (type === 'files' || type === 'all') await backupService.backupFiles().catch(() => {});
  });

  res.status(202).json({ message: 'Backup queued' });
}

// GET /api/backup/list
function list(req, res) {
  res.json({ backups: backupModel.findAll() });
}

// GET /api/backup/:backupId/verify
async function verify(req, res) {
  const record = backupModel.findById(parseInt(req.params.backupId, 10));
  if (!record) return res.status(404).json({ error: 'Backup record not found' });

  const actual   = await checksumFile(record.filepath);
  const expected = record.sha256_checksum;
  res.json({ valid: actual === expected, expected, actual, filename: record.filename });
}

module.exports = { trigger, list, verify };

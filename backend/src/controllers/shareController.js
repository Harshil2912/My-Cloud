'use strict';

// controllers/shareController.js
// create, list, revoke, download-shared

const shareModel   = require('../models/shareModel');
const shareService = require('../services/shareService');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');

// POST /api/shares
async function createShare(req, res) {
  const { fileId, recipientEmail, permission, expiresInDays } = req.body;
  if (!fileId || !recipientEmail || !permission) {
    return res.status(400).json({ error: 'fileId, recipientEmail, and permission are required' });
  }
  if (!['view', 'download'].includes(permission)) {
    return res.status(400).json({ error: 'permission must be "view" or "download"' });
  }

  const result = await shareService.createShare({
    fileId, ownerId: req.user.userId, recipientEmail, permission, expiresInDays,
  });

  const recipient = require('../models/userModel').findByEmail(recipientEmail);
  if (recipient) cacheService.delSharedList(recipient.id);

  auditService.logEvent('share_created', req, {
    fileId, metadata: { recipientEmail, permission },
  });

  res.status(201).json(result);
}

// GET /api/shares/my-shares
function listMyShares(req, res) {
  const shares = shareModel.findByOwner(req.user.userId);
  res.json({ shares });
}

// GET /api/shares/with-me
function listSharedWithMe(req, res) {
  const userId  = req.user.userId;
  const cached  = cacheService.getSharedList(userId);
  if (cached) return res.json({ shares: cached });

  const shares = shareModel.findActiveForUser(userId);
  cacheService.setSharedList(userId, shares);
  res.json({ shares });
}

// GET /api/shares/:shareId/download
async function downloadShared(req, res) {
  const share = shareModel.findById(req.params.shareId);
  if (!share)                          return res.status(404).json({ error: 'Share not found' });
  if (share.recipient_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  if (share.is_revoked)                return res.status(403).json({ error: 'Share revoked' });
  if (share.expires_at < Date.now())   return res.status(403).json({ error: 'Share expired' });
  if (share.permission !== 'download') return res.status(403).json({ error: 'View-only permission' });

  // Delegate to file download pipeline with the file owner's credentials
  req.user  = { ...req.user, userId: share.file_owner_id };
  req.params.fileId = share.file_id;

  const fileController = require('./fileController');
  auditService.logEvent('shared_file_download', req, {
    fileId: share.file_id, metadata: { shareId: share.id },
  });

  return fileController.download(req, res);
}

// DELETE /api/shares/:shareId
function revokeShare(req, res) {
  const share = shareModel.findById(req.params.shareId);
  if (!share) return res.status(404).json({ error: 'Share not found' });
  if (share.owner_id !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  shareModel.revoke(req.params.shareId);
  cacheService.delSharedList(share.recipient_id);

  auditService.logEvent('share_revoked', req, {
    metadata: { shareId: req.params.shareId },
  });

  res.status(204).end();
}

module.exports = { createShare, listMyShares, listSharedWithMe, downloadShared, revokeShare };

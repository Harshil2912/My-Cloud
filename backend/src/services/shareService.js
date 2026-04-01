'use strict';

// services/shareService.js — Share token generation and permission checks.

const { v4: uuidv4 } = require('uuid');
const shareModel     = require('../models/shareModel');
const fileModel      = require('../models/fileModel');
const userModel      = require('../models/userModel');
const { nowMs, addDays } = require('../utils/timeUtils');
const { SHARE_DEFAULT_EXPIRY_DAYS, SHARE_MAX_EXPIRY_DAYS } = require('../config/constants');

async function createShare({ fileId, ownerId, recipientEmail, permission, expiresInDays }) {
  const file = fileModel.findById(fileId);
  if (!file || file.is_deleted) throw Object.assign(new Error('File not found'), { status: 404 });
  if (file.user_id !== ownerId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  const recipient = userModel.findByEmail(recipientEmail);
  if (!recipient) throw Object.assign(new Error('Recipient user not found'), { status: 404 });
  if (recipient.id === ownerId) throw Object.assign(new Error('Cannot share with yourself'), { status: 400 });

  const dup = shareModel.checkDuplicate(fileId, recipient.id);
  if (dup) throw Object.assign(new Error('Already shared. Revoke existing share first.'), { status: 409 });

  const days = Math.min(expiresInDays || SHARE_DEFAULT_EXPIRY_DAYS, SHARE_MAX_EXPIRY_DAYS);
  const shareId = uuidv4();
  shareModel.create({
    id: shareId, fileId, ownerId, recipientId: recipient.id,
    permission, expiresAt: addDays(nowMs(), days), createdAt: nowMs(),
  });

  return { shareId, fileId, recipientEmail, permission, expiresAt: addDays(nowMs(), days) };
}

module.exports = { createShare };

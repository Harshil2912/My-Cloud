'use strict';

// models/auditModel.js — Append-only audit_log writes. Non-blocking.

const db = require('../config/db');

const stmtInsert = db.prepare(`
  INSERT INTO audit_log (event_type, user_id, file_id, ip_address, user_agent, metadata, timestamp)
  VALUES (@eventType, @userId, @fileId, @ipAddress, @userAgent, @metadata, @timestamp)
`);

function log({ eventType, userId = null, fileId = null, ipAddress, userAgent = null, metadata = null }) {
  try {
    stmtInsert.run({
      eventType,
      userId:    userId    || null,
      fileId:    fileId    || null,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || null,
      metadata:  metadata  ? JSON.stringify(metadata) : null,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Never crash a request because of an audit write failure
    require('../utils/logger').error({ err, eventType }, 'Audit log write failed');
  }
}

module.exports = { log };

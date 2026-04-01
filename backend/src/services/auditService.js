'use strict';

// services/auditService.js — Fire-and-forget async audit log writes.

const auditModel = require('../models/auditModel');

/**
 * Log an audit event asynchronously. Never blocks the request.
 */
function logEvent(eventType, req, extras = {}) {
  setImmediate(() => {
    auditModel.log({
      eventType,
      userId:    req.user?.userId  || null,
      ipAddress: req.ip            || 'unknown',
      userAgent: req.get('user-agent') || null,
      ...extras,
    });
  });
}

module.exports = { logEvent };

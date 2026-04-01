'use strict';

// middleware/requireOwner.js — Allows only the configured owner account.

function requireOwner(req, res, next) {
  const defaultOwnerEmails = [
    'solanki.harshil2912@gmail.com',
  ];

  const configuredOwners = (
    process.env.OWNER_EMAILS
      || process.env.OWNER_EMAIL
      || defaultOwnerEmails.join(',')
  )
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (req.user?.email || '').trim().toLowerCase();

  if (!configuredOwners.includes(userEmail)) {
    return res.status(403).json({ error: 'Owner access required' });
  }
  return next();
}

module.exports = requireOwner;

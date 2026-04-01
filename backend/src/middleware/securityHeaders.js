'use strict';

// middleware/securityHeaders.js — Helmet security headers.

const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard:         { action: 'deny' },
  noSniff:            true,
  referrerPolicy:     { policy: 'no-referrer' },
  permittedCrossDomainPolicies: false,
  hidePoweredBy:      true,
});

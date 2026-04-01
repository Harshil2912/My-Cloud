'use strict';

// config/tls.js — Loads TLS cert + key, returns HTTPS server options.

const fs   = require('fs');
const path = require('path');

function getTlsOptions() {
  const certPath = process.env.TLS_CERT_PATH;
  const keyPath  = process.env.TLS_KEY_PATH;

  if (!fs.existsSync(certPath)) {
    throw new Error(`TLS cert not found: ${certPath}. Run: node src/scripts/generate-cert.js`);
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`TLS key not found: ${keyPath}. Run: node src/scripts/generate-cert.js`);
  }

  return {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
    minVersion: 'TLSv1.2',
  };
}

module.exports = { getTlsOptions };

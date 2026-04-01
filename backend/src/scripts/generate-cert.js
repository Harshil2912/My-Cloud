'use strict';

// scripts/generate-cert.js — Generates a self-signed TLS certificate with SAN.
// Usage: node generate-cert.js [IP or hostname]
// Outputs: certs/server.crt and certs/server.key

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const CERTS_DIR = path.resolve(__dirname, '../../../certs');
const CERT_FILE = path.join(CERTS_DIR, 'server.crt');
const KEY_FILE  = path.join(CERTS_DIR, 'server.key');
const EXT_FILE  = path.join(CERTS_DIR, 'san.ext');

const host = process.argv[2] || '127.0.0.1';
const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
const sanField = isIP ? `IP:${host},IP:127.0.0.1` : `DNS:${host},DNS:localhost,IP:127.0.0.1`;

function checkOpenssl() {
  try {
    execSync('openssl version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function generateWithOpenssl() {
  fs.mkdirSync(CERTS_DIR, { recursive: true });

  const extContent = `[req]
distinguished_name = req_distinguished_name
x509_extensions    = v3_req
prompt             = no

[req_distinguished_name]
C  = US
ST = Local
L  = Local
O  = NAS Cloud Server
CN = ${host}

[v3_req]
keyUsage         = keyEncipherment,dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName   = ${sanField}
`;

  fs.writeFileSync(EXT_FILE, extContent, 'utf8');

  execSync(
    `openssl req -x509 -nodes -newkey rsa:4096 -days 825 ` +
    `-keyout "${KEY_FILE}" -out "${CERT_FILE}" ` +
    `-config "${EXT_FILE}"`,
    { stdio: 'inherit' }
  );

  fs.rmSync(EXT_FILE, { force: true });
  console.log(`\nCertificate generated:`);
  console.log(`  Key:  ${KEY_FILE}`);
  console.log(`  Cert: ${CERT_FILE}`);
  console.log(`\nSAN entries: ${sanField}`);
  console.log('\nTo trust this cert on your LAN devices, copy server.crt to each device and import it into the system trust store.');
}

function generateWithNodeCrypto() {
  // Fallback: use Node.js 15+ self-signed cert generation
  const { generateKeyPairSync } = require('crypto');
  console.warn('OpenSSL not found in PATH. Falling back to node:crypto key generation (no SAN support).');
  console.warn('For proper LAN TLS with SAN, install OpenSSL and re-run this script.\n');

  fs.mkdirSync(CERTS_DIR, { recursive: true });

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(KEY_FILE,  privateKey,  { mode: 0o600 });
  fs.writeFileSync(CERT_FILE, publicKey,   { mode: 0o644 });

  console.log('RSA key pair written (not a proper TLS cert). Use OpenSSL for a real cert.');
}

if (checkOpenssl()) {
  generateWithOpenssl();
} else {
  generateWithNodeCrypto();
}

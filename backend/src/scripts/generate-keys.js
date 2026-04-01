'use strict';

// scripts/generate-keys.js — Generates RS256 JWT keypair.
// Outputs: certs/jwt-private.pem and certs/jwt-public.pem

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const CERTS_DIR  = path.resolve(__dirname, '../../../certs');
const PRIV_FILE  = path.join(CERTS_DIR, 'jwt-private.pem');
const PUB_FILE   = path.join(CERTS_DIR, 'jwt-public.pem');

fs.mkdirSync(CERTS_DIR, { recursive: true });

if (fs.existsSync(PRIV_FILE) || fs.existsSync(PUB_FILE)) {
  const overwrite = process.argv.includes('--force');
  if (!overwrite) {
    console.error('JWT keys already exist. Use --force to overwrite.');
    process.exit(1);
  }
  console.warn('--force flag detected — overwriting existing JWT keys.');
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync(PRIV_FILE, privateKey,  { mode: 0o600 }); // owner read only
fs.writeFileSync(PUB_FILE,  publicKey,   { mode: 0o644 });

console.log('JWT RS4096 keypair generated:');
console.log(`  Private key: ${PRIV_FILE}  (keep secret, gitignored)`);
console.log(`  Public key:  ${PUB_FILE}`);
console.log('\nSet in .env:');
console.log(`  JWT_PRIVATE_KEY_PATH=${PRIV_FILE}`);
console.log(`  JWT_PUBLIC_KEY_PATH=${PUB_FILE}`);

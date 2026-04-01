'use strict';

// services/encryptionService.js
// AES-256-GCM streaming encrypt/decrypt.
// Uses HKDF to derive a unique key per file from MASTER_KEY.
// Plaintext is NEVER written to disk.

const crypto = require('crypto');

const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'hex');
const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 16; // bytes
const KEY_LENGTH = 32; // bytes (AES-256)

/**
 * Derive a per-file 256-bit key using HKDF.
 * @param {string} fileId
 * @returns {Buffer}
 */
function deriveFileKey(fileId) {
  return crypto.hkdfSync('sha256', MASTER_KEY, fileId, 'file-enc', KEY_LENGTH);
}

/**
 * Create an encryption Transform stream and metadata (iv, getAuthTag).
 * PIPELINE ORDER: plaintext -> encryptStream -> disk
 */
function createEncryptStream(fileId) {
  const iv         = crypto.randomBytes(IV_LENGTH);
  const key        = deriveFileKey(fileId);
  const cipher     = crypto.createCipheriv(ALGORITHM, key, iv);

  return {
    iv:           iv.toString('hex'),
    stream:       cipher,
    getAuthTag:   () => cipher.getAuthTag().toString('hex'),
  };
}

/**
 * Create a decryption Transform stream.
 * PIPELINE ORDER: disk -> decryptStream -> (decompress if needed) -> client
 * !! ALWAYS DECRYPT BEFORE DECOMPRESS !!
 */
function createDecryptStream(fileId, ivHex, authTagHex) {
  const key     = deriveFileKey(fileId);
  const iv      = Buffer.from(ivHex, 'hex');
  const decipher= crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher;
}

module.exports = { deriveFileKey, createEncryptStream, createDecryptStream };

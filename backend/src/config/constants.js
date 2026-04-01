'use strict';

// config/constants.js — Shared constants, MIME allowlist, compression skip list.

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/bmp', 'image/tiff',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aiff',
  'application/pdf',
  'text/plain', 'text/csv', 'text/html',
  'application/json', 'application/xml',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-cfb',   // Legacy Office formats (.doc/.xls/.ppt) — file-type detects as OLE/CFB
].join(',')).split(',').map((m) => m.trim());

// MIME types that are already compressed — skip zstd compression
const COMPRESSION_SKIP_MIME = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'image/jpeg', 'image/webp', 'image/gif',
  'audio/mpeg', 'audio/ogg',
  'application/zip', 'application/gzip', 'application/x-bzip2',
  'application/x-7z-compressed', 'application/x-rar-compressed',
  'application/x-tar',
]);

const MAX_FILE_SIZE_BYTES      = parseInt(process.env.MAX_FILE_SIZE_BYTES  || '5368709120', 10); // 5 GB
const DEFAULT_STORAGE_QUOTA    = 10 * 1024 * 1024 * 1024; // 10 GB
const COMPRESSION_ZSTD_LEVEL   = parseInt(process.env.COMPRESSION_ZSTD_LEVEL || '3', 10);
const COMPRESSION_MIN_RATIO    = parseFloat(process.env.COMPRESSION_MIN_RATIO || '0.95');
const STREAM_CACHE_MAX_FILE    = parseInt(process.env.STREAM_CACHE_MAX_FILE_BYTES || '5242880', 10);
const SHARE_MAX_EXPIRY_DAYS    = parseInt(process.env.SHARE_MAX_EXPIRY_DAYS || '90', 10);
const SHARE_DEFAULT_EXPIRY_DAYS= parseInt(process.env.SHARE_DEFAULT_EXPIRY_DAYS || '7', 10);

module.exports = {
  ALLOWED_MIME_TYPES,
  COMPRESSION_SKIP_MIME,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_STORAGE_QUOTA,
  COMPRESSION_ZSTD_LEVEL,
  COMPRESSION_MIN_RATIO,
  STREAM_CACHE_MAX_FILE,
  SHARE_MAX_EXPIRY_DAYS,
  SHARE_DEFAULT_EXPIRY_DAYS,
};

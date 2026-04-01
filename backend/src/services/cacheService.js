'use strict';

// services/cacheService.js — Unified cache API: node-cache (metadata) + lru-cache (streams).

const NodeCache = require('node-cache');
const { LRUCache } = require('lru-cache');

const FILE_LIST_TTL     = parseInt(process.env.FILE_LIST_CACHE_TTL_SECONDS     || '60',       10);
const FILE_META_TTL     = parseInt(process.env.FILE_METADATA_CACHE_TTL_SECONDS || '300',      10);
const STREAM_MAX_BYTES  = parseInt(process.env.STREAM_CACHE_MAX_BYTES          || '83886080', 10); // 80MB
const STREAM_MAX_FILE   = parseInt(process.env.STREAM_CACHE_MAX_FILE_BYTES     || '5242880',  10); // 5MB

const metaCache   = new NodeCache({ stdTTL: FILE_META_TTL,  checkperiod: 60 });
const streamCache = new LRUCache({
  maxSize:  STREAM_MAX_BYTES,
  sizeCalculation: (buf) => buf.length,
});

module.exports = {
  // File list cache
  getFileList:    (key)         => metaCache.get(`files:${key}`),
  setFileList:    (key, data)   => metaCache.set(`files:${key}`, data, FILE_LIST_TTL),
  delFileList:    (userId)      => metaCache.keys().filter(k => k.startsWith(`files:${userId}:`))
                                     .forEach(k => metaCache.del(k)),

  // File metadata cache
  getFileMeta:    (fileId)      => metaCache.get(`file:${fileId}`),
  setFileMeta:    (fileId, data)=> metaCache.set(`file:${fileId}`, data, FILE_META_TTL),
  delFileMeta:    (fileId)      => metaCache.del(`file:${fileId}`),

  // Shared-with-me list
  getSharedList:  (userId)      => metaCache.get(`shared:${userId}`),
  setSharedList:  (userId, data)=> metaCache.set(`shared:${userId}`, data, FILE_LIST_TTL),
  delSharedList:  (userId)      => metaCache.del(`shared:${userId}`),

  // Stream buffer cache (LRU, files <= 5MB only)
  getStream:      (fileId)      => streamCache.get(`stream:${fileId}`),
  setStream:      (fileId, buf) => {
    if (buf.length <= STREAM_MAX_FILE) {
      streamCache.set(`stream:${fileId}`, buf);
    }
  },
  delStream:      (fileId)      => streamCache.delete(`stream:${fileId}`),

  stats: () => ({
    metaEntries: metaCache.keys().length,
    streamSize:  streamCache.calculatedSize,
  }),
};

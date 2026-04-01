'use strict';

// controllers/healthController.js — System health aggregation.

const db          = require('../config/db');
const cacheService= require('../services/cacheService');
const backupModel = require('../models/backupModel');
const compressionQueue = require('../workers/compressionQueue');
const fs          = require('fs');
const path        = require('path');

async function health(req, res) {
  const UPLOADS_DIR = process.env.UPLOADS_DIR || './data/uploads';

  let dbStatus  = 'ok';
  let dbSize    = null;
  try {
    db.prepare('SELECT 1').get();
    const stat = fs.statSync(process.env.DB_PATH || './data/database.sqlite');
    dbSize = stat.size;
  } catch { dbStatus = 'error'; }

  let diskFree = 0, diskFreePercent = 0, diskTotal = 0;
  try {
    const stats   = await fs.promises.statfs(UPLOADS_DIR);
    diskFree      = stats.bfree * stats.bsize;
    diskTotal     = stats.blocks * stats.bsize;
    diskFreePercent = diskTotal > 0 ? Math.round((diskFree / diskTotal) * 100) : 0;
  } catch (err) {
    // If statfs fails, log it but continue with 0 values
    require('../utils/logger').warn({ err, dir: UPLOADS_DIR }, 'statfs failed in health check');
  }

  const lastDb    = backupModel.latestByType('db');
  const lastFiles = backupModel.latestByType('files');
  const WARN_AGE  = parseInt(process.env.BACKUP_WARNING_AGE_HOURS || '26', 10) * 3600_000;
  const backupStatus = lastDb && (Date.now() - lastDb.completed_at) < WARN_AGE ? 'ok' : 'stale';

  const cStats    = cacheService.stats();
  const qStatus   = compressionQueue.getStatus();
  const pending   = qStatus.counts.find(r => r.status === 'pending')?.cnt  || 0;
  const processing= qStatus.counts.find(r => r.status === 'processing')?.cnt|| 0;
  const errored   = qStatus.counts.find(r => r.status === 'error')?.cnt    || 0;

  const usageTotals = db.prepare(`
    SELECT
      COUNT(*) AS user_count,
      SUM(storage_used) AS total_storage_used,
      SUM(storage_quota) AS total_storage_quota,
      SUM(CASE WHEN storage_used > 0 THEN 1 ELSE 0 END) AS active_users
    FROM users
  `).get();

  const fileTotals = db.prepare(`
    SELECT
      COUNT(*) AS total_files,
      SUM(CASE WHEN compression_status = 'compressed' THEN 1 ELSE 0 END) AS compressed_files
    FROM files
    WHERE is_deleted = 0
  `).get();

  const totalStorageUsed = usageTotals?.total_storage_used || 0;
  const totalStorageQuota = usageTotals?.total_storage_quota || 0;
  const totalFiles = fileTotals?.total_files || 0;
  const compressedFiles = fileTotals?.compressed_files || 0;
  const storageUsagePercent = totalStorageQuota > 0
    ? Math.round((totalStorageUsed / totalStorageQuota) * 100)
    : 0;
  const compressionRatePercent = totalFiles > 0
    ? Math.round((compressedFiles / totalFiles) * 100)
    : 0;

  const overallStatus = dbStatus === 'error' ? 'error'
    : (backupStatus === 'stale' || errored > 0) ? 'degraded'
    : 'ok';

  const memUsage = process.memoryUsage();
  res.json({
    status: overallStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    db:     { sizeBytes: dbSize, connection: dbStatus },
    disk:   { freeBytes: diskFree, totalBytes: diskTotal, freePercent: diskFreePercent },
    backup: {
      lastDbBackup:    lastDb?.completed_at    || null,
      lastFilesBackup: lastFiles?.completed_at || null,
      status:            backupStatus,
    },
    cache:  { entries: cStats.metaEntries, lruSizeBytes: cStats.streamSize },
    compressionQueue: {
      pending, processing, errors: errored, workerAlive: qStatus.workerAlive,
    },
    memory: { rssBytes: Math.round(memUsage.rss), heapUsedBytes: Math.round(memUsage.heapUsed), heapTotalBytes: Math.round(memUsage.heapTotal) },
    usage: {
      userCount: usageTotals?.user_count || 0,
      activeUsers: usageTotals?.active_users || 0,
      totalStorageUsed,
      totalStorageQuota,
      storageUsagePercent,
      totalFiles,
      compressedFiles,
      compressionRatePercent,
    },
  });
}

module.exports = { health };

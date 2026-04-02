# Pvt Cloud Storage Platform — Full System Architecture
# Version 3.0 — All Corrections Applied + Full Improvements

---

## TABLE OF CONTENTS

1. Overview & Stack
2. Project Folder Structure
3. Upload Flow (Full Pipeline)
4. Download Flow (Full Pipeline)
5. Authentication Flow
6. File Sharing Flow
7. Backup Flow
8. Database Schema
9. API Endpoint Reference
10. Caching Strategy
11. Compression Pipeline
12. Security Checklist
13. Environment Variables
14. Library Reference
15. NAS Transition Guide
16. Public Internet Deployment
17. CORS Configuration
18. Abuse Protection (Public Deployments)
19. HTTP Range Request Support
20. Persistent Compression Job Queue
21. Backup Policy
22. Redis / Kafka Future Path
23. Storage Scalability Roadmap
24. Infrastructure Scalability Roadmap
25. Architecture Decisions

---

## 1. OVERVIEW & STACK

Self-hosted personal cloud storage platform running on a NAS server.
Built locally first, connected to NAS via Ethernet when ready.

```
Backend  : Node.js + Express (HTTPS, TLS 1.2/1.3)
Frontend : React + Vite
Database : SQLite (WAL mode — metadata, users, tokens, audit log)
Storage  : Local filesystem on NAS disk (encrypted files)
Caching  : node-cache (metadata) + LRU-cache (stream cache)
Compress : zstd (background worker_thread after upload)
Backup   : node-cron scheduled — DB snapshot + file archive
```

---

## 2. PROJECT FOLDER STRUCTURE

```
nas-cloud/
|
+-- backend/
|   |
|   +-- src/
|   |   |
|   |   +-- config/
|   |   |   +-- db.js                  # SQLite: WAL mode, PRAGMAs, cached prepared stmts
|   |   |   +-- env.js                 # Validates ALL env vars on startup (fail-fast)
|   |   |   +-- tls.js                 # Loads cert + key, builds HTTPS options object
|   |   |   +-- constants.js           # MIME allowlist, compression skip list, limits
|   |   |   +-- rateLimitConfig.js     # Centralized rate limit window/max definitions
|   |   |   +-- swagger.js             # OpenAPI base spec for /api/docs
|   |   |
|   |   +-- middleware/
|   |   |   +-- authenticate.js        # JWT verify + blacklist check (every protected route)
|   |   |   +-- requireAdmin.js        # Role check: role='admin' or 403
|   |   |   +-- globalRateLimit.js     # 200 req / 15min per IP
|   |   |   +-- loginRateLimit.js      # 10 attempts / 15min per IP on login
|   |   |   +-- uploadRateLimit.js     # 20 uploads / min per authenticated user
|   |   |   +-- csrfProtection.js      # csrf-csrf double-submit pattern
|   |   |   +-- fileValidator.js       # Magic bytes check + filename sanitization
|   |   |   +-- requestSize.js         # JSON body limit 10kb, multipart per config
|   |   |   +-- securityHeaders.js     # helmet: CSP, HSTS, X-Frame, nosniff, etc.
|   |   |   +-- errorHandler.js        # Global: no stack traces in production
|   |   |   +-- notFound.js            # 404 fallback
|   |   |   +-- diskSafety.js          # statfs check before upload: 507 if low
|   |   |   +-- uploadAbuse.js         # hourly/daily/total upload limit per user
|   |   |
|   |   +-- models/
|   |   |   +-- userModel.js           # users table CRUD
|   |   |   +-- fileModel.js           # files table CRUD + soft delete
|   |   |   +-- tokenModel.js          # refresh_tokens + token_blacklist
|   |   |   +-- auditModel.js          # append-only audit_log writes
|   |   |   +-- backupModel.js         # backup_manifest read/write
|   |   |   +-- shareModel.js          # file_shares table CRUD
|   |   |
|   |   +-- routes/
|   |   |   +-- authRoutes.js          # /api/auth/*
|   |   |   +-- fileRoutes.js          # /api/files/*
|   |   |   +-- shareRoutes.js         # /api/shares/*
|   |   |   +-- backupRoutes.js        # /api/backup/* (admin only)
|   |   |   +-- healthRoutes.js        # /api/health
|   |   |   +-- csrfRoutes.js          # GET /api/csrf-token
|   |   |   +-- index.js               # Mounts all route groups
|   |   |
|   |   +-- controllers/
|   |   |   +-- authController.js      # register, login, logout, refresh, me
|   |   |   +-- fileController.js      # upload, download, list, delete, metadata
|   |   |   +-- shareController.js     # create, list, revoke, accept, download-shared
|   |   |   +-- backupController.js    # trigger, list, verify (admin)
|   |   |   +-- healthController.js    # system health aggregation
|   |   |
|   |   +-- services/
|   |   |   +-- authService.js         # Token generation, rotation, revocation logic
|   |   |   +-- encryptionService.js   # AES-256-GCM encrypt/decrypt (streaming)
|   |   |   +-- compressionService.js  # zstd compress/decompress, MIME decision logic
|   |   |   +-- cacheService.js        # node-cache + LRU unified API
|   |   |   +-- backupService.js       # cron schedule, WAL checkpoint, archive, rotate
|   |   |   +-- auditService.js        # Fire-and-forget async audit writes
|   |   |   +-- bruteForceService.js   # In-memory fail counter + TTL map per IP
|   |   |   +-- shareService.js        # Share token generation, permission checks
|   |   |   +-- shutdownService.js     # Graceful drain: waits for uploads, then exits
|   |   |   +-- storageService.js      # Manages per-user subdirs, quota enforcement
|   |   |   +-- emailService.js        # Nodemailer wrapper (optional, email verify)
|   |   |
|   |   +-- workers/
|   |   |   +-- compressionWorker.js   # worker_thread: decrypt -> compress -> re-encrypt
|   |   |   +-- compressionQueue.js    # Main-thread task queue feeding the worker
|   |   |
|   |   +-- utils/
|   |   |   +-- magicBytes.js          # file-type wrapper + MIME allowlist check
|   |   |   +-- pathSanitizer.js       # Safe filename resolution, strip traversal
|   |   |   +-- checksum.js            # SHA-256 of file or buffer
|   |   |   +-- etag.js                # ETag generation per file
|   |   |   +-- logger.js              # Pino JSON logger (file + console)
|   |   |   +-- idGenerator.js         # UUIDv4 — file IDs, share tokens
|   |   |   +-- timeUtils.js           # Unix ms helpers, expiry calculation
|   |   |   +-- dbRetry.js             # SQLITE_BUSY retry wrapper (max 3 attempts)
|   |   |
|   |   +-- scripts/
|   |   |   +-- migrate.js             # Run all pending DB migrations in order
|   |   |   +-- restore-db.js          # CLI: restore SQLite from backup snapshot
|   |   |   +-- restore-files.js       # CLI: extract files archive to uploads dir
|   |   |   +-- verify-backup.js       # CLI: recompute + validate backup checksums
|   |   |   +-- generate-cert.js       # CLI: generate self-signed TLS cert for LAN
|   |   |   +-- generate-keys.js       # CLI: generate RS256 JWT keypair (pem files)
|   |   |
|   |   +-- migrations/
|   |   |   +-- 001_initial_schema.sql # users, files, refresh_tokens, blacklist
|   |   |   +-- 002_audit_backup.sql   # audit_log, backup_manifest
|   |   |   +-- 003_sharing.sql        # file_shares table
|   |   |
|   |   +-- app.js                     # Express app factory (all middleware wired here)
|   |   +-- server.js                  # HTTPS server entry point
|   |
|   +-- certs/                         # GITIGNORED
|   |   +-- server.key                 # RSA-2048 TLS private key
|   |   +-- server.crt                 # Self-signed TLS cert (SAN=LAN IP)
|   |   +-- jwt-private.pem            # RS256 JWT signing key
|   |   +-- jwt-public.pem             # RS256 JWT verify key (safe to share)
|   |
|   +-- data/                          # GITIGNORED
|   |   +-- database.sqlite            # Primary SQLite DB (WAL mode)
|   |   +-- uploads/                   # All files: encrypted + optionally compressed
|   |       +-- <userId>/              # Per-user subdirectory
|   |           +-- <uuid>.enc         # Encrypted file (pre-compression or skipped)
|   |           +-- <uuid>.enc.zst     # Compressed-then-encrypted file
|   |
|   +-- backups/                       # GITIGNORED — store on SEPARATE disk ideally
|   |   +-- db/
|   |   |   +-- db-YYYYMMDD.sqlite     # Daily SQLite snapshots
|   |   +-- files/
|   |   |   +-- files-YYYYMMDD.tar.zst # Weekly full file archive
|   |   +-- backup_manifest.json       # SHA-256 + metadata for every backup file
|   |
|   +-- logs/                          # GITIGNORED
|   |   +-- app.log                    # Pino JSON logs (rotate at 50MB)
|   |
|   +-- .env                           # GITIGNORED — actual secrets
|   +-- .env.example                   # COMMITTED — template with comments
|   +-- package.json
|   +-- .gitignore
|
+-- frontend/
|   |
|   +-- src/
|   |   +-- api/
|   |   |   +-- axiosClient.js         # Axios: baseURL, auth interceptor, 401 refresh
|   |   |   +-- authApi.js             # login, logout, register, refresh, me
|   |   |   +-- filesApi.js            # upload, download, list, delete, metadata
|   |   |   +-- sharesApi.js           # createShare, listShares, revokeShare,
|   |   |   |                          # listSharedWithMe, downloadShared
|   |   |   +-- healthApi.js           # health check
|   |   |
|   |   +-- context/
|   |   |   +-- AuthContext.jsx        # Access token (memory), refresh, logout
|   |   |
|   |   +-- hooks/
|   |   |   +-- useAuth.js             # Consumes AuthContext
|   |   |   +-- useFiles.js            # React Query: file list + refetch
|   |   |   +-- useShares.js           # React Query: my shares + shared-with-me
|   |   |   +-- useUpload.js           # Upload progress + abort controller
|   |   |
|   |   +-- components/
|   |   |   +-- layout/
|   |   |   |   +-- Navbar.jsx
|   |   |   |   +-- Sidebar.jsx        # My Files / Shared With Me / Health
|   |   |   |   +-- ProtectedRoute.jsx
|   |   |   +-- files/
|   |   |   |   +-- FileCard.jsx       # Name, size, date, actions menu
|   |   |   |   +-- FileList.jsx       # Paginated list of FileCards
|   |   |   |   +-- UploadDropzone.jsx # Drag-drop + progress bar
|   |   |   +-- shares/
|   |   |   |   +-- ShareModal.jsx     # Select user + permission + expiry
|   |   |   |   +-- SharedFileCard.jsx # Shared file: sharer, permissions, expiry
|   |   |   |   +-- SharedList.jsx     # List of files shared with me
|   |   |   +-- ui/
|   |   |       +-- Button.jsx
|   |   |       +-- Input.jsx
|   |   |       +-- Modal.jsx          # Confirm-delete + share dialogs
|   |   |       +-- Spinner.jsx
|   |   |       +-- Badge.jsx          # Permission level tags (view/download)
|   |   |       +-- Toast.jsx          # Non-blocking notifications
|   |   |
|   |   +-- pages/
|   |   |   +-- LoginPage.jsx
|   |   |   +-- RegisterPage.jsx
|   |   |   +-- DashboardPage.jsx      # My files: list, upload, delete, share
|   |   |   +-- SharedWithMePage.jsx   # Files others shared with me
|   |   |   +-- HealthPage.jsx         # Admin: disk, DB, backup status
|   |   |   +-- UploadPage.jsx         # Dedicated upload page with dropzone
|   |   |
|   |   +-- utils/
|   |   |   +-- formatBytes.js         # 1048576 -> "1 MB"
|   |   |   +-- formatDate.js          # ISO -> "Mar 5, 2026"
|   |   |
|   |   +-- App.jsx                    # Router + QueryClient + AuthProvider
|   |   +-- main.jsx                   # ReactDOM.createRoot
|   |
|   +-- public/
|   +-- index.html
|   +-- vite.config.js                 # Content-hash filenames, proxy to backend
|   +-- .env
|   +-- .env.example
|   +-- package.json
|
+-- ARCHITECTURE.md                    # This file
+-- README.md
+-- .gitignore
```

---

## 3. UPLOAD FLOW (Full Pipeline)

```
CLIENT (Browser)
    |
    | HTTPS POST /api/files/upload  (multipart/form-data)
    | Authorization: Bearer <accessToken>
    | X-CSRF-Token: <csrfToken>
    |
    v
+--------------------------------------------------+
|  TLS TERMINATION                                 |
|  TLS 1.2/1.3 only. Port 443. HSTS enforced.     |
|  Self-signed cert with SAN = LAN IP address.    |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  SECURITY HEADERS (helmet)                      |
|  CSP, nosniff, X-Frame-Options: DENY,           |
|  Referrer-Policy, Permissions-Policy, HSTS      |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  REQUEST SIZE LIMITER                           |
|  Multipart max = MAX_FILE_SIZE_BYTES (5GB)      |
|  JSON body max = 10kb                           |
|  413 if exceeded                                |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  GLOBAL RATE LIMITER                           |
|  200 requests / 15 min per IP                  |
|  Upload-specific: 20 uploads / min per user    |
|  429 if exceeded                               |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CSRF VALIDATION                               |
|  X-CSRF-Token header checked against cookie    |
|  403 if mismatch                               |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  AUTH MIDDLEWARE                               |
|  - Extract Bearer token from Authorization     |
|  - Verify RS256 JWT signature                  |
|  - Check expiry (15 min TTL)                   |
|  - Check JTI NOT in token_blacklist table      |
|    (prepared stmt, fast lookup)                |
|  - Attach req.user = { userId, email, role }   |
|  - 401 on any failure                          |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  QUOTA CHECK (storageService)                  |
|  SELECT storage_used, storage_quota            |
|  FROM users WHERE id = req.userId              |
|  If used >= quota: 507 Insufficient Storage    |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  FILE VALIDATOR (fileValidator middleware)      |
|  1. Read first 16 bytes of stream              |
|  2. Detect real MIME via magic bytes           |
|     (file-type library)                        |
|  3. Check MIME in ALLOWED_MIME_TYPES list      |
|  4. Cross-check detected MIME vs extension     |
|  5. Sanitize filename:                         |
|     - path.basename() — strip directory parts  |
|     - Strip null bytes, control chars          |
|     - Reject ../ absolute paths                |
|     - Max 255 characters                       |
|  6. 400 on any violation                       |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  MULTER DISK WRITE (TEMP)                      |
|  - Destination: data/uploads/<userId>/         |
|  - mkdirSync({ recursive: true }) if needed    |
|  - Stored as: <uuidv4>_raw (temp filename)     |
|  - This is the PLAINTEXT file on disk (temp)   |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  ENCRYPTION (encryptionService)                |
|  1. Generate random 16-byte IV                 |
|  2. Derive per-file key:                       |
|     HKDF(MASTER_KEY, fileId, 'file-enc')       |
|  3. AES-256-GCM stream encrypt                 |
|     plaintext -> ciphertext + 16-byte authTag  |
|  4. Write to: <uuid>.enc                       |
|  5. Delete temp _raw file                      |
|  6. Store IV + authTag in DB                   |
+--------------------------------------------------+
    |
    v
+--------------------+   +----------------------------+
| WRITE TO DISK      |   | WRITE METADATA TO SQLITE   |
|                    |   |                            |
| uploads/<userId>/  |   | INSERT INTO files:         |
| <uuid>.enc         |   |  id, user_id,              |
|                    |   |  original_filename,        |
| Encrypted          |   |  stored_filename,          |
| ciphertext only.   |   |  mime_type,                |
| No user data       |   |  original_size_bytes,      |
| readable on disk.  |   |  encryption_iv,            |
|                    |   |  encryption_auth_tag,      |
|                    |   |  compression_status        |
|                    |   |   = 'pending',             |
|                    |   |  created_at                |
+--------------------+   +----------------------------+
           |                          |
           +----------+---------------+
                      |
                      v
           +----------------------+
           | UPDATE USER QUOTA    |
           | storage_used +=      |
           | original_size_bytes  |
           +----------------------+
                      |
                      v
           +----------------------+
           | CACHE INVALIDATE     |
           | node-cache.del(      |
           | `files:${userId}:*`) |
           +----------------------+
                      |
                      v
           +----------------------+
           | AUDIT LOG (async)    |
           | event: 'file_upload' |
           | user_id, file_id,    |
           | ip, size, timestamp  |
           +----------------------+
                      |
                      v
           +----------------------+
           | RESPONSE 201         |
           | { id, filename,      |
           |   size, mimeType,    |
           |   createdAt }        |
           +----------------------+
                      |
                     [ASYNC — after response sent to client]
                      |
                      v
+--------------------------------------------------+
|  COMPRESSION WORKER (worker_thread)             |
|                                                 |
|  compressionQueue.js polls DB for pending tasks |
|  (see Section B5 — Persistent Compression Queue) |
|                                                 |
|  compressionWorker.js receives task:            |
|                                                 |
|  MIME already compressed?                       |
|  (video/*, image/jpeg, zip, gz, mp3, etc.)      |
|       |YES -> UPDATE files SET                  |
|       |       compression_status='skipped',     |
|       |       compression_algorithm='none'      |
|       |       DONE                              |
|       |NO                                       |
|       v                                         |
|  STREAMING PIPELINE (constant memory ~64-256KB) |
|  fs.createReadStream(<uuid>.enc)                |
|    -> DECRYPT (createDecipheriv aes-256-gcm)    |
|    -> COMPRESS (zstd.createCompressStream {3})  |
|    -> ENCRYPT (createCipheriv aes-256-gcm, newIV)|
|    -> fs.createWriteStream(<uuid>.enc.zst.tmp)  |
|                                                 |
|  RATIO CHECK: writtenBytes/original > 0.95?     |
|    YES (poor) -> unlink .tmp, keep .enc, skip   |
|    NO  (good) -> rename .tmp -> .enc.zst,       |
|                  unlink old .enc, commit to DB  |
|                                                 |
|  On ANY error:                                  |
|     Keep original .enc                          |
|     UPDATE compression_status = 'error'        |
|     Log error with fileId                       |
|     Do NOT crash worker                         |
+--------------------------------------------------+
```

---

## 4. DOWNLOAD FLOW (Full Pipeline)

```
CLIENT (Browser)
    |
    | HTTPS GET /api/files/:fileId/download
    | Authorization: Bearer <accessToken>
    | If-None-Match: "<etag>"           (optional browser cache)
    | If-Modified-Since: <date>         (optional browser cache)
    |
    v
[TLS + HEADERS + RATE LIMIT — same as upload]
    |
    v
+--------------------------------------------------+
|  AUTH MIDDLEWARE (same as upload)               |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  FILE METADATA CACHE CHECK                     |
|  node-cache.get(`file:${fileId}`)              |
|       |                                        |
|       | HIT  -> use cached metadata object     |
|       | MISS -> SELECT FROM files              |
|       |         WHERE id = ? AND is_deleted=0  |
|       |         cache result TTL=300s          |
|       v                                        |
|  Not found -> 404                              |
|  file.user_id != req.userId?                   |
|  -> Check if share exists (see share check)    |
|  -> No share -> 403 Forbidden                  |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  HTTP CACHE VALIDATION                         |
|                                                |
|  ETag = SHA256(fileId + updatedAt)[0..16]      |
|  Last-Modified = file.created_at (HTTP date)   |
|                                                |
|  If-None-Match matches ETag?     -> 304        |
|  If-Modified-Since >= created?   -> 304        |
|  Otherwise: continue to serve                 |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  LRU STREAM CACHE CHECK                        |
|  lruCache.get(`stream:${fileId}`)              |
|       |                                        |
|       | HIT  -> stream buffer directly         |
|       |         (skip disk I/O entirely)        |
|       | MISS -> continue to disk read          |
+--------------------------------------------------+
    |
    v (cache miss)
+--------------------------------------------------+
|  READ FROM DISK                                  |
|                                                  |
|  Check compression_status in DB:                 |
|    'compressed' -> read stream: <uuid>.enc.zst   |
|    any other   -> read stream: <uuid>.enc        |
|                                                  |
|  NOTE: Both file types hold encrypted bytes.     |
|  The .zst suffix means compressed-then-          |
|  encrypted. The file on disk is NEVER readable   |
|  before decryption regardless of extension.      |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  STEP 1 — DECRYPT FIRST (always)                 |
|                                                  |
|  !! RULE: NEVER decompress before decrypting !!  |
|  AES-256-GCM ciphertext is computationally       |
|  indistinguishable from random bytes.            |
|  A decompressor fed ciphertext will either       |
|  throw a stream error or produce garbage output. |
|                                                  |
|  1. Load IV + authTag from DB metadata           |
|  2. Derive key: HKDF(MASTER_KEY, fileId)         |
|  3. Pipe disk read stream through:               |
|     crypto.createDecipheriv(                     |
|       'aes-256-gcm', derivedKey, iv)             |
|  4. Set auth tag: decipher.setAuthTag(authTag)   |
|     GCM tag is verified automatically at end.    |
|     Tag mismatch -> abort, return 500            |
|     (indicates file tampering on disk)           |
|  5. Output: plaintext stream                     |
|     (or compressed plaintext if .enc.zst)        |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  STEP 2 — DECOMPRESS (only if compressed)        |
|                                                  |
|  compression_status == 'compressed' ?            |
|    YES -> pipe plaintext stream through          |
|           zstd.createDecompressStream()          |
|           Output: original plaintext stream      |
|    NO  -> pass plaintext stream unchanged        |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  STEP 3 — RANGE SLICE (if Range header present)  |
|                                                  |
|  If Range: bytes=start-end header present:       |
|    Pipe through byte-range transform stream      |
|    Set status 206 Partial Content                |
|    Set Content-Range: bytes start-end/total      |
|  If no Range header:                             |
|    Stream full plaintext, status 200             |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  LRU CACHE STORE (files <= 5MB only)             |
|  Buffer the decrypted+decompressed output.       |
|  lruCache.set(`stream:${fileId}`, buffer)        |
|  Large files are not cached — streamed direct.   |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RESPONSE TO CLIENT                              |
|  Content-Type: <original MIME>                   |
|  Content-Disposition: attachment; filename="..." |
|  Content-Length: original_size_bytes (full)      |
|                  or range length (partial)       |
|  ETag / Last-Modified (browser cache headers)    |
|  Cache-Control: private, max-age=3600            |
|  Accept-Ranges: bytes                            |
|                                                  |
|  200 OK  -> full file                            |
|  206 Partial Content -> range slice              |
|  304 Not Modified -> client cache valid          |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  AUDIT LOG (async, non-blocking)                 |
|  event: 'file_download'                          |
|  user_id, file_id, ip, bytes_sent, timestamp     |
+--------------------------------------------------+
```

---

## 5. AUTHENTICATION FLOW

```
================== REGISTER ==================

POST /api/auth/register
    |
    v
+--------------------------------------------------+
|  INPUT VALIDATION (express-validator)           |
|  - email: valid format, max 254 chars           |
|  - password: min 12 chars, complexity check     |
|  400 on failure                                 |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  DUPLICATE CHECK                               |
|  SELECT id FROM users WHERE email = ?           |
|  409 if email already registered               |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  PASSWORD HASH                                 |
|  bcrypt.hash(password, 12)  -> hash string     |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  INSERT USER                                   |
|  id = UUIDv4                                   |
|  role = 'user'                                 |
|  storage_quota = 10GB default                  |
|  201 { userId, email }                         |
+--------------------------------------------------+

================== LOGIN ==================

POST /api/auth/login
    |
    v
+--------------------------------------------------+
|  BRUTE FORCE PROTECTION                        |
|  bruteForceService.check(req.ip):              |
|  - Failed attempts >= 10 in 15min? -> 429      |
|  Account lock check:                           |
|  SELECT locked_until FROM users WHERE email=?  |
|  locked_until > NOW? -> 423 Locked             |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CREDENTIAL VALIDATION                         |
|  - Find user by email (prepared stmt)          |
|  - bcrypt.compare(password, hash)              |
|  - On fail:                                    |
|      bruteForceService.recordFail(ip)          |
|      users.failed_login_count++                |
|      If count >= 5: locked_until = NOW+15min   |
|      401 Invalid credentials                   |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RESET FAIL COUNTER                           |
|  UPDATE users SET failed_login_count=0,        |
|  locked_until=NULL                             |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  TOKEN ISSUANCE                                |
|                                                |
|  Access Token:                                 |
|  - JWT, RS256 keypair                          |
|  - Payload: { sub, jti, iat, exp, role }       |
|  - Expiry: 15 minutes                          |
|                                                |
|  Refresh Token:                                |
|  - 64-byte random hex (opaque, not JWT)        |
|  - Stored as SHA-256 hash in DB                |
|  - family_id = UUIDv4 (for rotation tracking) |
|  - Expiry: 30 days                             |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RESPONSE                                      |
|  Body: { accessToken }                         |
|  Set-Cookie: refreshToken=<value>              |
|    httpOnly=true                               |
|    Secure=true                                 |
|    SameSite=Strict                             |
|    Path=/api/auth/refresh                      |
|    MaxAge=30d                                  |
+--------------------------------------------------+

================== TOKEN REFRESH ==================

POST /api/auth/refresh
    |
    v
+--------------------------------------------------+
|  Read refreshToken from httpOnly cookie        |
|  Hash it: SHA-256(rawToken)                    |
|  SELECT * FROM refresh_tokens                  |
|  WHERE token_hash = ?                          |
|                                                |
|  Not found?           -> 401                   |
|  Expired?             -> 401 + delete row      |
|  is_used = 1?         -> REPLAY ATTACK!        |
|                          Revoke ENTIRE family  |
|                          (delete all rows with |
|                          same family_id)       |
|                          -> 401                |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  TOKEN ROTATION                                |
|  1. Mark current token: is_used = 1            |
|  2. Issue new access token (15min)             |
|  3. Issue new refresh token (30d, same family) |
|  4. Insert new refresh token to DB             |
|  200 { accessToken } + new cookie             |
+--------------------------------------------------+

================== LOGOUT ==================

POST /api/auth/logout
    |
    v
+--------------------------------------------------+
|  1. Extract JTI from access token              |
|  2. INSERT INTO token_blacklist (jti, exp)     |
|  3. DELETE FROM refresh_tokens                 |
|     WHERE token_hash = SHA256(cookie)          |
|  4. Clear refreshToken cookie                  |
|  5. Audit log: 'logout'                        |
|  204 No Content                                |
+--------------------------------------------------+
```

---

## 6. FILE SHARING FLOW

Sharing is strictly between authenticated and authorized users only.
No public links. No unauthenticated access under any circumstances.

```
================== CREATE A SHARE ==================

Owner: POST /api/shares
Body: {
  fileId: "uuid",
  recipientEmail: "friend@example.com",
  permission: "view" | "download",
  expiresInDays: 7          <- optional, default 7, max 90
}
    |
    v
+--------------------------------------------------+
|  AUTH CHECK                                    |
|  Verify Bearer token (same middleware)         |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  OWNERSHIP CHECK                               |
|  SELECT user_id FROM files WHERE id = fileId  |
|  file.user_id != req.userId -> 403             |
|  file.is_deleted = 1         -> 404            |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RECIPIENT LOOKUP                              |
|  SELECT id FROM users                          |
|  WHERE email = recipientEmail                  |
|  Not found -> 404 "User not found"             |
|  recipient.id == req.userId -> 400             |
|  "Cannot share with yourself"                  |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  DUPLICATE SHARE CHECK                        |
|  SELECT id FROM file_shares                    |
|  WHERE file_id = ? AND recipient_id = ?        |
|  AND is_revoked = 0 AND expires_at > NOW       |
|  If active share exists: 409 "Already shared  |
|  with this user. Revoke first to re-share."   |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CREATE SHARE RECORD                          |
|  INSERT INTO file_shares:                      |
|  - id = UUIDv4                                 |
|  - file_id, owner_id, recipient_id            |
|  - permission ('view' or 'download')           |
|  - expires_at = NOW + expiresInDays            |
|  - is_revoked = 0                              |
|  - created_at                                  |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CACHE INVALIDATE                              |
|  Invalidate shared-with-me cache              |
|  for recipient:                                |
|  node-cache.del(`shared:${recipientId}`)       |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  AUDIT LOG (async)                             |
|  event: 'share_created'                        |
|  owner_id, file_id, recipient_id, permission   |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RESPONSE 201                                  |
|  { shareId, fileId, recipientEmail,            |
|    permission, expiresAt, createdAt }          |
+--------------------------------------------------+


================== RECIPIENT VIEWS SHARED FILES ==================

Recipient: GET /api/shares/with-me
    |
    v
+--------------------------------------------------+
|  AUTH CHECK (Bearer token required)            |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CACHE CHECK                                   |
|  node-cache.get(`shared:${req.userId}`)        |
|  HIT  -> return cached list                    |
|  MISS -> query DB                              |
|                                                |
|  SELECT fs.*, f.original_filename,             |
|         f.mime_type, f.original_size_bytes,    |
|         u.email as owner_email                 |
|  FROM file_shares fs                           |
|  JOIN files f ON fs.file_id = f.id             |
|  JOIN users u ON fs.owner_id = u.id            |
|  WHERE fs.recipient_id = req.userId            |
|  AND fs.is_revoked = 0                         |
|  AND fs.expires_at > NOW                       |
|  AND f.is_deleted = 0                          |
|                                                |
|  Cache result TTL=60s                          |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  RESPONSE 200                                  |
|  { shares: [                                   |
|    { shareId, fileId, filename, mimeType,      |
|      size, ownerEmail, permission, expiresAt } |
|  ] }                                           |
+--------------------------------------------------+


================== RECIPIENT DOWNLOADS SHARED FILE ==================

Recipient: GET /api/shares/:shareId/download
    |
    v
+--------------------------------------------------+
|  AUTH CHECK (Bearer token required)            |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  SHARE VALIDATION                              |
|  SELECT * FROM file_shares fs                  |
|  JOIN files f ON fs.file_id = f.id             |
|  WHERE fs.id = shareId                         |
|                                                |
|  Share not found?          -> 404              |
|  fs.recipient_id != userId -> 403              |
|  fs.is_revoked = 1         -> 403 "Revoked"   |
|  fs.expires_at <= NOW      -> 403 "Expired"   |
|  f.is_deleted = 1          -> 404              |
|  fs.permission = 'view'?   -> 403 "View only" |
|    (for view-only: serve preview instead)      |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  DOWNLOAD PIPELINE                             |
|  Identical to owner download flow from         |
|  DECRYPT step onward                           |
|  (file retrieved using file owner's key)       |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  AUDIT LOG (async)                             |
|  event: 'shared_file_download'                 |
|  recipient_id, file_id, share_id, ip           |
+--------------------------------------------------+


================== REVOKE A SHARE ==================

Owner: DELETE /api/shares/:shareId
    |
    v
+--------------------------------------------------+
|  AUTH CHECK (Bearer token required)            |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  OWNERSHIP CHECK                               |
|  SELECT owner_id FROM file_shares              |
|  WHERE id = shareId                            |
|  owner_id != req.userId -> 403                 |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  REVOKE                                        |
|  UPDATE file_shares SET is_revoked = 1,        |
|  revoked_at = NOW WHERE id = shareId           |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  CACHE INVALIDATE                              |
|  node-cache.del(`shared:${recipientId}`)       |
+--------------------------------------------------+
    |
    v
+--------------------------------------------------+
|  AUDIT LOG + RESPONSE 204                     |
|  event: 'share_revoked'                        |
+--------------------------------------------------+


================== PERMISSION MODEL ==================

  permission = 'view':
    - Recipient can see file metadata in their shared list
    - Recipient can request an in-browser preview (future: /preview endpoint)
    - Recipient CANNOT download the file
    - All download attempts return 403

  permission = 'download':
    - Recipient can see file metadata
    - Recipient can download the full decrypted original file
    - Recipient CANNOT re-share the file to others
    - Recipient CANNOT delete the file

  Owner retains:
    - Full control at all times
    - Can revoke any share at any point
    - Can delete the file (automatically invalidates all shares)
    - Can see who has access (GET /api/shares?fileId=<id>)

  Admin can:
    - List all shares across all users via /api/shares/all
    - Revoke any share
    - Audit all share events in audit_log
```

---

## 7. BACKUP FLOW

```
CRON SCHEDULER (node-cron)
  DB backup:    Every day  at 02:00 AM  (BACKUP_CRON_DB)
  Files backup: Every Sunday at 03:00 AM (BACKUP_CRON_FILES)
       |
       v
+--------------------------------------------------+
|  BACKUP SERVICE TRIGGERED                      |
|  - Acquire file lock (prevent concurrent runs) |
|  - Log: audit 'backup_start' event             |
|  - Record started_at timestamp                 |
+--------------------------------------------------+
       |
       +------------------+-----------------------+
       |                  |
       v                  v
+--------------+  +---------------------------+
| DB BACKUP    |  | FILES BACKUP              |
|              |  |                           |
| 1. PRAGMA    |  | 1. Build tar stream of    |
|    wal_      |  |    data/uploads/ dir      |
|    checkpoint|  |    (all encrypted files)  |
|    TRUNCATE  |  | 2. Pipe through           |
| 2. fs.copy   |  |    zstd.compress(level=3) |
|    database  |  | 3. Write to:             |
|    .sqlite   |  |    backups/files/         |
|    ->        |  |    files-YYYYMMDD.tar.zst |
|    backups/  |  | (files already encrypted  |
|    db/       |  |  on disk — archive is     |
|    db-DATE   |  |  safe even if backup disk |
|    .sqlite   |  |  is stolen)               |
+--------------+  +---------------------------+
       |                  |
       +------------------+
                 |
                 v
+--------------------------------------------------+
|  INTEGRITY VERIFICATION                        |
|  For each new backup file:                     |
|  - SHA-256 checksum computed                   |
|  - INSERT INTO backup_manifest:               |
|    { filename, filepath, sha256,               |
|      size_bytes, started_at,                  |
|      completed_at, duration_ms, status }       |
|  - Also write/update backup_manifest.json      |
|    (human-readable, outside DB)                |
+--------------------------------------------------+
                 |
                 v
+--------------------------------------------------+
|  BACKUP ROTATION                               |
|  list all files in backups/db/ sorted by date  |
|  if count > BACKUP_KEEP_COUNT (default 7):     |
|    delete oldest files + remove from manifest  |
|  same for backups/files/                       |
+--------------------------------------------------+
                 |
                 v
+--------------------------------------------------+
|  COMPLETION LOG                                |
|  - audit event: 'backup_complete'              |
|  - duration_ms, backup sizes, file counts      |
|  - On ANY error: 'backup_failed' + stack       |
|  - Health endpoint reads last backup timestamp |
|    and alerts if age > BACKUP_WARNING_AGE_HOURS|
+--------------------------------------------------+


================== RECOVERY PROCEDURE ==================

Manual recovery via CLI scripts:

  1. Restore database:
     node scripts/restore-db.js --file backups/db/db-20260304.sqlite
     -> Verifies SHA-256 against manifest
     -> Copies to data/database.sqlite (backup of current DB first)
     -> Runs migrate.js to apply any pending migrations

  2. Restore files:
     node scripts/restore-files.js --file backups/files/files-20260304.tar.zst
     -> Verifies SHA-256 against manifest
     -> Extracts to data/uploads/ (existing files preserved by default)
     -> Use --overwrite flag to replace existing files

  3. Verify backups:
     node scripts/verify-backup.js
     -> Recomputes SHA-256 of every file in backups/
     -> Compares against backup_manifest.json
     -> Prints PASS/FAIL for each file
```

---

## 8. DATABASE SCHEMA

```sql
-- ============================================================
-- RUN AT CONNECTION TIME (config/db.js)
-- ============================================================
-- ============================================================
-- RUN AT CONNECTION TIME — config/db.js (singleton module)
-- Only one connection is ever opened. All models import it.
-- ============================================================
PRAGMA journal_mode = WAL;       -- WAL: concurrent reads, one writer
PRAGMA synchronous  = NORMAL;    -- Durable enough, faster than FULL
PRAGMA foreign_keys = ON;        -- Enforce all FK constraints
PRAGMA temp_store   = MEMORY;    -- Temp tables stay in RAM
PRAGMA cache_size   = -8000;     -- 8MB shared page cache
PRAGMA busy_timeout = 5000;      -- Wait 5000ms on SQLITE_BUSY
                                 -- MUST be set after journal_mode

-- ============================================================
-- MIGRATION 001: CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                  TEXT    PRIMARY KEY,       -- UUIDv4
    email               TEXT    NOT NULL UNIQUE,
    password_hash       TEXT    NOT NULL,          -- bcrypt, rounds=12
    role                TEXT    NOT NULL DEFAULT 'user'
                        CHECK(role IN ('admin','user')),
    storage_quota       INTEGER NOT NULL DEFAULT 10737418240, -- 10GB
    storage_used        INTEGER NOT NULL DEFAULT 0,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        INTEGER,                   -- Unix ms, NULL = not locked
    created_at          INTEGER NOT NULL,          -- Unix ms
    updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    id                      TEXT    PRIMARY KEY,   -- UUIDv4 (also disk filename base)
    user_id                 TEXT    NOT NULL
                            REFERENCES users(id) ON DELETE CASCADE,
    original_filename       TEXT    NOT NULL,      -- User-visible name (sanitized)
    stored_filename         TEXT    NOT NULL UNIQUE, -- <uuid>.enc or <uuid>.enc.zst
    mime_type               TEXT    NOT NULL,      -- Detected via magic bytes
    original_size_bytes     INTEGER NOT NULL,
    compressed_size_bytes   INTEGER,               -- NULL until compression complete
    compression_algorithm   TEXT,                  -- 'zstd' | 'none' | NULL = pending
    compression_status      TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(compression_status IN
                                  ('pending','compressed','skipped','error')),
    encryption_iv           TEXT    NOT NULL,      -- hex 16 bytes
    encryption_auth_tag     TEXT    NOT NULL,      -- hex 16 bytes (GCM tag)
    is_deleted              INTEGER NOT NULL DEFAULT 0,
    created_at              INTEGER NOT NULL,
    updated_at              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_user     ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted  ON files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_comp     ON files(compression_status);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT    PRIMARY KEY,               -- UUIDv4
    user_id     TEXT    NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT    NOT NULL UNIQUE,           -- SHA-256 of raw token
    family_id   TEXT    NOT NULL,                  -- rotation family
    is_used     INTEGER NOT NULL DEFAULT 0,        -- 1 = rotated, detect replay
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rt_user    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_family  ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS token_blacklist (
    jti         TEXT    PRIMARY KEY,               -- JWT jti claim
    user_id     TEXT    NOT NULL,
    revoked_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL                   -- for TTL purging
);

CREATE INDEX IF NOT EXISTS idx_bl_expires ON token_blacklist(expires_at);

-- ============================================================
-- MIGRATION 002: AUDIT + BACKUP
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT    NOT NULL,
    -- AUTH:   login_success | login_fail | logout | register
    --         token_refresh | account_locked
    -- FILES:  file_upload | file_download | file_delete
    -- SHARES: share_created | share_revoked | shared_file_download
    -- BACKUP: backup_start | backup_complete | backup_failed
    -- SYSTEM: server_start | server_stop
    user_id     TEXT,                              -- NULL for unauthed events
    file_id     TEXT,
    ip_address  TEXT    NOT NULL,
    user_agent  TEXT,
    metadata    TEXT,                              -- JSON extra context
    timestamp   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event     ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_file      ON audit_log(file_id);

CREATE TABLE IF NOT EXISTS backup_manifest (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type     TEXT    NOT NULL CHECK(backup_type IN ('db','files')),
    filename        TEXT    NOT NULL,
    filepath        TEXT    NOT NULL,
    sha256_checksum TEXT    NOT NULL,
    size_bytes      INTEGER NOT NULL,
    started_at      INTEGER NOT NULL,
    completed_at    INTEGER NOT NULL,
    duration_ms     INTEGER NOT NULL,
    status          TEXT    NOT NULL CHECK(status IN ('success','failed')),
    error_message   TEXT
);

-- ============================================================
-- MIGRATION 003: SHARING
-- ============================================================

CREATE TABLE IF NOT EXISTS file_shares (
    id              TEXT    PRIMARY KEY,           -- UUIDv4
    file_id         TEXT    NOT NULL
                    REFERENCES files(id) ON DELETE CASCADE,
    owner_id        TEXT    NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    TEXT    NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    permission      TEXT    NOT NULL
                    CHECK(permission IN ('view','download')),
    is_revoked      INTEGER NOT NULL DEFAULT 0,
    revoked_at      INTEGER,                       -- NULL if not revoked
    expires_at      INTEGER NOT NULL,              -- Unix ms
    created_at      INTEGER NOT NULL,

    -- Prevent duplicate active shares for same file+recipient
    UNIQUE(file_id, recipient_id)
    -- Note: unique constraint is on (file_id, recipient_id) only.
    -- Revoke the old one before creating a new share to the same person.
);

CREATE INDEX IF NOT EXISTS idx_shares_file      ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_owner     ON file_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_recipient ON file_shares(recipient_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires   ON file_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_shares_revoked   ON file_shares(is_revoked);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INTEGER PRIMARY KEY,
    applied_at  INTEGER NOT NULL
);

-- ============================================================
-- MIGRATION 004: COMPRESSION TASK QUEUE + ABUSE PROTECTION
-- ============================================================

CREATE TABLE IF NOT EXISTS compression_tasks (
    file_id         TEXT    PRIMARY KEY
                    REFERENCES files(id) ON DELETE CASCADE,
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN
                      ('pending','processing','done','skipped','error')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at INTEGER,           -- Unix ms
    error_message   TEXT,
    created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ct_status ON compression_tasks(status);

-- users.status column (email verification / suspension)
-- Run: ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
-- CHECK(status IN ('active','unverified','suspended'))

-- Optional (internet deployments with email verification):
CREATE TABLE IF NOT EXISTS verification_tokens (
    id          TEXT    PRIMARY KEY,   -- UUIDv4
    user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT    NOT NULL UNIQUE,
    expires_at  INTEGER NOT NULL
);
```

---

## 9. API ENDPOINT REFERENCE

```
BASE URL: https://<nas-ip>:443/api
All endpoints: HTTPS only. HTTP returns 301 redirect.

=================================================================
AUTH  (/api/auth)
=================================================================
POST   /register
  Rate limit: 5/hour/IP
  Body:    { email, password }
  Returns: 201 { userId, email }

POST   /login
  Rate limit: 10 attempts/15min/IP
  Body:    { email, password }
  Returns: 200 { accessToken }
           Cookie: refreshToken (httpOnly, Secure)

POST   /logout
  Auth:    Bearer
  Returns: 204

POST   /refresh
  Cookie:  refreshToken
  Returns: 200 { accessToken }
           Cookie: new refreshToken

GET    /me
  Auth:    Bearer
  Returns: 200 { id, email, role, storageUsed, storageQuota }

GET    /csrf-token
  Returns: 200 { csrfToken }

=================================================================
FILES  (/api/files)     — all require Bearer auth
=================================================================
GET    /
  Query:   ?page=1&limit=50&sort=created_at&order=desc
  Cache:   node-cache TTL=60s key=files:{userId}:{query}
  Returns: 200 { files: [...], total, page, pages }

POST   /upload
  CSRF:    required
  Body:    multipart/form-data { file: binary }
  Returns: 201 { id, filename, size, mimeType, createdAt }

GET    /:fileId/metadata
  Cache:   node-cache TTL=300s key=file:{fileId}
  Returns: 200 { id, filename, mimeType, originalSize,
                 compressedSize, compressionStatus, createdAt }

GET    /:fileId/download
  Headers: ETag, Last-Modified, Cache-Control: private
  Returns: 200 <file stream>  or  304 Not Modified

DELETE /:fileId
  CSRF:    required
  Action:  Soft delete DB + queue physical file deletion
  Returns: 204

=================================================================
SHARES  (/api/shares)   — all require Bearer auth
=================================================================
POST   /
  CSRF:    required
  Body:    { fileId, recipientEmail, permission, expiresInDays }
  Returns: 201 { shareId, fileId, recipientEmail,
                 permission, expiresAt, createdAt }

GET    /my-shares
  Query:   ?fileId=<uuid>  (optional filter)
  Returns: 200 { shares: [{ shareId, fileId, filename,
                  recipientEmail, permission, expiresAt,
                  isRevoked, createdAt }] }

GET    /with-me
  Cache:   node-cache TTL=60s key=shared:{userId}
  Returns: 200 { shares: [{ shareId, fileId, filename,
                  mimeType, size, ownerEmail,
                  permission, expiresAt }] }

GET    /:shareId/download
  Validates: auth + share ownership + permission='download'
  Returns: 200 <file stream>  (same pipeline as /files/:id/download)

DELETE /:shareId
  CSRF:    required
  Action:  Sets is_revoked=1 (owner or admin only)
  Returns: 204

=================================================================
BACKUP  (/api/backup)   — admin role required
=================================================================
POST   /trigger
  CSRF:    required
  Body:    { type: 'db' | 'files' | 'all' }
  Returns: 202 { message: 'Backup queued' }

GET    /list
  Returns: 200 { backups: [...backup_manifest records] }

GET    /:backupId/verify
  Action:  Recomputes SHA-256 vs stored checksum
  Returns: 200 { valid: true | false, expected, actual }

=================================================================
HEALTH  (/api/health)
=================================================================
GET    /
  Auth:    Bearer (any role)
  Returns: 200 {
    status: 'ok' | 'degraded' | 'error',
    uptime_seconds,
    db:     { size_bytes, connection },
    disk:   { uploads_size_bytes, free_bytes, free_percent },
    backup: { last_db_backup, last_files_backup,
              age_hours, status },
    cache:  { entries, lru_size_bytes },
    compression_queue: { pending, worker_alive },
    memory: { rss_bytes, heap_used_bytes }
  }
```

---

## 10. CACHING STRATEGY

```
=================================================================
LAYER         | TOOL       | KEY                    | TTL
=================================================================
File list     | node-cache | files:{uid}:{query}    | 60s
File metadata | node-cache | file:{fileId}          | 300s
Shared-w-me   | node-cache | shared:{uid}           | 60s
Stream buffer | lru-cache  | stream:{fileId}        | LRU eviction
                            (files <= 5MB only,       max 80MB
                             skips large files)
HTTP response | Axios      | ETag + If-None-Match   | private 1hr
Static assets | Browser    | content-hash filenames | 1 year immutable
=================================================================

CACHE INVALIDATION EVENTS:
  File upload    -> del files:{userId}:*
  File delete    -> del files:{userId}:* AND file:{fileId}
                    AND stream:{fileId}
  Compress done  -> del file:{fileId}   (size metadata changed)
  Share created  -> del shared:{recipientId}
  Share revoked  -> del shared:{recipientId}
  Quota updated  -> (no cache needed, read from DB on next /me)
```

---

## 11. COMPRESSION PIPELINE

```
=================================================================
COMPRESS ORDER (CRITICAL — must be in this sequence):
  plaintext -> COMPRESS -> ENCRYPT -> write to disk
  disk      -> DECRYPT  -> DECOMPRESS -> stream to client

  Reason: AES-GCM ciphertext is high-entropy (near-random).
  Compressing after encryption produces 0% gain.
  Always compress FIRST, encrypt SECOND.
=================================================================

MIME TYPE DECISIONS:
  COMPRESS (zstd level 3):
    text/*, application/json, application/xml,
    application/pdf, application/msword,
    application/vnd.openxmlformats-officedocument.*,
    image/png, image/bmp, image/tiff, image/svg+xml,
    audio/wav, audio/flac, audio/aiff

  SKIP (already compressed, ratio would be >= 0.95):
    video/*, image/jpeg, image/webp, image/gif,
    audio/mpeg (mp3), audio/ogg,
    application/zip, application/gzip,
    application/x-7z-compressed, application/x-rar-compressed,
    application/x-tar (if gzipped)

WORKER DESIGN:
  compressionQueue.js  (main thread)
    - Polls compression_tasks table every 5s for 'pending' tasks
    - Atomically claims tasks by setting status='processing'
    - On server startup: resets stuck 'processing' tasks -> 'pending'
    - Max 3 retry attempts per task before leaving as 'error'
    - Spawns compressionWorker.js as a worker_thread
    - On worker exit/crash: auto-respawn
    - Task queue is persistent in SQLite (survives server restarts)

  compressionWorker.js  (worker_thread)
    - Receives { fileId, encPath, mimeType, userId } via postMessage
    - STREAMING PIPELINE: read -> decrypt -> compress -> re-encrypt -> write
    - Memory usage: ~64-256 KB of stream buffers regardless of file size
    - Plaintext bytes exist only transiently in pipeline
    - Plaintext is NEVER written to disk
    - Ratio check after write: if > 0.95, discard and keep original
    - Never touches network, DB connections, or file system outside uploads dir
```

---

## 12. SECURITY CHECKLIST

```
TRANSPORT
  [ ] TLS 1.2 minimum, TLS 1.0/1.1 disabled
  [ ] Self-signed cert with SAN = LAN IP (not just CN)
  [ ] HSTS: max-age=31536000
  [ ] No plaintext HTTP listener (or strict 301 redirect)
  [ ] Cert file permissions: 600 (key), 644 (cert)

HEADERS (helmet)
  [ ] Content-Security-Policy (no unsafe-inline for scripts)
  [ ] X-Content-Type-Options: nosniff
  [ ] X-Frame-Options: DENY
  [ ] Referrer-Policy: no-referrer
  [ ] Permissions-Policy: camera=(), microphone=(), geolocation=()
  [ ] Cache-Control: no-store on API JSON responses
  [ ] Server + X-Powered-By headers removed

AUTHENTICATION
  [ ] RS256 JWT (asymmetric — verify key cannot forge tokens)
  [ ] Access token TTL = 15 minutes
  [ ] JTI blacklist checked on every request (prepared stmt)
  [ ] Refresh token stored as SHA-256 hash only (raw never in DB)
  [ ] Refresh token rotation with replay detection (revoke family)
  [ ] Refresh token in httpOnly + Secure + SameSite=Strict cookie
  [ ] bcrypt rounds = 12 minimum
  [ ] Password: min 12 chars
  [ ] Brute force: 10 attempts/15min per IP -> 429
  [ ] Account lockout: 5 failures -> locked 15min
  [ ] Logout blacklists JTI + deletes refresh token

INPUT VALIDATION
  [ ] ALL DB queries use parameterized prepared statements
  [ ] File MIME verified via magic bytes (NOT file extension alone)
  [ ] Filename sanitized: basename, no null bytes, no ../, max 255 chars
  [ ] Files stored on disk as UUIDv4 names (zero info leakage)
  [ ] JSON body max 10kb
  [ ] Multipart max configurable (default 5GB)
  [ ] CSRF token required on all POST/DELETE

OUTPUT
  [ ] Error responses never include stack traces in production
  [ ] File downloads use Content-Disposition: attachment
  [ ] nosniff on all file responses
  [ ] Filenames in Content-Disposition are sanitized and quoted

ENCRYPTION AT REST
  [ ] AES-256-GCM — authenticated encryption (detects tampering)
  [ ] Random 16-byte IV per file (never reused)
  [ ] Per-file key: HKDF(MASTER_KEY, fileId) — no shared key
  [ ] GCM auth tag verified on every decrypt (500 if mismatch)
  [ ] Plaintext NEVER written to disk (temp file encrypted immediately)
  [ ] MASTER_KEY only in env var, never in code or DB
  [ ] Disk filenames are UUIDs only — no file content metadata

SHARING SECURITY
  [ ] No unauthenticated share access under any circumstance
  [ ] Share access requires valid Bearer token (full auth)
  [ ] Ownership verified before share creation (IDOR prevention)
  [ ] Recipient must be a registered user (no external emails)
  [ ] Cannot share with yourself
  [ ] Expired shares rejected at time of access (not just creation)
  [ ] Revoked shares rejected immediately
  [ ] view-only shares cannot download
  [ ] Recipients cannot re-share
  [ ] File deletion cascades to all shares (DB foreign key)
  [ ] Every share action recorded in audit_log

API SURFACE
  [ ] Global rate limit: 200 req/15min/IP
  [ ] Per-endpoint limits on sensitive routes
  [ ] File list filtered by authenticated user_id (no IDOR)
  [ ] File download validates owner OR valid active share
  [ ] Admin endpoints require role='admin' claim in JWT
  [ ] Pagination max 100 per page enforced

OPERATIONAL
  [ ] .env, certs/, data/, backups/, logs/ all in .gitignore
  [ ] Node.js runs as non-root user
  [ ] Graceful shutdown drains in-flight uploads
  [ ] Compression worker auto-restarts on crash
  [ ] Token blacklist + refresh token TTL purge runs nightly
  [ ] Access token stored in React memory only (NOT localStorage)
  [ ] Axios interceptor handles 401: refresh -> retry -> logout
```

---

## 13. ENVIRONMENT VARIABLES

```bash
# ======================================================
# backend/.env  (NEVER commit this file)
# ======================================================

# Server
NODE_ENV=production
PORT=443
HOST=0.0.0.0

# TLS
TLS_CERT_PATH=./certs/server.crt
TLS_KEY_PATH=./certs/server.key

# JWT (RS256 keypair — generate with scripts/generate-keys.js)
JWT_PRIVATE_KEY_PATH=./certs/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./certs/jwt-public.pem
JWT_ACCESS_TOKEN_EXPIRY=900            # 15 minutes in seconds
JWT_REFRESH_TOKEN_EXPIRY_DAYS=30

# Encryption
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_MASTER_KEY=<64-hex-chars>

# Database
DB_PATH=./data/database.sqlite

# Storage
UPLOADS_DIR=./data/uploads
MAX_FILE_SIZE_BYTES=5368709120         # 5GB
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf,text/plain,text/csv,application/json,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_GLOBAL_MAX=200
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_UPLOAD_MAX=20
ACCOUNT_LOCKOUT_THRESHOLD=5
ACCOUNT_LOCKOUT_DURATION_MS=900000

# CSRF
CSRF_SECRET=<random-32-char-string>
CSRF_COOKIE_NAME=__Host-csrf

# Caching
FILE_LIST_CACHE_TTL_SECONDS=60
FILE_METADATA_CACHE_TTL_SECONDS=300
STREAM_CACHE_MAX_BYTES=83886080        # 80MB LRU
STREAM_CACHE_MAX_FILE_BYTES=5242880    # Only cache files <= 5MB

# Compression
COMPRESSION_ZSTD_LEVEL=3
COMPRESSION_MIN_RATIO=0.95
COMPRESSION_SKIP_MIME=video/mp4,video/webm,image/jpeg,image/webp,image/gif,application/zip,application/gzip,audio/mpeg

# Backup
BACKUP_DIR=./backups
BACKUP_ENABLED=true
BACKUP_CRON_DB=0 2 * * *              # Daily 02:00
BACKUP_CRON_FILES=0 3 * * 0           # Weekly Sunday 03:00
BACKUP_KEEP_COUNT=7
BACKUP_WARNING_AGE_HOURS=26
BACKUP_ERROR_AGE_HOURS=50

# Sharing
SHARE_DEFAULT_EXPIRY_DAYS=7
SHARE_MAX_EXPIRY_DAYS=90

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE_BYTES=52428800           # 50MB rotation

# CORS
CORS_ORIGINS=https://192.168.1.100,https://localhost:5173

# ======================================================
# New in Version 3.0
# ======================================================

# Public internet deployment
TRUST_PROXY=true                       # Set when behind Nginx/Caddy

# CORS (explicit origins, no wildcards)
CORS_CREDENTIALS=true                  # Required for cookie-based refresh tokens

# Abuse protection — upload limits
UPLOAD_MAX_DAILY=100                   # Max uploads per user per day
UPLOAD_MAX_HOURLY=20                   # Max uploads per user per hour
UPLOAD_MAX_FILES_TOTAL=10000          # Max total files per user account

# Disk space safety
DISK_MIN_FREE_BYTES=10737418240       # 10GB minimum free space; 507 if below

# Email verification (for public deployments)
EMAIL_VERIFICATION_REQUIRED=false      # true when open to internet users
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourapp.com
SMTP_PASS=<smtp-password>
SMTP_FROM="Pvt Cloud <noreply@yourapp.com>"
VERIFICATION_TOKEN_EXPIRY_HOURS=24

# Range requests
RANGE_REQUEST_ENABLED=true            # Set false to disable 206 responses

# Node memory cap (2GB VM)
# Add to start script: NODE_OPTIONS=--max-old-space-size=512

# ======================================================
# frontend/.env
# ======================================================
VITE_API_BASE_URL=https://192.168.1.x:443/api
```

---

## 14. LIBRARY REFERENCE

```
=================================================================
BACKEND DEPENDENCIES
=================================================================
express                     HTTP server framework
express-async-errors        Async error propagation in Express
helmet                      Security headers (CSP, HSTS, nosniff...)
express-rate-limit          Per-IP rate limiting middleware
cors                        CORS policy middleware
csrf-csrf                   CSRF double-submit cookie pattern
bcrypt                      Password hashing (rounds=12)
jsonwebtoken                JWT sign/verify (RS256)
better-sqlite3              Synchronous SQLite driver
multer                      Multipart file upload handling
file-type                   Magic bytes MIME detection (use v18 for CJS)
uuid                        UUIDv4 generation
@mongodb-js/zstd            zstd streaming compress/decompress (native C)
                            Required — Node.js has NO built-in zstd support
                            Provides createCompressStream() + createDecompressStream()
                            Compatible with stream.pipeline() and pipe()
                            Compiled via node-gyp — requires Python during npm install
node-cache                  In-memory TTL cache
lru-cache                   LRU in-memory cache
node-cron                   Cron-style job scheduling
pino                        Structured JSON logger
dotenv                      .env file loading
express-validator           Input validation middleware
nodemailer                  Email sending (verification) — optional
                            Only needed if EMAIL_VERIFICATION_REQUIRED=true

Node.js built-ins used:
  crypto                    AES-256-GCM, HKDF, SHA-256, random bytes
  worker_threads            Background compression worker
  fs / fs.promises          File I/O
  path                      Safe path resolution
  http / https              Server creation

=================================================================
FRONTEND DEPENDENCIES
=================================================================
react                       UI framework
react-dom                   DOM renderer
react-router-dom v6         Client-side routing
axios                       HTTP client with interceptors
@tanstack/react-query       Server state, caching, background refetch

FRONTEND DEV DEPENDENCIES
vite                        Build tool
@vitejs/plugin-react        React fast refresh
eslint + plugins            Linting
```

---

## 15. NAS TRANSITION GUIDE

When Ethernet is connected and NAS is ready:

```
Step 1: Update backend/.env
  UPLOADS_DIR=/mnt/nas/pvt-cloud/uploads
  BACKUP_DIR=/mnt/nas-backup/pvt-cloud-backups   <- different disk

Step 2: Update frontend/.env
  VITE_API_BASE_URL=https://192.168.1.<nas-ip>:443/api

Step 3: Update CORS
  CORS_ORIGINS=https://192.168.1.<nas-ip>

Step 4: Regenerate TLS cert with correct LAN IP as SAN
  node scripts/generate-cert.js --ip 192.168.1.<nas-ip>

Step 5: Move existing data (if any)
  cp -r old-uploads/ /mnt/nas/pvt-cloud/uploads/

Zero code changes required.
The NAS path is purely configuration.
```

---

## 16. PUBLIC INTERNET DEPLOYMENT

When the platform moves from LAN-only to internet-accessible, place a reverse proxy in front of Node.js.

```
INTERNET -> CDN/Edge (Cloudflare) -> Nginx/Caddy (TLS, rate limit) -> Node.js (localhost only)
         -> SQLite | NAS filesystem | Redis (future)

Nginx upstream config:
  upstream backend { server 127.0.0.1:3001; keepalive 64; }

app.set('trust proxy', 1)  <- required so req.ip shows real client IP
NODE_ENV=production         <- that is the only code-level change needed
```

---

## 17. CORS CONFIGURATION

```javascript
// app.js — explicit CORS, no wildcards with credentials
const allowedOrigins = process.env.CORS_ORIGINS.split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Disposition', 'Content-Range', 'ETag'],
  maxAge: 86400
}));
// Refresh token cookie: SameSite=Strict (LAN), SameSite=None (internet)
```

---

## 18. ABUSE PROTECTION (PUBLIC DEPLOYMENTS)

```
1. EMAIL VERIFICATION
   Register -> status='unverified' -> email link -> status='active'
   Login blocked if status='unverified'
   Endpoint: GET /api/auth/verify?token=<rawToken>
   Resend: POST /api/auth/resend-verification (3/hour/email)

2. UPLOAD RATE LIMITS (middleware/uploadAbuse.js)
   UPLOAD_MAX_DAILY=100  / UPLOAD_MAX_HOURLY=20  / UPLOAD_MAX_FILES_TOTAL=10000
   If exceeded: 429 { error: "Upload limit reached", resetsAt }

3. DISK SPACE SAFETY (middleware/diskSafety.js)
   Before upload: fs.promises.statfs(UPLOADS_DIR)
   freeBytes < DISK_MIN_FREE_BYTES -> 507 Insufficient Storage
   uploadSize > freeBytes - threshold -> 507
```

---

## 19. HTTP RANGE REQUEST SUPPORT

```
GET /api/files/:fileId/download
Range: bytes=1048576-5242880

Server pipeline:
  1. Auth + ownership check
  2. Parse Range header -> [start, end] or 416 if invalid
  3. Full decrypt + decompress stream (must process from byte 0)
  4. Byte-range transform stream: skip `start` bytes, take `end-start+1`
  5. Response: 206 Partial Content
               Content-Range: bytes start-end/totalSize
               Content-Length: end-start+1
               Accept-Ranges: bytes (always included)

NOTE: AES-256-GCM requires full-stream decryption before any bytes
can be cryptographically verified. Partial GCM tag verification is
not possible — this is a fundamental property of authenticated encryption.
```

---

## 20. PERSISTENT COMPRESSION JOB QUEUE

```sql
-- compression_tasks table (see Migration 004 in Section 8)
-- status: 'pending' | 'processing' | 'done' | 'skipped' | 'error'
-- max 3 attempts before leaving as 'error'

-- On startup: reset stuck 'processing' -> 'pending'
UPDATE compression_tasks SET status='pending' WHERE status='processing';

-- Worker polls every 5s:
SELECT file_id FROM compression_tasks
WHERE status='pending' AND attempts < 3
ORDER BY created_at ASC LIMIT 1;

-- On upload: INSERT INTO compression_tasks (file_id, status, created_at)
--            instead of in-memory enqueue

-- Health endpoint includes:
-- compression_queue: { pending, processing, done, error, worker_alive }
```

---

## 21. BACKUP POLICY

```
DAILY   (02:00): SQLite snapshot -> backups/db/db-YYYYMMDD.sqlite
                 Retention: last 7 (BACKUP_KEEP_COUNT=7)
WEEKLY  (Sun 03:00): tar of uploads/ -> zstd -> backups/files/files-YYYYMMDD.tar.zst
                 Retention: last 4

OFFSITE: rsync to USB / second NAS / cloud bucket (S3, B2, R2)
         Files on disk are already AES-encrypted — safe to store offsite.
         MASTER_KEY must NEVER be in backup archives. Store separately.

INTEGRITY: SHA-256 checksum per file stored in backup_manifest table
           AND backups/backup_manifest.json
           Verify: node scripts/verify-backup.js
```

---

## 22. REDIS / KAFKA FUTURE PATH

```
Redis (when to add):
  Multiple Node instances need shared cache/rate limits/session data
  Libraries: ioredis, rate-limit-redis, bullmq (BullMQ replaces SQLite queue)
  Migration effort: LOW for cache/rate-limit, MEDIUM for queues

Kafka (when to add):
  Platform splits into microservices needing an event bus
  Migration effort: HIGH — requires full microservice decomposition
  Not recommended until Phase 3 infrastructure scaling

Current decision: Neither Redis nor Kafka is used.
SQLite WAL + node-cache + in-memory counters handle all current load.
```

---

## 23. STORAGE SCALABILITY ROADMAP

```
Phase 1 (current): Local NAS filesystem
  fs.createReadStream / fs.createWriteStream
  data/uploads/<userId>/<uuid>.enc[.zst]

Phase 2: S3-compatible (MinIO on NAS or separate node)
  aws-sdk v3: s3Client.putObject / getObject
  Change: storageService.js only
  All encryption/auth logic unchanged

Phase 3: Distributed (Ceph, AWS S3, Cloudflare R2)
  Identical API as Phase 2 (AWS SDK compatible)
  No application code changes beyond storageService.js
```

---

## 24. INFRASTRUCTURE SCALABILITY ROADMAP

```
Phase 1: Single NAS
  Node.js + SQLite + local filesystem

Phase 2: Small VPS cluster
  Nginx -> Node.js cluster (PM2) -> PostgreSQL + Redis + MinIO
  SQLite -> PostgreSQL: swap driver, queries unchanged (standard SQL)

Phase 3: Large scale
  CDN -> Load balancer -> Upload/Download/Auth microservices
  Kafka event bus, PostgreSQL replicas, Ceph/S3 storage cluster
  Compression worker pool (auto-scale, BullMQ-driven)

DESIGN PRINCIPLE:
  All phase upgrades touch only:
    config/db.js          (DB driver swap)
    services/storageService.js  (storage backend swap)
    services/cacheService.js    (cache backend swap)
  Controllers, routes, middleware, security layers: unchanged.
```

---

## 25. ARCHITECTURE DECISIONS

```
DECISION: Compress BEFORE encrypting (never after)
  Ciphertext is high-entropy random data — compression produces 0% gain.
  Pipeline must always be: plaintext -> compress -> encrypt -> disk.

DECISION: Per-file encryption key via HKDF
  HKDF(MASTER_KEY, fileId, ...) means each file has a unique derived key.
  Compromise of one key does not expose any other file.
  Only the MASTER_KEY needs protecting — it's never stored in DB.

DECISION: Soft deletes on files table
  is_deleted=1 marks record as deleted. File removed from disk immediately.
  Enables future recycle bin feature with zero schema changes.
  All share queries include AND f.is_deleted=0 to prevent ghost access.

DECISION: No public share links
  Every file access — including via shares — requires a valid JWT.
  Eliminates an entire class of unauthenticated access risks.
  Recipients must have an account on this server.

DECISION: Refresh token stored as hash
  Raw refresh token is never stored. SHA-256(rawToken) in DB.
  If DB is compromised, attacker cannot use the tokens without the raw values.

DECISION: RS256 (asymmetric) JWT signing
  Private key signs, public key verifies.
  If public key is exposed (e.g., in frontend), it cannot forge tokens.
  HMAC (HS256) shared secret can forge tokens if exposed.

DECISION: better-sqlite3 (synchronous)
  SQLite is local disk — microsecond latency. Sync API eliminates
  async/callback complexity. Prepared statements cached at module level
  means zero query parsing overhead after startup.

DECISION: Access token in React memory (not localStorage)
  localStorage is accessible by any JS on the page (XSS risk).
  Memory token is lost on page refresh, but Axios interceptor
  automatically calls /auth/refresh (using httpOnly cookie) on 401,
  seamlessly restoring the session. No UX impact, major security gain.

DECISION: Per-user upload subdirectories
  data/uploads/<userId>/ means cross-user file collision is
  structurally impossible at the filesystem level, not just DB level.
  Also makes per-user disk usage calculation trivial (du -sh).

DECISION: Worker thread for compression
  Compression is CPU-bound. Running it in the main Express thread
  would block all other requests during large file compression.
  worker_threads isolates it completely. Crash in worker does not
  crash the server — the compressionQueue.js auto-respawns it.
```

---

*This document represents the complete architecture of the Pvt Cloud Storage Platform v3.0.*
*Read this before touching any code. Every file, table, endpoint, and flow is mapped above.*

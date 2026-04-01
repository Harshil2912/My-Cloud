# NAS Cloud Server v3.0

A private cloud file server designed for LAN (with optional internet exposure). Files are stored encrypted (AES-256-GCM), compressed with zstd, and served over HTTPS with JWT RS256 authentication.

---

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full v3.0 design document.

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Python 3** and **C++ build tools** (`node-gyp` dependency for `@mongodb-js/zstd`, `better-sqlite3`, `bcrypt`)
  - Windows: `npm install --global windows-build-tools` or install Visual Studio Build Tools
  - Ubuntu/Debian: `sudo apt install build-essential python3`

### 1. Generate TLS Certificate

```bash
cd backend
node src/scripts/generate-cert.js 192.168.1.100   # replace with your LAN IP
```

### 2. Generate JWT Keypair

```bash
node src/scripts/generate-keys.js
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env — set ENCRYPTION_MASTER_KEY (64 hex chars) and other values
```

Generate a master key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Install Dependencies & Start Backend

```bash
cd backend
npm install
npm start
```

The server runs at `https://0.0.0.0:3443` by default.

### 5. Install Dependencies & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173`.

For local development, make sure `backend/.env` includes `http://localhost:5173`
in `CORS_ORIGINS`.

---

## Project Structure

```
nas-cloud/
├── backend/
│   ├── src/
│   │   ├── config/        # db, env, tls, constants, rateLimitConfig
│   │   ├── controllers/   # auth, file, share, backup, health
│   │   ├── middleware/    # authenticate, csrf, rateLimit, fileValidator, diskSafety, uploadAbuse...
│   │   ├── migrations/    # 001–004 SQL migration files
│   │   ├── models/        # userModel, fileModel, tokenModel, auditModel, shareModel, backupModel
│   │   ├── routes/        # index, auth, files, shares, backup, health, csrf
│   │   ├── scripts/       # migrate, restore-db, restore-files, verify-backup, generate-cert, generate-keys
│   │   ├── services/      # encryption, compression, cache, audit, auth, storage, email, share, backup...
│   │   ├── utils/         # logger, idGenerator, checksum, etag, pathSanitizer, timeUtils, dbRetry
│   │   ├── workers/       # compressionWorker, compressionQueue
│   │   ├── app.js         # Express factory
│   │   └── server.js      # HTTPS entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # axiosClient, authApi, filesApi, sharesApi, healthApi
│   │   ├── components/    # layout/, files/, shares/, ui/
│   │   ├── context/       # AuthContext
│   │   ├── hooks/         # useFiles, useShares, useUpload
│   │   ├── pages/         # Login, Register, Dashboard, Upload, SharedWithMe, Health
│   │   ├── utils/         # formatBytes, formatDate
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── certs/                 # Generated TLS + JWT keys (gitignored)
├── data/                  # SQLite DB + uploaded files (gitignored)
├── backups/               # Backup archives (gitignored)
├── logs/                  # Application logs (gitignored)
├── .gitignore
└── README.md
```

---

## Security Notes

- **ENCRYPTION_MASTER_KEY** must be kept secret and backed up — losing it means losing all files.
- **certs/** is gitignored. Back up your `jwt-private.pem` and TLS key separately.
- **data/** and **backups/** are gitignored. Configure offsite backup for `backups/`.
- Rate limiting, CSRF protection, helmet headers, and brute-force lockout are all enabled by default.
- For internet exposure, put Nginx or Caddy in front and set `TRUST_PROXY=1` in `.env`.

---

## Backup & Restore

```bash
# Verify backup integrity
npm run verify-backup

# Restore database from snapshot
npm run restore-db 2024-01-15_db_snapshot.sqlite

# Restore file archive
npm run restore-files 2024-01-14_files_archive.tar.zst
```

---

## License

Private use only.

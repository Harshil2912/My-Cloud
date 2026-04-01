const { Document, Packer, Paragraph, Table, TableCell, TableRow, BorderStyle, WidthType, TextRun, HeadingLevel, AlignmentType, VerticalAlign, UnderlineType } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [
    {
      children: [
        // TITLE PAGE
        new Paragraph({
          text: 'MY CLOUD',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          bold: true,
          size: 64,
        }),
        new Paragraph({
          text: 'Enterprise-Grade Cloud Storage with End-to-End Encryption',
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          italics: true,
          size: 32,
        }),
        new Paragraph({
          text: 'Complete Technical Documentation',
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          size: 28,
        }),
        new Paragraph({
          text: 'Security • Compression • Architecture',
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          size: 24,
        }),
        new Paragraph({
          text: `Generated: ${new Date().toLocaleDateString()}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 1000 },
          italics: true,
        }),

        // TABLE OF CONTENTS
        new Paragraph({
          text: 'TABLE OF CONTENTS',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          text: '1. Project Overview',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '2. Security Architecture',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '3. Compression System',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '4. Complete Data Flow',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '5. System Architecture',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '6. Security Principles & Checklist',
          spacing: { after: 600 },
        }),

        // SECTION 1: PROJECT OVERVIEW
        new Paragraph({
          text: 'SECTION 1: PROJECT OVERVIEW',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          text: 'What is MY Cloud?',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'MY Cloud is a private, enterprise-grade cloud storage system designed to protect sensitive data with military-grade cryptography while optimizing storage efficiency through intelligent compression.',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Key Features:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• End-to-end AES-256-GCM encryption for all files at rest',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• RS256 JWT authentication with automated token rotation',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Intelligent gzip compression with streaming pipeline',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Role-based file sharing with expiring tokens',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• CSRF protection, rate limiting, and brute-force defense',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Comprehensive audit logging and system health monitoring',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Technology Stack:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• Frontend: React 18 + Vite 5.4.21 (SPA with dark/light theme)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Backend: Node.js + Express.js (12+ API endpoints)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Database: SQLite (single-file, serverless, audited)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Security: AES-256-GCM, HKDF key derivation, RS256 JWT',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Storage: Local filesystem (Phase 1), upgradeable to MinIO/S3 (Phase 2)',
          spacing: { after: 200 },
        }),

        // SECTION 2: SECURITY ARCHITECTURE
        new Paragraph({
          text: 'SECTION 2: SECURITY ARCHITECTURE',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),

        new Paragraph({
          text: '2.1 Encryption Pipeline (AES-256-GCM)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Problem: Storing files in plaintext exposes them to disk tampering, theft, or unauthorized access.',
          spacing: { after: 100 },
          italics: true,
        }),
        new Paragraph({
          text: 'Solution: Streaming encryption where plaintext is NEVER written to disk.',
          spacing: { after: 200 },
          bold: true,
        }),
        new Paragraph({
          text: 'Encryption Algorithm: AES-256-GCM',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• Mode: Galois/Counter Mode (authenticated encryption)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Key Length: 256 bits (32 bytes) - military-grade strength',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• IV (Initialization Vector): 16 random bytes per file',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Auth Tag: 16-byte proof of encryption integrity (prevents tampering)',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Key Derivation with HKDF:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: 'Instead of using one master key for all files, MY Cloud derives a UNIQUE key for each file:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'key = HKDF-SHA256(MASTER_KEY, fileId, context="file-enc", length=32)',
          spacing: { after: 100 },
          bold: true,
        }),
        new Paragraph({
          text: 'Benefits:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '• If master key is compromised, attacker cannot decrypt all files (must derive each)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Each file gets deterministic but unique encryption',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• HKDF is cryptographically sound (uses SHA256 internally)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Upload Encryption Flow:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '1. User uploads file via HTTPS (encrypted in transit)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. Server generates random 16-byte IV',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. Derive file-specific key: HKDF(MASTER_KEY, fileId, "file-enc")',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Create AES-256-GCM cipher with key + IV',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. Stream file → cipher → disk (plaintext never touches disk)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '6. Extract 16-byte auth_tag after encryption',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '7. Store in database: encryption_iv, encryption_auth_tag, stored_filename (UUID)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Download Decryption Flow:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '1. Client authenticates with valid JWT token',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. Server checks share permissions (if file is shared)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. Read encrypted file from disk',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Create decipher using stored IV + auth_tag (verifies integrity)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. Stream: encrypted_file → decipher → plaintext',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '6. Send plaintext to client OVER HTTPS (double encryption)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Why Streaming Architecture?',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• A 5 GB file uses only 64-256 KB of RAM (constant memory footprint)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Plaintext NEVER touches disk - only encrypted blocks flow through memory',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Prevents memory exhaustion attacks and disk forensics',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.2 Authentication (RS256 JWT + Refresh Token Rotation)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'JWT (JSON Web Token) Structure:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: 'Header: { "alg": "RS256", "typ": "JWT" }',
          spacing: { after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: 'Payload: { "sub": "user123", "email": "user@example.com", "role": "user", "jti": "uuid", "exp": timestamp }',
          spacing: { after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: 'Signature: RSASSA-PKCS1-v1_5(privateKey, base64(header+payload))',
          spacing: { after: 200 },
          bold: true,
        }),

        new Paragraph({
          text: 'Token Lifetimes:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• Access Token: 15 minutes (short-lived, frequent rotation)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Refresh Token: 30 days (long-lived, stored securely in database)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Token Rotation & Refresh Family:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: 'MY Cloud implements family-based token rotation to detect and prevent token theft:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '1. User logs in → issues Access Token (15 min) + Refresh Token (30 days, familyId=UUID)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. Access Token expires → Client sends Refresh Token',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. Server verifies: Does Refresh Token hash match DB? Is it in valid family? Not used before?',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. If valid: Mark old token used, issue NEW Refresh Token with SAME familyId',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. If invalid/reused: Entire family is INVALIDATED (user must re-login)',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Benefit: If attacker steals a Refresh Token, they can only use it once before detection.\\n On next refresh, both user and attacker see the same family is invalidated → immediate lockout.',
          spacing: { after: 200 },
          italics: true,
        }),

        new Paragraph({
          text: 'Logout & Token Revocation:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '1. User clicks "Sign Out" → POST /api/auth/logout with Access Token',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. Server extracts JTI (JWT ID) from token',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. INSERT INTO token_blacklist (jti, revoked_at, expires_at)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Future requests with this JTI are rejected (even if signature is valid)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. Blacklist entries auto-delete after token expiry (cleanup)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.3 CSRF Protection (Cross-Site Request Forgery)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Problem: Attacker\'s website tricks your browser into making unauthorized requests.',
          spacing: { after: 100 },
          italics: true,
        }),
        new Paragraph({
          text: 'Example Attack (without CSRF token):',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '1. You login to MY Cloud in Tab A',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. You open attacker.com in Tab B (without closing Tab A)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. attacker.com contains hidden: <form action="https://mycloud.com/api/files/delete" method="POST">',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Browser automatically sends your JWT cookie → DELETE succeeds',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'MY Cloud Solution:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '1. GET /api/csrf-token → Server generates 32-byte random token, stores in session',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. Client saves in localStorage',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. POST /api/files/upload with header: X-CSRF-Token: <token>',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Server validates: Does token match session? Yes → Allow',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. attacker.com CANNOT read your localStorage (Same-Origin Policy) → token missing → request rejected',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.4 Rate Limiting & Brute Force Protection',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Global Rate Limit:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• 100 requests per 15 minutes per IP',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Applies to all endpoints',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Prevents DoS attacks',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Login Rate Limit (Aggressive):',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• 5 failed attempts per 30 minutes per IP',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• After 5 failures: Account locked for 30 minutes',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Prevents brute-force password attacks',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Upload Rate Limit:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• 10 uploads per minute per user',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Prevents storage/bandwidth abuse',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Abuse Detection:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• 5 failed downloads per minute → Logged as suspicious',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Admin reviews audit logs for attack patterns',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.5 Request Validation & Security Middleware',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Every request passes through a security middleware stack:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '1. requestSize: Max payload 5 MB (prevents memory exhaustion)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. fileValidator: MIME type whitelist (blocks .exe, .bat files)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. csrfProtection: Validate X-CSRF-Token on mutations',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. authenticate: Verify JWT is valid + not blacklisted',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. diskSafety: Validate file paths don\'t escape sandbox (prevents ../ traversal)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '6. securityHeaders: Set CSP, X-Frame-Options, X-Content-Type-Options',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Result: Layered defense prevents multiple attack vectors',
          spacing: { after: 200 },
          bold: true,
        }),

        // SECTION 3: COMPRESSION
        new Paragraph({
          text: 'SECTION 3: COMPRESSION SYSTEM',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),

        new Paragraph({
          text: '3.1 Why Compression?',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Storage Optimization Statistics:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• Text files (CSV, JSON, logs): 50-80% size reduction',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Documents (PDF, DOCX): 30-60% reduction',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Images (PNG, WEBP): Already compressed → skip (0% gain)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Videos (MP4, MOV): Already compressed → skip (0% gain)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.2 Compression Algorithm: Gzip',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Algorithm: Gzip (DEFLATE + CRC32 checksum)',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• Compression Level: 6 (default, good balance of speed/compression)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Uses: LZ77 dictionary compression + Huffman encoding',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Cross-platform: Works on Linux, macOS, Windows',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.3 Streaming Compression Pipeline',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Compression runs in a WORKER THREAD (separate from main Express server):',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: 'Step 1: Read encrypted file from disk (streaming)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Step 2: Decrypt (AES-256-GCM) using stored IV + auth_tag',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  → At this point: plaintext appears in memory buffer (64 KB chunks only)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Step 3: Compress with Gzip (level 6)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  → Plaintext is fed directly to gzip stream (never written to disk)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Step 4: Re-encrypt with NEW IV + NEW auth_tag',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  → Fresh encryption for security (different from original)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Step 5: Write compressed+encrypted file to disk',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  → Result: filename.enc.zst (stored on disk)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Memory Usage:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '5 GB file = ~64-256 KB of RAM (constant)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Why? Streaming processes 64 KB chunks at a time',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Entire file is NEVER loaded into memory',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.4 Smart Skipping Logic',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Before compression, system checks MIME type:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: 'SKIP COMPRESSION (already compressed formats):',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '• Video: MP4, WebM, QuickTime, AVI',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Audio: MP3, OGG, FLAC',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Image: JPEG, PNG, WebP, GIF',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Archive: ZIP, GZIP, 7Z, RAR, TAR',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'DO COMPRESS (text-based/structured formats):',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '• Text: TXT, CSV, JSON, HTML, XML, LOG',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• Documents: PDF, DOCX, XLSX, PPTX',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.5 Compression Ratio Threshold',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'After compression, system evaluates if it\'s worth keeping:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Ratio = compressedSize / originalSize',
          spacing: { after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: 'If Ratio > 0.95 (95%): DISCARD compression',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Example: 10 MB → 9.8 MB (only 2% saved)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Cost: Re-encryption overhead + latency',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Benefit: 200 KB saved',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Decision: NOT WORTH IT → Mark as \'skipped\'',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'If Ratio ≤ 0.95 (≤95%): KEEP compression',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Example: 10 MB → 2.5 MB (75% saved)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Benefit: 7.5 MB saved ✓',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Update database with: stored_filename, compression_algorithm=\'gzip\', compressed_size_bytes',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.6 Compression Queue & Worker Threads',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Workflow:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '1. User uploads file → compression_tasks table: INSERT status=\'pending\'',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '2. compressionQueue polls every 5 seconds',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '3. SELECT from compression_tasks WHERE status=\'pending\' AND attempts < 3',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '4. Spawn worker_thread with file details',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '5. Worker processes (may take seconds to minutes depending on file size)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '6. Worker reports result: { fileId, status, savedBytes }',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '7. UPDATE compression_tasks SET status=\'done\' OR status=\'skipped\' OR retry',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Possible outcomes after processing:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: '• status=\'done\': Successfully compressed',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• status=\'skipped\': MIME already compressed OR ratio > 95%',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '• status=\'error\': Failed after 3 attempts',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  → files table: compression_status=\'error\' for UI visibility',
          spacing: { after: 200 },
        }),

        // SECTION 4: DATA FLOW
        new Paragraph({
          text: 'SECTION 4: COMPLETE DATA FLOW',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),

        new Paragraph({
          text: '4.1 User Upload Flow',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Client → Select file from device',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         Validate: size < 5 GB, MIME type allowed',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         POST /api/files/upload with file stream + JWT token + CSRF token',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Server → Security middleware chain:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         ✓ requestSize check',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         ✓ authenticate (verify JWT)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         ✓ csrfProtection (validate token)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         ✓ fileValidator (MIME whitelist)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '       Generate file metadata:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - fileId = UUID',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - IV = random 16 bytes',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - key = HKDF(MASTER_KEY, fileId, "file-enc")',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '       Encrypt & save:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - Stream: file → AES-256-GCM → disk as "uuid.enc"',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - Extract auth_tag after encryption',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '       Store in DB (files table):',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - id, user_id, original_filename, stored_filename',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - encryption_iv, encryption_auth_tag',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - mime_type, original_size_bytes',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - compression_status = \'pending\' ← IMPORTANT',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '       Queue compression:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - INSERT INTO compression_tasks: file_id, status=\'pending\', attempts=0',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Client → Receive: 201 { fileId, uploadedAt }',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         Show "Upload complete! Compressing in background..."',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '4.2 Background Compression Flow',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Every 5 seconds:',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'compressionQueue polls → SELECT compression_tasks WHERE status=\'pending\' LIMIT 1',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: 'Found → Spawn worker_thread with: { fileId, encPath, userId }',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Worker (separate thread):',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Check MIME type:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  IF MP4/PNG/ZIP → mark compression_status=\'skipped\', done',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'IF compressible:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  1. Read encrypted file (streamed)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  2. Decrypt: AES-256-GCM (using stored IV + auth_tag)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  3. Compress: Gzip (level 6)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  4. Re-encrypt: AES-256-GCM (NEW IV + NEW auth_tag)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  5. Write to disk: filename.enc.zst',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Check ratio: compressedSize / originalSize',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  IF ratio > 0.95 → Discard, mark \'skipped\'',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  ELSE → Keep, update DB:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - stored_filename = filename.enc.zst',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - compression_status = \'compressed\'',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - compression_algorithm = \'gzip\'',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - compressed_size_bytes = new size',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - encryption_iv = newIV (hex)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '    - encryption_auth_tag = newAuthTag (hex)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'IF error:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  - attempts++, status=\'pending\' (retry)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  - compression_status = \'error\' (user sees error in UI)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '4.3 User Download Flow',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Client → Click "Download" button',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         GET /api/files/{fileId}/download + JWT token',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Server → Authenticate + authorize',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         Query files table: Get stored_filename, compression_status, encryption_iv, auth_tag',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         Check: Does user own file OR have valid share link?',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '         Stream file from disk to response:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         1. Read encrypted file',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         2. IF compression_status=\'compressed\': createGunzip() stream',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         3. Decrypt: AES-256-GCM (using stored IV + auth_tag)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         4. Pipeline: encrypted → decompressed → decrypted → plaintext to client',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '         Set response headers:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - Content-Type: original MIME type',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         - Content-Disposition: attachment; filename="originalname"',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Client → Browser downloads file (decrypted + decompressed)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         User can open in any application (Word, Excel, image viewer, etc)',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '4.4 File Sharing Flow',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Owner → Click "Share" button on file',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '        Enters recipient email + expiry date (max 90 days)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '        POST /api/shares/create',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Server → Generate share_token = random 64-byte hex string',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '         INSERT INTO shares: file_id, recipient_email, share_token, expires_at',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Recipient → Receives email with share link:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '             https://mycloud.com/share/{share_token}',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: '             (No authentication required for share links)',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'GET /share/{share_token} → Server:',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  1. lookup: SELECT * FROM shares WHERE share_token = ?',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  2. Check: Is expires_at > now? (is link still valid?)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  3. If valid: Download file using standard decryption pipeline',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '  4. If expired: Show 404 "Share link has expired"',
          spacing: { after: 200 },
        }),

        // SECTION 5: SYSTEM ARCHITECTURE
        new Paragraph({
          text: 'SECTION 5: SYSTEM ARCHITECTURE DIAGRAM',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),

        new Paragraph({
          text: 'Component Overview:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 100 },
        }),

        // Create architecture table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Component')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Purpose')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Technology')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Frontend')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('User interface, file management, settings')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('React 18 + Vite 5.4.21')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Backend')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('API endpoints, business logic')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Node.js + Express.js')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Database')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('User data, files metadata, audit logs')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('SQLite (serverless)')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Storage')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Encrypted files')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Local filesystem (upgradeable to S3)')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Worker Threads')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Background compression')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Node.js worker_threads')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
          ],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        }),

        new Paragraph({
          text: 'Database Schema (Key Tables):',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'users',
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: '• id (UUID) - primary key',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• email (string) - unique',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• password_hash (string) - bcrypt hashed',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• role (enum: user | admin)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• storage_quota (bytes)',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'files',
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: '• id (UUID)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• user_id (FK → users)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• original_filename (string)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• stored_filename (UUID, encrypted on disk)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• mime_type (string)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• original_size_bytes (integer)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• compression_status (enum: pending | compressed | skipped | error)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• compression_algorithm (string: gzip | zstd | none)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• compressed_size_bytes (integer, if compressed)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• encryption_iv (hex string, 16 bytes)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• encryption_auth_tag (hex string, 16 bytes)',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'compression_tasks',
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: '• id (UUID)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• file_id (FK → files)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• status (enum: pending | processing | done | skipped | error)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• attempts (integer, max 3)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• error_message (string, if failed)',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'tokens',
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: '• id (UUID)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• user_id (FK → users)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• tokenHash (SHA256 hash)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• familyId (UUID for rotation family)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• used_at (timestamp, null until used)',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'token_blacklist',
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 50 },
          bold: true,
        }),
        new Paragraph({
          text: '• jti (string, JWT ID)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• user_id (FK → users)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• revoked_at (timestamp)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• expires_at (timestamp, auto-delete after)',
          spacing: { after: 100 },
        }),

        // SECTION 6: SECURITY CHECKLIST
        new Paragraph({
          text: 'SECTION 6: SECURITY PRINCIPLES & CHECKLIST',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),

        new Paragraph({
          text: 'Core Security Principles:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 100 },
        }),

        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Principle')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Implementation')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Benefit')],
                  shading: { fill: 'CCCCCC' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Zero-Knowledge')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Server never accesses plaintext')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Even server breach doesn\'t expose data')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Defense in Depth')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Multiple middleware layers')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('No single point of failure')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Per-File Encryption')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('HKDF derives unique key per file')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Isolates damage if key compromised')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Streaming Processing')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Constant memory regardless of file size')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Prevents OOM exhaustion attacks')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Token Rotation')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Refresh tokens in families with reuse detection')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph('Invalidates stolen tokens quickly')],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
          ],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        }),

        new Paragraph({
          text: '\n',
        }),

        new Paragraph({
          text: 'Security Checklist:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: '✓ Encryption at Rest: AES-256-GCM (military-grade)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Encryption in Transit: HTTPS/TLS 1.2+',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Key Management: HKDF per-file derivation from MASTER_KEY',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Authentication: RS256 JWT with 15-min access tokens',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Session Security: Refresh token rotation + family-based reuse detection',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Token Revocation: Blacklist with auto-expiry cleanup',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ CSRF Protection: Token validation on all mutations (POST/PUT/DELETE)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Brute Force Protection: 5 failed logins = 30-minute lockout',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ DoS Protection: Rate limiting on all endpoints (100 req/15min/IP)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Input Validation: MIME whitelist + path traversal checks',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ XSS Prevention: CSP headers, sanitized outputs',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Compression Efficiency: Smart skip logic + ratio threshold (0.95)',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Audit Logging: All file access + auth events logged with user/timestamp',
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: '✓ Error Handling: No sensitive info leaked in error messages',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Deployment Status:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: '✅ COMPLETED:',
          spacing: { after: 100 },
          bold: true,
        }),
        new Paragraph({
          text: '• Full AES-256-GCM encryption pipeline',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• RS256 JWT authentication with refresh rotation',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• Gzip compression with worker threads',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• Modern React UI with dark/light theme and accent colors',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• Premium SaaS dashboard design (glass cards, neon accents)',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• File sharing with expiring tokens',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• System health monitoring and audit logging',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: '🚀 READY FOR:',
          spacing: { after: 100 },
          bold: true,
        }),
        new Paragraph({
          text: '• Production deployment',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• Performance testing under load',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• Penetration testing and security audit',
          spacing: { after: 30 },
        }),
        new Paragraph({
          text: '• User beta testing',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Conclusion:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'MY Cloud is an enterprise-grade cloud storage system built with modern security practices, efficient compression, and a beautiful user interface. The combination of strong encryption (AES-256-GCM), intelligent authentication (RS256 JWT with rotation), and background compression (streaming gzip pipeline) creates a system worthy of handling sensitive data at scale.',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'This project demonstrates that security and performance are not mutually exclusive - with proper architecture (streaming, worker threads, smart skipping), you can encrypt, compress, and store files efficiently while maintaining military-grade security standards.',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: '🏆 This is enterprise-grade infrastructure designed to protect your data like Fort Knox guards gold!',
          spacing: { after: 0 },
          bold: true,
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(
    path.join(__dirname, 'MY_CLOUD_COMPLETE_DOCUMENTATION.docx'),
    buffer
  );
  console.log('✅ DOCX file created successfully!');
  console.log('📄 File: MY_CLOUD_COMPLETE_DOCUMENTATION.docx');
  console.log('📍 Location:', path.join(__dirname, 'MY_CLOUD_COMPLETE_DOCUMENTATION.docx'));
});

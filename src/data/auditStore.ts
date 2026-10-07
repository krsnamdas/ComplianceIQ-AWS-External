/**
 * Server-side audit log store.
 * ---------------------------------------------------------------------------
 * Audit events are persisted to object storage (S3 on the AWS editions, R2 on
 * the Gemini edition — both S3-API compatible) as a single JSON Lines file,
 * encrypted at rest by the bucket's server-side encryption (SSE). When no
 * object store is configured (local dev) it falls back to a local file.
 *
 * The admin panel downloads a readable CSV via the server, which reads the
 * stored file (the bucket transparently decrypts for the app) and converts it.
 * No plaintext audit data is kept in the browser.
 *
 * Server-side only.
 */
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { regionDir, ACTIVE_REGION } from './regionLoader';

// Reuse the same storage-backend resolution as documents: R2 first, then S3.
const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_BUCKET = process.env.R2_BUCKET || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const S3_BUCKET = process.env.DOCUMENTS_BUCKET || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

const USE_R2 = Boolean(R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
const BUCKET = USE_R2 ? R2_BUCKET : S3_BUCKET;

/** Object key for the audit log file (JSON Lines). */
const AUDIT_KEY = `${ACTIVE_REGION}/audit-logs/audit-log.jsonl`;

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    _s3 = USE_R2
      ? new S3Client({
          region: 'auto',
          endpoint: R2_ENDPOINT,
          credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
        })
      : new S3Client({ region: REGION });
  }
  return _s3;
}

export function isAuditS3Backed(): boolean {
  return Boolean(BUCKET);
}

/** Local fallback path for the audit file when no object store is configured. */
function localAuditPath(): string {
  return path.join(regionDir(ACTIVE_REGION), 'audit-logs', 'audit-log.jsonl');
}

export interface AuditEntry {
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  actionType: string;
  targetEntity: string;
  details: string;
}

/** Read the entire current audit log as raw JSONL text (empty string if none). */
async function readRaw(): Promise<string> {
  if (isAuditS3Backed()) {
    try {
      const out = await getS3().send(new GetObjectCommand({ Bucket: BUCKET, Key: AUDIT_KEY }));
      const stream = out.Body as any;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks).toString('utf-8');
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || String(err?.message).includes('NoSuchKey')) return '';
      throw err;
    }
  }
  const p = localAuditPath();
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
  } catch {
    return '';
  }
}

/** Overwrite the audit file with the given raw JSONL text. */
async function writeRaw(raw: string): Promise<void> {
  if (isAuditS3Backed()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: AUDIT_KEY,
        Body: raw,
        ContentType: 'application/x-ndjson',
      })
    );
    return;
  }
  const p = localAuditPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, raw, 'utf-8');
}

/**
 * Append one audit entry. Reads the current file, appends a JSONL line, writes
 * it back. (Object stores have no append; for this app's low event volume a
 * read-modify-write is fine and keeps the file self-contained + encrypted.)
 */
export async function appendAudit(entry: AuditEntry): Promise<void> {
  const line = JSON.stringify(entry);
  const existing = await readRaw();
  const next = existing ? existing + '\n' + line : line;
  await writeRaw(next);
}

/** Parse all stored entries (newest first). */
export async function readAudit(): Promise<AuditEntry[]> {
  const raw = await readRaw();
  if (!raw.trim()) return [];
  const entries = raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l) as AuditEntry; } catch { return null; }
    })
    .filter((e): e is AuditEntry => e !== null);
  return entries.reverse(); // newest first
}

/** Build a readable CSV from all stored entries (for the admin download). */
export async function auditToCsv(): Promise<string> {
  const entries = await readAudit();
  const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Target', 'Details'];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const e of entries) {
    lines.push([
      esc(e.timestamp), esc(e.userName || e.userId), esc(e.userEmail), esc(e.userRole),
      esc(e.actionType), esc(e.targetEntity), esc(e.details),
    ].join(','));
  }
  return lines.join('\n');
}

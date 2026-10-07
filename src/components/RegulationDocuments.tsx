import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  FileText,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Trash2,
  Loader2,
  Paperclip,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

/**
 * RegulationDocuments
 * ---------------------------------------------------------------------------
 * Additive, self-contained "Documents" section rendered inside each regulation
 * card. ALL onboarded (authenticated) users can see the list and download.
 * ONLY admins see the upload control (and the per-document delete).
 *
 * Zero-impact design:
 *   - Fetches lazily (on mount) from the isolated /api/regulations/:id/documents
 *     endpoint. If the backend/feature is unavailable, it fails silently and
 *     renders nothing extra, so no existing card behavior changes.
 *   - Renders NOTHING at all when there are no documents AND the user is not an
 *     admin — so a non-admin viewing a doc-less regulation sees no new UI.
 *   - Styling matches the existing dark slate theme exactly.
 */

interface DocMeta {
  id: string;
  regulationId: string;
  docType: 'regulation' | 'internal';
  displayName: string;
  fileName: string;
  ext: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface RegulationDocumentsProps {
  regulationId: string;
  regulationCode: string;
}

const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx'];
const ALLOWED_ACCEPT = ALLOWED_EXTS.map((e) => `.${e}`).join(',');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 10; // maximum documents attached per regulation
const MAX_MB = MAX_BYTES / (1024 * 1024);

/** Truncate a long display name but always keep the extension, e.g. "Very_long_name….pdf". */
function shortLabel(fileName: string, max = 28): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot > 0 ? fileName.slice(dot) : '';
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  if (base.length <= max) return fileName;
  return `${base.slice(0, max)}…${ext}`;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RegulationDocuments: React.FC<RegulationDocumentsProps> = ({
  regulationId,
  regulationCode,
}) => {
  const { isCurrentUserAdmin, currentUser } = useAdmin();

  const [documents, setDocuments] = useState<DocMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'regulation' | 'internal'>('regulation');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/regulations/${encodeURIComponent(regulationId)}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      }
    } catch {
      // Feature unavailable — fail silently so the card is unaffected.
    } finally {
      setLoaded(true);
    }
  }, [regulationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /** Upload one validated file; returns true on success, false (with error set) otherwise. */
  const uploadOne = async (file: File): Promise<boolean> => {
    const buffer = await file.arrayBuffer();
    const params = new URLSearchParams({
      fileName: file.name,
      docType: pendingType,
      displayName: file.name.replace(/\.[^.]+$/, ''),
      uploadedBy: `${currentUser?.name || 'Admin'}`,
    });
    const res = await fetch(
      `/api/regulations/${encodeURIComponent(regulationId)}/documents?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-content-type': file.type || 'application/octet-stream',
        },
        body: buffer,
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload failed (HTTP ${res.status}).`);
    }
    // NOTE: intentionally NOT calling addAuditLog here. Writing to the admin
    // audit log mutates AdminContext state, which re-renders App and can trip
    // its navigation guards (bouncing the admin out of the console). Document
    // actions therefore do not write the client-side audit log.
    return true;
  };

  /** Handle one or more picked files: validate, enforce the 10-file cap, upload in sequence. */
  const handleFilesPicked = async (files: File[]) => {
    setError(null);
    setSuccessMsg(null);
    if (files.length === 0) return;

    // Enforce the per-regulation count cap (existing + newly picked).
    const remaining = MAX_FILES - documents.length;
    if (remaining <= 0) {
      setError(`Limit reached: a regulation can have at most ${MAX_FILES} documents.`);
      return;
    }
    let toUpload = files;
    let capNote = '';
    if (files.length > remaining) {
      toUpload = files.slice(0, remaining);
      capNote = ` (only ${remaining} of ${files.length} added — ${MAX_FILES}-file limit).`;
    }

    // Validate each file up front; collect rejects rather than aborting the batch.
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const file of toUpload) {
      const ext = (file.name.includes('.') ? file.name.split('.').pop() || '' : '').toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        rejected.push(`${file.name}: unsupported type`);
      } else if (file.size > MAX_BYTES) {
        rejected.push(`${file.name}: exceeds ${MAX_MB}MB`);
      } else {
        valid.push(file);
      }
    }

    setUploading(true);
    let successCount = 0;
    try {
      for (const file of valid) {
        try {
          await uploadOne(file);
          successCount++;
        } catch (err: any) {
          rejected.push(`${file.name}: ${err?.message || 'upload failed'}`);
        }
      }
      await fetchDocuments();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      setSuccessMsg(
        `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully${capNote}`
      );
      window.setTimeout(() => setSuccessMsg(null), 6000);
    }
    if (rejected.length > 0) {
      setError(`Could not upload: ${rejected.join('; ')}.`);
    }
  };

  const handleDelete = async (doc: DocMeta) => {
    if (!window.confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(doc.id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed (HTTP ${res.status}).`);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      // NOTE: no addAuditLog here — see the upload handler note. Mutating the
      // audit log re-renders App and can trip its navigation guards.
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  const handleDownload = (doc: DocMeta) => {
    // Stream through the app (Option A). A hidden anchor triggers the browser save.
    const url = `/api/documents/${encodeURIComponent(doc.id)}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // NOTE: no addAuditLog here — see the upload handler note.
  };

  // Zero-impact: render nothing when there are no docs and the user cannot upload.
  if (loaded && documents.length === 0 && !isCurrentUserAdmin) {
    return null;
  }
  // Also render nothing until the first fetch resolves, to avoid any flash.
  if (!loaded && documents.length === 0 && !isCurrentUserAdmin) {
    return null;
  }

  const typeBadge = (docType: 'regulation' | 'internal') =>
    docType === 'internal' ? (
      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
        Internal
      </span>
    ) : (
      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
        Regulation
      </span>
    );

  const docIcon = (ext: string) =>
    ['xls', 'xlsx', 'csv'].includes(ext) ? (
      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    ) : (
      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
    );

  return (
    <div
      className="mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80"
      // When mounted inside the admin Edit <form>, stop an Enter keypress from
      // bubbling up and submitting that form (which would save + close + navigate).
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Paperclip className="w-3 h-3 text-slate-400" />
          <span>
            Attached Documents
            {documents.length > 0 ? ` (${documents.length}/${MAX_FILES})` : ''}
          </span>
          {isCurrentUserAdmin && (
            // Pale/dull "(optional)" so admins don't feel uploading is required.
            <span className="text-[10px] font-normal normal-case tracking-normal text-slate-600 italic">
              (optional)
            </span>
          )}
        </span>
        {isCurrentUserAdmin && (
          <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Admin upload</span>
          </span>
        )}
      </div>

      {/* Document chips */}
      {documents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {docIcon(doc.ext)}
              {typeBadge(doc.docType)}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownload(doc);
                }}
                className="text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                title={`Download ${doc.fileName} (${humanSize(doc.size)})`}
              >
                <span>{shortLabel(doc.fileName)}</span>
                <Download className="w-3 h-3 text-slate-400 group-hover:text-cyan-300" />
              </button>
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(doc);
                  }}
                  className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete this document (admin)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        isCurrentUserAdmin && (
          <p className="text-[11px] text-slate-500 italic">
            No documents attached yet. Upload a regulation text or internal document (RCM, controls library, etc.).
          </p>
        )
      )}

      {/* Admin-only upload control */}
      {isCurrentUserAdmin && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPendingType('regulation');
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                pendingType === 'regulation'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Regulation
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPendingType('internal');
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                pendingType === 'internal'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              e.stopPropagation();
              const picked = Array.from(e.target.files || []);
              if (picked.length > 0) handleFilesPicked(picked);
            }}
          />
          <button
            type="button"
            disabled={uploading || documents.length >= MAX_FILES}
            onClick={(e) => {
              // This component can be mounted INSIDE an admin <form> (the Edit
              // Regulation modal). Prevent the click from bubbling so it can
              // never trigger the parent form's submit/save+close+navigate.
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title={
              documents.length >= MAX_FILES
                ? `Document limit reached (${MAX_FILES} max)`
                : `Upload one or more ${pendingType} documents (max ${MAX_MB}MB each; up to ${MAX_FILES} per regulation; ${ALLOWED_EXTS.join(', ')})`
            }
          >
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3 h-3" />
                <span>Upload {pendingType === 'internal' ? 'Internal Doc(s)' : 'Regulation Doc(s)'}</span>
              </>
            )}
          </button>

          {error && <span className="text-[11px] text-rose-400">{error}</span>}
          {successMsg && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {successMsg}
            </span>
          )}

          {/* Limits helper text — pale/dull, full-width under the controls. */}
          <p className="w-full text-[10px] text-slate-600 mt-0.5">
            You can select multiple files. Max {MAX_MB}MB per file · up to {MAX_FILES} documents per regulation ·
            allowed: {ALLOWED_EXTS.join(', ')}.
          </p>
        </div>
      )}
    </div>
  );
};

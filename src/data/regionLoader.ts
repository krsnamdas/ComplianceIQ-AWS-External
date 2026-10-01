/**
 * Region-aware data loader.
 * ---------------------------------------------------------------------------
 * Loads regulation (and, in later phases, other feature) data from an external
 * per-region JSON folder — data/regions/<REGION>/ — instead of hardcoded TS
 * arrays. This makes the dataset:
 *   - Editable by admins at runtime (server writes back to the JSON file)
 *   - Portable: swap the region folder (menat -> apac) with no code changes
 *
 * REGION is chosen via the REGION env var (defaults to "menat").
 *
 * Safety: if the JSON file is missing or unreadable, the loader falls back to
 * the legacy in-code arrays so the app never breaks during/after migration.
 *
 * NOTE: This module is server-side only (uses fs). The browser bundle must not
 * import it. The Express server imports it; the Vite client continues to import
 * the legacy arrays until the client is migrated to fetch from the API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Regulation } from '../types/regulatory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ACTIVE_REGION = (process.env.REGION || 'menat').toLowerCase();

/**
 * Resolve the `data/regions` root robustly across all runtime contexts:
 *   1. Explicit `DATA_DIR` env var  — preferred for containers/AWS (points at a
 *      mounted volume so admin edits persist across restarts).
 *   2. Source-relative path         — works in dev via `tsx` (this file lives at
 *      src/data/, so ../../data/regions is the project root).
 *   3. `process.cwd()/data/regions` — works for the bundled prod server
 *      (dist/server.mjs), which runs from the app root where `data/` is copied.
 * The first path that actually exists on disk wins; otherwise we fall back to
 * the cwd-based path (and the loader's in-code fallback covers a missing file).
 */
function resolveRegionsRoot(): string {
  const candidates = [
    process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR, 'regions') : null,
    path.resolve(__dirname, '..', '..', 'data', 'regions'),
    path.resolve(process.cwd(), 'data', 'regions'),
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir)) return dir;
    } catch {
      // ignore and try next
    }
  }
  // Default to the cwd-based location (created on first write if needed).
  return path.resolve(process.cwd(), 'data', 'regions');
}

const REGIONS_ROOT = resolveRegionsRoot();

export function regionDir(region: string = ACTIVE_REGION): string {
  return path.join(REGIONS_ROOT, region);
}

export function regionFilePath(fileName: string, region: string = ACTIVE_REGION): string {
  return path.join(regionDir(region), fileName);
}

/**
 * Generic JSON reader with graceful fallback.
 * Returns the parsed JSON array, or the provided fallback if the file is
 * missing / invalid.
 */
export function loadRegionJSON<T>(fileName: string, fallback: T[]): { data: T[]; source: 'file' | 'fallback'; path: string } {
  const filePath = regionFilePath(fileName);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { data: parsed as T[], source: 'file', path: filePath };
      }
      console.warn(`[regionLoader] ${filePath} is not a JSON array; using fallback.`);
    } else {
      console.info(`[regionLoader] ${filePath} not found; using in-code fallback.`);
    }
  } catch (err: any) {
    console.warn(`[regionLoader] Failed to read ${filePath}: ${err?.message}; using fallback.`);
  }
  return { data: fallback, source: 'fallback', path: filePath };
}

/**
 * Atomically persist a JSON array back to a region file.
 * Writes to a temp file then renames, so a crash mid-write can't corrupt the
 * live data file.
 */
export function saveRegionJSON<T>(fileName: string, data: T[]): { ok: boolean; path: string; error?: string } {
  const filePath = regionFilePath(fileName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
    return { ok: true, path: filePath };
  } catch (err: any) {
    return { ok: false, path: filePath, error: err?.message || String(err) };
  }
}

/**
 * Load the active region's regulations, falling back to the supplied legacy
 * array if the JSON file is not present.
 */
export function loadRegulations(fallback: Regulation[]): { data: Regulation[]; source: 'file' | 'fallback'; path: string } {
  return loadRegionJSON<Regulation>('regulations.json', fallback);
}

export function saveRegulations(data: Regulation[]) {
  return saveRegionJSON<Regulation>('regulations.json', data);
}

// --- Scraper sources ---
export function loadScraperSources<T>(fallback: T[]) {
  return loadRegionJSON<T>('scraper-sources.json', fallback);
}
export function saveScraperSources<T>(data: T[]) {
  return saveRegionJSON<T>('scraper-sources.json', data);
}

// --- News seed ---
export function loadNewsSeed<T>(fallback: T[]) {
  return loadRegionJSON<T>('news-seed.json', fallback);
}
export function saveNewsSeed<T>(data: T[]) {
  return saveRegionJSON<T>('news-seed.json', data);
}

// --- Regional Regulatory Digest updates ---
export function loadDigestUpdates<T>(fallback: T[]) {
  return loadRegionJSON<T>('digest-updates.json', fallback);
}
export function saveDigestUpdates<T>(data: T[]) {
  return saveRegionJSON<T>('digest-updates.json', data);
}

// --- Timeline events ---
export function loadTimeline<T>(fallback: T[]) {
  return loadRegionJSON<T>('timeline.json', fallback);
}
export function saveTimeline<T>(data: T[]) {
  return saveRegionJSON<T>('timeline.json', data);
}

// --- Roadmap milestones ---
export function loadRoadmapMilestones<T>(fallback: T[]) {
  return loadRegionJSON<T>('roadmap-milestones.json', fallback);
}
export function saveRoadmapMilestones<T>(data: T[]) {
  return saveRegionJSON<T>('roadmap-milestones.json', data);
}

/**
 * Read a single JSON OBJECT (not array) region file, e.g. maturity.json which
 * holds { sectors, matrix, countrySummaries }. Falls back to the provided
 * object if missing/invalid.
 */
export function loadRegionObject<T extends object>(fileName: string, fallback: T): { data: T; source: 'file' | 'fallback'; path: string } {
  const filePath = regionFilePath(fileName);
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { data: parsed as T, source: 'file', path: filePath };
      }
    }
  } catch (err: any) {
    console.warn(`[regionLoader] Failed to read object ${filePath}: ${err?.message}; using fallback.`);
  }
  return { data: fallback, source: 'fallback', path: filePath };
}

export function saveRegionObject<T extends object>(fileName: string, data: T): { ok: boolean; path: string; error?: string } {
  const filePath = regionFilePath(fileName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
    return { ok: true, path: filePath };
  } catch (err: any) {
    return { ok: false, path: filePath, error: err?.message || String(err) };
  }
}

// --- Region config (benchmark date + region metadata) ---
export interface RegionConfig {
  regionId: string;
  regionLabel: string;
  /** The 'current date' anchor (YYYY-MM-DD) for deadline / urgency / watchlist calculations. */
  benchmarkDate: string;
  notes?: string;
}

export function loadRegionConfig(fallback: RegionConfig) {
  return loadRegionObject<RegionConfig>('region.config.json', fallback);
}
export function saveRegionConfig(data: RegionConfig) {
  return saveRegionObject<RegionConfig>('region.config.json', data);
}

import Database from 'better-sqlite3';
import type { Release, ReleaseCreate } from '../types';
import { getOrganizationForApp } from './organization-mapper';

let db: Database.Database;

try {
  db = new Database('releases.db');
} catch (error) {
  console.error('Database connection error:', error);
  // Fallback to in-memory database if file fails
  db = new Database(':memory:');
}

// Create releases table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization TEXT NOT NULL,
    appName TEXT NOT NULL,
    platform TEXT NOT NULL,
    version TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT DEFAULT 'In Review',
    tag TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    forceUpdate TEXT DEFAULT 'No',
    additionalData TEXT
  )
`);

// Add status column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE releases ADD COLUMN status TEXT DEFAULT 'In Review'`);
} catch (error) {
  // Column already exists, ignore the error
}

// Add branch column if it doesn't exist (for existing databases that might have buildNumber)
try {
  db.exec(`ALTER TABLE releases ADD COLUMN branch TEXT DEFAULT 'main'`);
} catch (error) {
  // Column already exists, ignore the error
}

// Add tag column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE releases ADD COLUMN tag TEXT DEFAULT 'general-release-untagged'`);
} catch (error) {
  // Column already exists, ignore the error
}

// Add forceUpdate column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE releases ADD COLUMN forceUpdate TEXT DEFAULT 'No'`);
} catch (error) {
  // Column already exists, ignore the error
}

// Migrate buildNumber to branch if buildNumber column exists
try {
  const hasBuildbNumber = db.prepare("PRAGMA table_info(releases)").all().some((col: any) => col.name === 'buildNumber');
  if (hasBuildbNumber) {
    db.exec(`UPDATE releases SET branch = buildNumber WHERE branch IS NULL OR branch = ''`);
  }
} catch (error) {
  // Ignore migration errors
}

export function getAllReleases(): Release[] {
  try {
    const stmt = db.prepare('SELECT * FROM releases ORDER BY uploadDate DESC');
    const releases = stmt.all() as any[];
    
    return releases.map(release => ({
      id: release.id,
      organization: release.organization,
      appName: release.appName,
      platform: release.platform,
      version: release.version,
      branch: release.branch,
      status: release.status || 'In Review',
      tag: release.tag || 'general-release-untagged',
      uploadDate: release.uploadDate,
      forceUpdate: release.forceUpdate || 'No',
      additionalData: release.additionalData ? JSON.parse(release.additionalData) : undefined
    }));
  } catch (error) {
    console.error('Error in getAllReleases:', error);
    throw error;
  }
}

export function getReleaseById(id: number): Release | undefined {
  const stmt = db.prepare('SELECT * FROM releases WHERE id = ?');
  const release = stmt.get(id) as any;
  
  if (!release) return undefined;
  
  return {
    id: release.id,
    organization: release.organization,
    appName: release.appName,
    platform: release.platform,
    version: release.version,
    branch: release.branch,
    status: release.status || 'In Review',
    tag: release.tag || 'general-release-untagged',
    uploadDate: release.uploadDate,
    forceUpdate: release.forceUpdate || 'No',
    additionalData: release.additionalData ? JSON.parse(release.additionalData) : undefined
  };
}

export function createRelease(data: ReleaseCreate): Release {
  // Auto-detect organization if not provided
  const organization = data.organization || getOrganizationForApp(data.appName);
  const uploadDate = data.uploadDate || new Date().toISOString();
  const status = data.status || 'In Review';
  
  const stmt = db.prepare(`
    INSERT INTO releases (organization, appName, platform, version, branch, status, tag, uploadDate, forceUpdate, additionalData)
    VALUES (@organization, @appName, @platform, @version, @branch, @status, @tag, @uploadDate, @forceUpdate, @additionalData)
  `);
  
  const info = stmt.run({
    ...data,
    organization,
    status,
    uploadDate,
    forceUpdate: data.forceUpdate || 'No',
    additionalData: data.additionalData ? JSON.stringify(data.additionalData) : null
  });
  
  return getReleaseById(info.lastInsertRowid as number)!;
}

export function updateRelease(id: number, data: Partial<ReleaseCreate>): Release | undefined {
  const existing = getReleaseById(id);
  if (!existing) return undefined;
  
  const updated = {
    ...existing,
    ...data,
    additionalData: data.additionalData ? JSON.stringify(data.additionalData) : existing.additionalData
  };
  
  const stmt = db.prepare(`
    UPDATE releases
    SET organization = @organization,
        appName = @appName,
        platform = @platform,
        version = @version,
        branch = @branch,
        status = @status,
        tag = @tag,
        uploadDate = @uploadDate,
        forceUpdate = @forceUpdate,
        additionalData = @additionalData
    WHERE id = @id
  `);
  
  stmt.run({
    ...updated,
    additionalData: typeof updated.additionalData === 'string' ? updated.additionalData : JSON.stringify(updated.additionalData)
  });
  
  return getReleaseById(id);
}

export function deleteRelease(id: number): boolean {
  const stmt = db.prepare('DELETE FROM releases WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

export function updateMultipleReleaseStatus(ids: number[], status: string): number {
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`UPDATE releases SET status = ? WHERE id IN (${placeholders})`);
  const info = stmt.run(status, ...ids);
  return info.changes;
}
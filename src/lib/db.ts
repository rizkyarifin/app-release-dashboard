import Database from 'better-sqlite3';
import type { Release, ReleaseCreate, Organization, OrganizationCreate, App, AppCreate } from '../types';
import { getPackageNameForApp } from './package-mapper';

let db: Database.Database;

try {
  db = new Database('releases.db');
} catch (error) {
  console.error('Database connection error:', error);
  // Fallback to in-memory database if file fails
  db = new Database(':memory:');
}

// Create new tables with relationships
db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    packageName TEXT NOT NULL,
    organizationId INTEGER NOT NULL,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(name, organizationId)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appId INTEGER NOT NULL,
    platform TEXT NOT NULL,
    version TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT DEFAULT 'In Review',
    tag TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    forceUpdate TEXT DEFAULT 'No',
    additionalData TEXT,
    FOREIGN KEY (appId) REFERENCES apps(id) ON DELETE CASCADE
  )
`);


// Helper functions for organizations
export function getAllOrganizations(): Organization[] {
  const stmt = db.prepare('SELECT * FROM organizations ORDER BY name ASC');
  return stmt.all() as Organization[];
}

export function getOrganizationById(id: number): Organization | undefined {
  const stmt = db.prepare('SELECT * FROM organizations WHERE id = ?');
  return stmt.get(id) as Organization | undefined;
}

export function createOrganization(data: OrganizationCreate): Organization {
  const stmt = db.prepare('INSERT INTO organizations (name) VALUES (?)');
  const info = stmt.run(data.name);
  return getOrganizationById(info.lastInsertRowid as number)!;
}

// Helper functions for apps
export function getAllApps(): App[] {
  const stmt = db.prepare('SELECT * FROM apps ORDER BY name ASC');
  return stmt.all() as App[];
}

export function getAppById(id: number): App | undefined {
  const stmt = db.prepare('SELECT * FROM apps WHERE id = ?');
  return stmt.get(id) as App | undefined;
}

export function getAppsByOrganization(organizationId: number): App[] {
  const stmt = db.prepare('SELECT * FROM apps WHERE organizationId = ? ORDER BY name ASC');
  return stmt.all(organizationId) as App[];
}

export function createApp(data: AppCreate): App {
  const stmt = db.prepare('INSERT INTO apps (name, packageName, organizationId) VALUES (?, ?, ?)');
  const info = stmt.run(data.name, data.packageName, data.organizationId);
  return getAppById(info.lastInsertRowid as number)!;
}

export function findOrCreateApp(appName: string, organizationId: number): App {
  let app = db.prepare('SELECT * FROM apps WHERE name = ? AND organizationId = ?').get(appName, organizationId) as App | undefined;

  if (!app) {
    const packageName = getPackageNameForApp(appName);
    app = createApp({ name: appName, packageName, organizationId });
  }

  return app;
}

export function findOrCreateOrganization(orgName: string): Organization {
  let org = db.prepare('SELECT * FROM organizations WHERE name = ?').get(orgName) as Organization | undefined;

  if (!org) {
    org = createOrganization({ name: orgName });
  }

  return org;
}

// Release functions with JOIN to get full data
export function getAllReleases(): Release[] {
  try {
    const stmt = db.prepare(`
      SELECT
        r.id, r.appId, r.platform, r.version, r.branch, r.status, r.tag, r.uploadDate, r.forceUpdate, r.additionalData,
        a.id as app_id, a.name as app_name, a.packageName as app_packageName, a.organizationId as app_organizationId,
        o.id as org_id, o.name as org_name
      FROM releases r
      JOIN apps a ON r.appId = a.id
      JOIN organizations o ON a.organizationId = o.id
      ORDER BY r.uploadDate DESC
    `);

    const releases = stmt.all() as any[];

    return releases.map(row => ({
      id: row.id,
      appId: row.appId,
      platform: row.platform,
      version: row.version,
      branch: row.branch,
      status: row.status || 'In Review',
      tag: row.tag || 'general-release-untagged',
      uploadDate: row.uploadDate,
      forceUpdate: row.forceUpdate || 'No',
      additionalData: row.additionalData ? JSON.parse(row.additionalData) : undefined,
      app: {
        id: row.app_id,
        name: row.app_name,
        packageName: row.app_packageName,
        organizationId: row.app_organizationId
      },
      organization: {
        id: row.org_id,
        name: row.org_name
      }
    }));
  } catch (error) {
    console.error('Error in getAllReleases:', error);
    throw error;
  }
}

export function getReleaseById(id: number): Release | undefined {
  try {
    const stmt = db.prepare(`
      SELECT
        r.id, r.appId, r.platform, r.version, r.branch, r.status, r.tag, r.uploadDate, r.forceUpdate, r.additionalData,
        a.id as app_id, a.name as app_name, a.packageName as app_packageName, a.organizationId as app_organizationId,
        o.id as org_id, o.name as org_name
      FROM releases r
      JOIN apps a ON r.appId = a.id
      JOIN organizations o ON a.organizationId = o.id
      WHERE r.id = ?
    `);

    const row = stmt.get(id) as any;

    if (!row) return undefined;

    return {
      id: row.id,
      appId: row.appId,
      platform: row.platform,
      version: row.version,
      branch: row.branch,
      status: row.status || 'In Review',
      tag: row.tag || 'general-release-untagged',
      uploadDate: row.uploadDate,
      forceUpdate: row.forceUpdate || 'No',
      additionalData: row.additionalData ? JSON.parse(row.additionalData) : undefined,
      app: {
        id: row.app_id,
        name: row.app_name,
        packageName: row.app_packageName,
        organizationId: row.app_organizationId
      },
      organization: {
        id: row.org_id,
        name: row.org_name
      }
    };
  } catch (error) {
    console.error('Error in getReleaseById:', error);
    throw error;
  }
}

export function findReleaseByAppVersionPlatform(appId: number, version: string, platform: string): Release | undefined {
  const stmt = db.prepare('SELECT id FROM releases WHERE appId = ? AND version = ? AND platform = ?');
  const row = stmt.get(appId, version, platform) as { id: number } | undefined;
  if (!row) return undefined;
  return getReleaseById(row.id);
}

export function createRelease(data: ReleaseCreate): Release {
  const uploadDate = data.uploadDate || new Date().toISOString();
  const status = data.status || 'In Review';

  // Upsert: check for existing release with same appId + version + platform
  const existing = findReleaseByAppVersionPlatform(data.appId, data.version, data.platform);
  if (existing) {
    return updateRelease(existing.id, {
      branch: data.branch,
      status,
      tag: data.tag,
      uploadDate,
      forceUpdate: data.forceUpdate || 'No',
      additionalData: data.additionalData,
    })!;
  }

  const stmt = db.prepare(`
    INSERT INTO releases (appId, platform, version, branch, status, tag, uploadDate, forceUpdate, additionalData)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.appId,
    data.platform,
    data.version,
    data.branch,
    status,
    data.tag,
    uploadDate,
    data.forceUpdate || 'No',
    data.additionalData ? JSON.stringify(data.additionalData) : null
  );

  return getReleaseById(info.lastInsertRowid as number)!;
}

export function updateRelease(id: number, data: Partial<ReleaseCreate>): Release | undefined {
  const existing = getReleaseById(id);
  if (!existing) return undefined;

  const updated = {
    appId: data.appId ?? existing.appId,
    platform: data.platform ?? existing.platform,
    version: data.version ?? existing.version,
    branch: data.branch ?? existing.branch,
    status: data.status ?? existing.status,
    tag: data.tag ?? existing.tag,
    uploadDate: data.uploadDate ?? existing.uploadDate,
    forceUpdate: data.forceUpdate ?? existing.forceUpdate,
    additionalData: data.additionalData ? JSON.stringify(data.additionalData) : (existing.additionalData ? JSON.stringify(existing.additionalData) : null)
  };

  const stmt = db.prepare(`
    UPDATE releases
    SET appId = ?, platform = ?, version = ?, branch = ?, status = ?, tag = ?, uploadDate = ?, forceUpdate = ?, additionalData = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.appId,
    updated.platform,
    updated.version,
    updated.branch,
    updated.status,
    updated.tag,
    updated.uploadDate,
    updated.forceUpdate,
    updated.additionalData,
    id
  );

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

export function deleteMultipleReleases(ids: number[]): number {
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`DELETE FROM releases WHERE id IN (${placeholders})`);
  const info = stmt.run(...ids);
  return info.changes;
}

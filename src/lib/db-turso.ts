import { createClient } from '@libsql/client/web';
import type { Release, ReleaseCreate, Organization, OrganizationCreate, App, AppCreate } from '../types';
import { getPackageNameForApp } from './package-mapper';

// Turso database client with WebAssembly for serverless
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://app-release-dashboard-rizkyarifin.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
  intMode: 'number'
});

// Initialize the database with the new schema
async function initializeDatabase() {
  try {
    // Create organizations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // Create apps table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        packageName TEXT NOT NULL,
        organizationId INTEGER NOT NULL,
        FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE(name, organizationId)
      )
    `);

    // Create releases table
    await client.execute(`
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

    // Automation job queue (dashboard enqueues, local worker executes).
    await client.execute(`
      CREATE TABLE IF NOT EXISTS automation_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        releaseId INTEGER,
        appId INTEGER,
        packageName TEXT NOT NULL,
        appName TEXT,
        orgName TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        result TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Single-row worker control switch.
    await client.execute(`
      CREATE TABLE IF NOT EXISTS automation_control (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL DEFAULT 0,
        heartbeat TEXT,
        updatedAt TEXT
      )
    `);
    await client.execute({
      sql: `INSERT OR IGNORE INTO automation_control (id, enabled, updatedAt) VALUES (1, 0, ?)`,
      args: [new Date().toISOString()]
    });
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on import
initializeDatabase();

// Helper functions for organizations
export async function getAllOrganizations(): Promise<Organization[]> {
  const result = await client.execute('SELECT * FROM organizations ORDER BY name ASC');
  return result.rows.map(row => ({
    id: row.id as number,
    name: row.name as string
  }));
}

export async function getOrganizationById(id: number): Promise<Organization | undefined> {
  const result = await client.execute({
    sql: 'SELECT * FROM organizations WHERE id = ?',
    args: [id]
  });

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    id: row.id as number,
    name: row.name as string
  };
}

export async function createOrganization(data: OrganizationCreate): Promise<Organization> {
  const result = await client.execute({
    sql: 'INSERT INTO organizations (name) VALUES (?)',
    args: [data.name]
  });

  const org = await getOrganizationById(Number(result.lastInsertRowid));
  if (!org) throw new Error('Failed to create organization');
  return org;
}

// Helper functions for apps
export async function getAllApps(): Promise<App[]> {
  const result = await client.execute('SELECT * FROM apps ORDER BY name ASC');
  return result.rows.map(row => ({
    id: row.id as number,
    name: row.name as string,
    packageName: row.packageName as string,
    organizationId: row.organizationId as number
  }));
}

export async function getAppById(id: number): Promise<App | undefined> {
  const result = await client.execute({
    sql: 'SELECT * FROM apps WHERE id = ?',
    args: [id]
  });

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    packageName: row.packageName as string,
    organizationId: row.organizationId as number
  };
}

export async function getAppsByOrganization(organizationId: number): Promise<App[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM apps WHERE organizationId = ? ORDER BY name ASC',
    args: [organizationId]
  });

  return result.rows.map(row => ({
    id: row.id as number,
    name: row.name as string,
    packageName: row.packageName as string,
    organizationId: row.organizationId as number
  }));
}

export async function createApp(data: AppCreate): Promise<App> {
  const result = await client.execute({
    sql: 'INSERT INTO apps (name, packageName, organizationId) VALUES (?, ?, ?)',
    args: [data.name, data.packageName, data.organizationId]
  });

  return (await getAppById(Number(result.lastInsertRowid)))!;
}

export async function findOrCreateApp(appName: string, organizationId: number): Promise<App> {
  const result = await client.execute({
    sql: 'SELECT * FROM apps WHERE name = ? AND organizationId = ?',
    args: [appName, organizationId]
  });

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      packageName: row.packageName as string,
      organizationId: row.organizationId as number
    };
  }

  const packageName = getPackageNameForApp(appName);
  return createApp({ name: appName, packageName, organizationId });
}

export async function findOrCreateOrganization(orgName: string): Promise<Organization> {
  const result = await client.execute({
    sql: 'SELECT * FROM organizations WHERE name = ?',
    args: [orgName]
  });

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string
    };
  }

  return createOrganization({ name: orgName });
}

// Release functions with JOIN to get full data
export async function getAllReleases(): Promise<Release[]> {
  try {
    const result = await client.execute(`
      SELECT
        r.id, r.appId, r.platform, r.version, r.branch, r.status, r.tag, r.uploadDate, r.forceUpdate, r.additionalData,
        a.id as app_id, a.name as app_name, a.packageName as app_packageName, a.organizationId as app_organizationId,
        o.id as org_id, o.name as org_name
      FROM releases r
      JOIN apps a ON r.appId = a.id
      JOIN organizations o ON a.organizationId = o.id
      ORDER BY r.uploadDate DESC
    `);

    return result.rows.map(row => ({
      id: row.id as number,
      appId: row.appId as number,
      platform: row.platform as string,
      version: row.version as string,
      branch: row.branch as string,
      status: ((row.status as string) || 'In Review') as Release['status'],
      tag: (row.tag as string) || 'general-release-untagged',
      uploadDate: row.uploadDate as string,
      forceUpdate: (row.forceUpdate as string) || 'No',
      additionalData: row.additionalData ? JSON.parse(row.additionalData as string) : undefined,
      app: {
        id: row.app_id as number,
        name: row.app_name as string,
        packageName: row.app_packageName as string,
        organizationId: row.app_organizationId as number
      },
      organization: {
        id: row.org_id as number,
        name: row.org_name as string
      }
    }));
  } catch (error) {
    console.error('Error in getAllReleases:', error);
    throw error;
  }
}

export async function getReleaseById(id: number): Promise<Release | undefined> {
  try {
    const result = await client.execute({
      sql: `
        SELECT
          r.id, r.appId, r.platform, r.version, r.branch, r.status, r.tag, r.uploadDate, r.forceUpdate, r.additionalData,
          a.id as app_id, a.name as app_name, a.packageName as app_packageName, a.organizationId as app_organizationId,
          o.id as org_id, o.name as org_name
        FROM releases r
        JOIN apps a ON r.appId = a.id
        JOIN organizations o ON a.organizationId = o.id
        WHERE r.id = ?
      `,
      args: [id]
    });

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      id: row.id as number,
      appId: row.appId as number,
      platform: row.platform as string,
      version: row.version as string,
      branch: row.branch as string,
      status: ((row.status as string) || 'In Review') as Release['status'],
      tag: (row.tag as string) || 'general-release-untagged',
      uploadDate: row.uploadDate as string,
      forceUpdate: (row.forceUpdate as string) || 'No',
      additionalData: row.additionalData ? JSON.parse(row.additionalData as string) : undefined,
      app: {
        id: row.app_id as number,
        name: row.app_name as string,
        packageName: row.app_packageName as string,
        organizationId: row.app_organizationId as number
      },
      organization: {
        id: row.org_id as number,
        name: row.org_name as string
      }
    };
  } catch (error) {
    console.error('Error in getReleaseById:', error);
    throw error;
  }
}

export async function findReleaseByAppVersionPlatform(appId: number, version: string, platform: string): Promise<Release | undefined> {
  const result = await client.execute({
    sql: 'SELECT id FROM releases WHERE appId = ? AND version = ? AND platform = ?',
    args: [appId, version, platform]
  });
  if (result.rows.length === 0) return undefined;
  return getReleaseById(result.rows[0].id as number);
}

export async function createRelease(data: ReleaseCreate): Promise<Release> {
  try {
    const uploadDate = data.uploadDate || new Date().toISOString();
    const status = data.status || 'In Review';

    // Upsert: check for existing release with same appId + version + platform
    const existing = await findReleaseByAppVersionPlatform(data.appId, data.version, data.platform);
    if (existing) {
      const updated = await updateRelease(existing.id, {
        branch: data.branch,
        status,
        tag: data.tag,
        uploadDate,
        forceUpdate: data.forceUpdate || 'No',
        additionalData: data.additionalData,
      });
      if (!updated) throw new Error('Failed to update existing release');
      return updated;
    }

    const result = await client.execute({
      sql: `
        INSERT INTO releases (appId, platform, version, branch, status, tag, uploadDate, forceUpdate, additionalData)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        data.appId,
        data.platform,
        data.version,
        data.branch,
        status,
        data.tag,
        uploadDate,
        data.forceUpdate || 'No',
        data.additionalData ? JSON.stringify(data.additionalData) : null
      ]
    });

    const newRelease = await getReleaseById(Number(result.lastInsertRowid));
    if (!newRelease) {
      throw new Error('Failed to create release');
    }

    return newRelease;
  } catch (error) {
    console.error('Error in createRelease:', error);
    throw error;
  }
}

export async function updateRelease(id: number, data: Partial<ReleaseCreate>): Promise<Release | undefined> {
  try {
    const existing = await getReleaseById(id);
    if (!existing) return undefined;

    const updated = {
      appId: data.appId ?? existing.appId,
      platform: data.platform ?? existing.platform,
      version: data.version ?? existing.version,
      branch: data.branch ?? existing.branch,
      status: data.status ?? existing.status,
      tag: data.tag ?? existing.tag,
      uploadDate: data.uploadDate ?? existing.uploadDate,
      forceUpdate: data.forceUpdate ?? (existing.forceUpdate || 'No'),
      additionalData: data.additionalData ? JSON.stringify(data.additionalData) : (existing.additionalData ? JSON.stringify(existing.additionalData) : null)
    };

    await client.execute({
      sql: `
        UPDATE releases
        SET appId = ?, platform = ?, version = ?, branch = ?, status = ?, tag = ?, uploadDate = ?, forceUpdate = ?, additionalData = ?
        WHERE id = ?
      `,
      args: [
        updated.appId,
        updated.platform,
        updated.version,
        updated.branch,
        updated.status,
        updated.tag,
        updated.uploadDate,
        updated.forceUpdate,
        updated.additionalData || null,
        id
      ]
    });

    return getReleaseById(id);
  } catch (error) {
    console.error('Error in updateRelease:', error);
    throw error;
  }
}

export async function deleteRelease(id: number): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: 'DELETE FROM releases WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error in deleteRelease:', error);
    throw error;
  }
}

export async function updateMultipleReleaseStatus(ids: number[], status: string): Promise<number> {
  try {
    let updatedCount = 0;

    for (const id of ids) {
      const result = await client.execute({
        sql: 'UPDATE releases SET status = ? WHERE id = ?',
        args: [status, id]
      });

      if (result.rowsAffected > 0) {
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error('Error in updateMultipleReleaseStatus:', error);
    throw error;
  }
}

export async function deleteMultipleReleases(ids: number[]): Promise<number> {
  try {
    const placeholders = ids.map(() => '?').join(',');
    const result = await client.execute({
      sql: `DELETE FROM releases WHERE id IN (${placeholders})`,
      args: ids
    });

    return result.rowsAffected;
  } catch (error) {
    console.error('Error in deleteMultipleReleases:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Automation jobs + worker control
// ---------------------------------------------------------------------------
import type { AutomationJob, AutomationJobCreate, WorkerControl } from '../types';

function mapJob(row: any): AutomationJob {
  return {
    id: row.id as number,
    type: row.type as AutomationJob['type'],
    releaseId: (row.releaseId ?? null) as number | null,
    appId: (row.appId ?? null) as number | null,
    packageName: (row.packageName as string) || '',
    appName: (row.appName as string) || '',
    orgName: (row.orgName as string) || '',
    status: row.status as AutomationJob['status'],
    result: (row.result ?? null) as string | null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function getAutomationJobs(status?: string): Promise<AutomationJob[]> {
  const result = status
    ? await client.execute({ sql: 'SELECT * FROM automation_jobs WHERE status = ? ORDER BY id ASC', args: [status] })
    : await client.execute('SELECT * FROM automation_jobs ORDER BY id DESC LIMIT 200');
  return result.rows.map(mapJob);
}

export async function getAutomationJobById(id: number): Promise<AutomationJob | undefined> {
  const result = await client.execute({ sql: 'SELECT * FROM automation_jobs WHERE id = ?', args: [id] });
  return result.rows.length ? mapJob(result.rows[0]) : undefined;
}

export async function createAutomationJob(data: AutomationJobCreate): Promise<AutomationJob> {
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `INSERT INTO automation_jobs (type, releaseId, appId, packageName, appName, orgName, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    args: [data.type, data.releaseId ?? null, data.appId ?? null, data.packageName, data.appName ?? '', data.orgName ?? '', now, now],
  });
  return (await getAutomationJobById(Number(result.lastInsertRowid)))!;
}

export async function updateAutomationJob(id: number, patch: { status?: string; result?: string }): Promise<AutomationJob | undefined> {
  const existing = await getAutomationJobById(id);
  if (!existing) return undefined;
  await client.execute({
    sql: 'UPDATE automation_jobs SET status = ?, result = ?, updatedAt = ? WHERE id = ?',
    args: [patch.status ?? existing.status, patch.result ?? existing.result, new Date().toISOString(), id],
  });
  return getAutomationJobById(id);
}

export async function getWorkerControl(): Promise<WorkerControl> {
  const result = await client.execute('SELECT enabled, heartbeat, updatedAt FROM automation_control WHERE id = 1');
  const row = result.rows[0];
  return {
    enabled: !!(row?.enabled),
    heartbeat: (row?.heartbeat ?? null) as string | null,
    updatedAt: (row?.updatedAt ?? null) as string | null,
  };
}

export async function setWorkerEnabled(enabled: boolean): Promise<WorkerControl> {
  await client.execute({
    sql: 'UPDATE automation_control SET enabled = ?, updatedAt = ? WHERE id = 1',
    args: [enabled ? 1 : 0, new Date().toISOString()],
  });
  return getWorkerControl();
}

export async function workerHeartbeat(): Promise<WorkerControl> {
  await client.execute({ sql: 'UPDATE automation_control SET heartbeat = ? WHERE id = 1', args: [new Date().toISOString()] });
  return getWorkerControl();
}

import { createClient } from '@libsql/client/web';
import type { Release, ReleaseCreate } from '../types';
import { getOrganizationForApp } from './organization-mapper';

// Turso database client with WebAssembly for serverless
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://app-release-dashboard-rizkyarifin.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
  intMode: 'number'
});

// Initialize the database with the releases table
async function initializeDatabase() {
  try {
    await client.execute(`
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
        additionalData TEXT
      )
    `);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on import
initializeDatabase();

export async function getAllReleases(): Promise<Release[]> {
  try {
    const result = await client.execute('SELECT * FROM releases ORDER BY uploadDate DESC');
    
    return result.rows.map(row => ({
      id: row.id as number,
      organization: row.organization as string,
      appName: row.appName as string,
      platform: row.platform as string,
      version: row.version as string,
      branch: row.branch as string,
      status: (row.status as string) || 'In Review',
      tag: (row.tag as string) || 'general-release-untagged',
      uploadDate: row.uploadDate as string,
      additionalData: row.additionalData ? JSON.parse(row.additionalData as string) : undefined
    }));
  } catch (error) {
    console.error('Error in getAllReleases:', error);
    throw error;
  }
}

export async function getReleaseById(id: number): Promise<Release | undefined> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM releases WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      organization: row.organization as string,
      appName: row.appName as string,
      platform: row.platform as string,
      version: row.version as string,
      branch: row.branch as string,
      status: (row.status as string) || 'In Review',
      tag: (row.tag as string) || 'general-release-untagged',
      uploadDate: row.uploadDate as string,
      additionalData: row.additionalData ? JSON.parse(row.additionalData as string) : undefined
    };
  } catch (error) {
    console.error('Error in getReleaseById:', error);
    throw error;
  }
}

export async function createRelease(data: ReleaseCreate): Promise<Release> {
  try {
    const organization = data.organization || getOrganizationForApp(data.appName);
    const uploadDate = data.uploadDate || new Date().toISOString();
    const status = data.status || 'In Review';
    
    const result = await client.execute({
      sql: `
        INSERT INTO releases (organization, appName, platform, version, branch, status, tag, uploadDate, additionalData)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        organization,
        data.appName,
        data.platform,
        data.version,
        data.branch,
        status,
        data.tag,
        uploadDate,
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
      ...existing,
      ...data,
    };
    
    await client.execute({
      sql: `
        UPDATE releases
        SET organization = ?, appName = ?, platform = ?, version = ?, branch = ?, 
            status = ?, tag = ?, uploadDate = ?, additionalData = ?
        WHERE id = ?
      `,
      args: [
        updated.organization,
        updated.appName,
        updated.platform,
        updated.version,
        updated.branch,
        updated.status,
        updated.tag,
        updated.uploadDate,
        updated.additionalData ? JSON.stringify(updated.additionalData) : null,
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
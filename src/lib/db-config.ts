// Database configuration that switches between SQLite, Turso, and in-memory based on environment
import type { Release, ReleaseCreate } from '../types';

// Check if we're running in production with Turso
const isProduction = process.env.NODE_ENV === 'production' || process.env.NETLIFY;
const hasTursoConfig = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let dbImplementation: any = null;

async function getDbImplementation() {
  if (dbImplementation) {
    return dbImplementation;
  }
  
  if (isProduction && hasTursoConfig) {
    // Use Turso database for production
    dbImplementation = await import('./db-turso');
  } else if (isProduction) {
    // Fallback to in-memory database for serverless without Turso
    dbImplementation = await import('./db-netlify');
  } else {
    // Use SQLite for local development
    dbImplementation = await import('./db');
  }
  
  return dbImplementation;
}

export async function getAllReleases(): Promise<Release[]> {
  const db = await getDbImplementation();
  return db.getAllReleases();
}

export async function getReleaseById(id: number): Promise<Release | undefined> {
  const db = await getDbImplementation();
  return db.getReleaseById(id);
}

export async function createRelease(data: ReleaseCreate): Promise<Release> {
  const db = await getDbImplementation();
  return db.createRelease(data);
}

export async function updateRelease(id: number, data: Partial<ReleaseCreate>): Promise<Release | undefined> {
  const db = await getDbImplementation();
  return db.updateRelease(id, data);
}

export async function deleteRelease(id: number): Promise<boolean> {
  const db = await getDbImplementation();
  return db.deleteRelease(id);
}

export async function updateMultipleReleaseStatus(ids: number[], status: string): Promise<number> {
  const db = await getDbImplementation();
  return db.updateMultipleReleaseStatus(ids, status);
}
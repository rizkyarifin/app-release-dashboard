// Database configuration that switches between SQLite, Turso, and in-memory based on environment
import type { Release, ReleaseCreate, Organization, App } from '../types';

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

export async function deleteMultipleReleases(ids: number[]): Promise<number> {
  const db = await getDbImplementation();
  return db.deleteMultipleReleases(ids);
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDbImplementation();
  return db.getAllOrganizations();
}

export async function getAllApps(): Promise<App[]> {
  const db = await getDbImplementation();
  return db.getAllApps();
}

export async function getAppsByOrganization(organizationId: number): Promise<App[]> {
  const db = await getDbImplementation();
  return db.getAppsByOrganization(organizationId);
}

export async function findOrCreateOrganization(orgName: string): Promise<Organization> {
  const db = await getDbImplementation();
  return db.findOrCreateOrganization(orgName);
}

export async function findOrCreateApp(appName: string, organizationId: number): Promise<App> {
  const db = await getDbImplementation();
  return db.findOrCreateApp(appName, organizationId);
}
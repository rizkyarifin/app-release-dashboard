import type { Release, ReleaseCreate, Organization, App } from '../types';
import { getOrganizationForApp } from './organization-mapper';
import { getPackageNameForApp } from './package-mapper';

// In-memory database for Netlify Functions (serverless)
let releases: Release[] = [];
let organizations: Organization[] = [];
let apps: App[] = [];
let idCounter = 1;
let orgIdCounter = 1;
let appIdCounter = 1;

// This is a simplified in-memory database for Netlify demo
// In production, you'd want to use a real database like Neon PostgreSQL

export function getAllReleases(): Release[] {
  return releases.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

export function getReleaseById(id: number): Release | undefined {
  return releases.find(r => r.id === id);
}

export function createRelease(data: ReleaseCreate): Release {
  const organization = data.organization || getOrganizationForApp(data.appName);
  const uploadDate = data.uploadDate || new Date().toISOString();
  const status = data.status || 'In Review';
  
  const release: Release = {
    id: idCounter++,
    ...data,
    organization,
    status,
    uploadDate,
  };
  
  releases.push(release);
  return release;
}

export function updateRelease(id: number, data: Partial<ReleaseCreate>): Release | undefined {
  const index = releases.findIndex(r => r.id === id);
  if (index === -1) return undefined;
  
  const existing = releases[index];
  const updated = {
    ...existing,
    ...data,
  };
  
  releases[index] = updated;
  return updated;
}

export function deleteRelease(id: number): boolean {
  const index = releases.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  releases.splice(index, 1);
  return true;
}

export function updateMultipleReleaseStatus(ids: number[], status: string): number {
  let updated = 0;
  
  ids.forEach(id => {
    const index = releases.findIndex(r => r.id === id);
    if (index !== -1) {
      releases[index].status = status;
      updated++;
    }
  });
  
  return updated;
}

export function deleteMultipleReleases(ids: number[]): number {
  let deleted = 0;

  ids.forEach(id => {
    const index = releases.findIndex(r => r.id === id);
    if (index !== -1) {
      releases.splice(index, 1);
      deleted++;
    }
  });

  return deleted;
}

export function findOrCreateOrganization(orgName: string): Organization {
  let org = organizations.find(o => o.name === orgName);
  if (!org) {
    org = { id: orgIdCounter++, name: orgName };
    organizations.push(org);
  }
  return org;
}

export function findOrCreateApp(appName: string, organizationId: number): App {
  let app = apps.find(a => a.name === appName && a.organizationId === organizationId);
  if (!app) {
    const packageName = getPackageNameForApp(appName);
    app = { id: appIdCounter++, name: appName, packageName, organizationId };
    apps.push(app);
  }
  return app;
}
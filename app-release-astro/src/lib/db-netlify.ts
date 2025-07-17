import type { Release, ReleaseCreate } from '../types';
import { getOrganizationForApp } from './organization-mapper';

// In-memory database for Netlify Functions (serverless)
let releases: Release[] = [];
let idCounter = 1;

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
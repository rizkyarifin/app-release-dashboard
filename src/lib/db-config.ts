// Database configuration that switches between SQLite and in-memory based on environment
import type { Release, ReleaseCreate } from '../types';

// Check if we're running in a serverless environment (Netlify)
const isServerless = process.env.NETLIFY || process.env.NODE_ENV === 'production';

let dbImplementation: any;

if (isServerless) {
  // Use in-memory database for Netlify
  dbImplementation = await import('./db-netlify');
} else {
  // Use SQLite for local development
  dbImplementation = await import('./db');
}

export const getAllReleases = dbImplementation.getAllReleases;
export const getReleaseById = dbImplementation.getReleaseById;
export const createRelease = dbImplementation.createRelease;
export const updateRelease = dbImplementation.updateRelease;
export const deleteRelease = dbImplementation.deleteRelease;
export const updateMultipleReleaseStatus = dbImplementation.updateMultipleReleaseStatus;
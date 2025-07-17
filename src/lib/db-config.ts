// Database configuration that switches between SQLite, Turso, and in-memory based on environment
import type { Release, ReleaseCreate } from '../types';

// Check if we're running in production with Turso
const isProduction = process.env.NODE_ENV === 'production' || process.env.NETLIFY;
const hasTursoConfig = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let dbImplementation: any;

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

export const getAllReleases = dbImplementation.getAllReleases;
export const getReleaseById = dbImplementation.getReleaseById;
export const createRelease = dbImplementation.createRelease;
export const updateRelease = dbImplementation.updateRelease;
export const deleteRelease = dbImplementation.deleteRelease;
export const updateMultipleReleaseStatus = dbImplementation.updateMultipleReleaseStatus;
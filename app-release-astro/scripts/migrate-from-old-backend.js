import Database from 'better-sqlite3';
import { getOrganizationForApp } from './organization-mapper.js';

// Open the old database
const oldDb = new Database('../backend/releases.db');

// Open the new database 
const newDb = new Database('releases.db');

// Create the new table structure
newDb.exec(`
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

try {
  // Read all releases from the old database
  const oldReleases = oldDb.prepare('SELECT * FROM releases').all();
  
  // Prepare insert statement for new database
  const insertStmt = newDb.prepare(`
    INSERT INTO releases (organization, appName, platform, version, branch, status, tag, uploadDate, additionalData)
    VALUES (@organization, @appName, @platform, @version, @branch, @status, @tag, @uploadDate, @additionalData)
  `);
  
  // Migrate each release
  for (const release of oldReleases) {
    // Get organization from app name
    const organization = getOrganizationForApp(release.appName);
    
    insertStmt.run({
      organization,
      appName: release.appName,
      platform: release.platform,
      version: release.version,
      branch: release.buildNumber, // Map old buildNumber to new branch field
      status: 'In Review', // Default status for migrated releases
      tag: 'migrated-release-' + new Date().toISOString().slice(0, 10), // Default tag for migrated releases
      uploadDate: release.uploadDate,
      additionalData: release.additionalData
    });
  }
  
  console.log(`Successfully migrated ${oldReleases.length} releases from old backend to new unified structure.`);
} catch (error) {
  console.error('Error during migration:', error.message);
  console.log('Make sure the old backend database exists at ../backend/releases.db');
} finally {
  oldDb.close();
  newDb.close();
}
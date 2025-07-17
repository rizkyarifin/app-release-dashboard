import Database from 'better-sqlite3';
import { getOrganizationForApp } from './organization-mapper.js';

const db = new Database('releases.db');

// Drop table if it exists and create fresh one
db.exec(`DROP TABLE IF EXISTS releases`);
db.exec(`
  CREATE TABLE releases (
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

// Sample app names from the organization mapper
const sampleApps = [
  'froggy-98',
  'wowy-radio',
  'radio-91-2',
  'wiil-rock',
  'san-antonio',
  'ibiza-sonica',
  'the-wolf'
];

const platforms = ['iOS', 'Android'];
const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0'];
const statuses = ['In Review', 'Published'];
const tags = [
  'general-release-15-july-2025',
  '7m-phase-4-26-july-2025',
  'hotfix-22-july-2025'
];

// Generate dummy data
const stmt = db.prepare(`
  INSERT INTO releases (organization, appName, platform, version, branch, status, tag, uploadDate, additionalData)
  VALUES (@organization, @appName, @platform, @version, @branch, @status, @tag, @uploadDate, @additionalData)
`);

sampleApps.forEach(appName => {
  const organization = getOrganizationForApp(appName);
  
  platforms.forEach(platform => {
    versions.forEach((version, versionIndex) => {
      const date = new Date();
      date.setDate(date.getDate() - (versions.length - versionIndex) * 7);
      
      stmt.run({
        organization,
        appName,
        platform,
        version,
        branch: 'main',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        tag: tags[Math.floor(Math.random() * tags.length)],
        uploadDate: date.toISOString(),
        additionalData: JSON.stringify({
          notes: `Release notes for ${appName} v${version}`,
          size: `${Math.floor(Math.random() * 50) + 20}MB`
        })
      });
    });
  });
});

console.log('Dummy data added successfully!');
db.close();
import React from 'react';

interface Release {
  id: number;
  organization: string;
  appName: string;
  platform: string;
  version: string;
  branch: string;
  uploadDate: string;
}

interface SimpleReleaseProps {
  releases: Release[];
}

const SimpleRelease: React.FC<SimpleReleaseProps> = ({ releases }) => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>App Release Dashboard</h1>
      <p>Total releases: {releases.length}</p>
      
      {releases.length === 0 ? (
        <p>No releases found.</p>
      ) : (
        <div>
          {releases.slice(0, 10).map((release) => (
            <div key={release.id} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              margin: '10px 0',
              borderRadius: '5px'
            }}>
              <h3>{release.appName}</h3>
              <p><strong>Organization:</strong> {release.organization}</p>
              <p><strong>Platform:</strong> {release.platform}</p>
              <p><strong>Version:</strong> {release.version}</p>
              <p><strong>Branch:</strong> {release.branch}</p>
              <p><strong>Date:</strong> {new Date(release.uploadDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleRelease;
import React from 'react';
import { format } from 'date-fns';
import type { Release } from '../types';

interface ReleaseListProps {
  releases: Release[];
}

const ReleaseList: React.FC<ReleaseListProps> = ({ releases }) => {
  const platformColors: Record<string, string> = {
    iOS: '#007AFF',
    Android: '#3DDC84',
    Web: '#FF6B6B',
  };

  const groupedReleases = releases.reduce((acc, release) => {
    const key = `${release.organization}-${release.appName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(release);
    return acc;
  }, {} as Record<string, Release[]>);

  return (
    <div className="release-list">
      {Object.entries(groupedReleases).map(([key, appReleases]) => {
        const [organization, appName] = key.split('-');
        return (
          <div key={key} className="app-group">
            <h2 className="app-header">
              <span className="organization">{organization}</span>
              <span className="app-name">{appName}</span>
            </h2>
            <div className="releases">
              {appReleases.map((release) => (
                <div key={release.id} className="release-card">
                  <div
                    className="platform-badge"
                    style={{ backgroundColor: platformColors[release.platform] || '#999' }}
                  >
                    {release.platform}
                  </div>
                  <div className="release-info">
                    <div className="version">v{release.version}</div>
                    <div className="build">Branch: {release.branch}</div>
                    <div className="date">
                      {format(new Date(release.uploadDate), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
    </div>
  );
};

export default ReleaseList;
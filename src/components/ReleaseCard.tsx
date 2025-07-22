import React from 'react';
import { format } from 'date-fns';
import type { Release } from '../types';

interface ReleaseCardProps {
  release: Release;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release }) => {
  const platformColors: Record<string, string> = {
    iOS: '#007AFF',
    Android: '#3DDC84',
    Web: '#FF6B6B',
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="release-card">
      <div className="card-header">
        <div
          className="platform-badge"
          style={{ backgroundColor: platformColors[release.platform] || '#999' }}
        >
          {release.platform}
        </div>
        <div className="organization">{release.organization}</div>
      </div>
      
      <div className="card-body">
        <h3 className="app-name">{release.appName}</h3>
        <div className="version-info">
          <span className="version">v{release.version}</span>
          <span className="build">Branch: {release.branch}</span>
        </div>
        <div className="tag-container">
          <span className="tag-badge">
            <svg className="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            {release.tag}
          </span>
        </div>
        <div className="date">{formatDate(release.uploadDate)}</div>
      </div>
      
      {release.additionalData && (
        <div className="additional-data">
          {Object.entries(release.additionalData).map(([key, value]) => (
            <div key={key} className="data-item">
              <span className="data-key">{key}:</span>
              <span className="data-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ReleaseCard;
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Release, ReleaseStatus } from '../types';

interface ReleaseTimelineCardProps {
  release: Release;
  onStatusChange: (id: number, status: ReleaseStatus) => void;
}

const STATUS_OPTIONS: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];

const ReleaseTimelineCard: React.FC<ReleaseTimelineCardProps> = ({ release, onStatusChange }) => {
  const appName = release.app?.name || 'Unknown App';
  const orgName = release.organization?.name || 'Unknown Org';
  const platform = release.platform || 'Unknown';
  const isAndroid = platform.toLowerCase() === 'android';

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(release.uploadDate), { addSuffix: true });
    } catch {
      return release.uploadDate;
    }
  })();

  return (
    <div className="tl-card">
      <div className="tl-card-top">
        <div className="tl-card-app">
          <span className="tl-card-name">{appName}</span>
          <span className="tl-card-org">{orgName}</span>
        </div>
        <span className={`tl-platform ${isAndroid ? 'tl-platform--android' : 'tl-platform--ios'}`}>
          {platform}
        </span>
      </div>

      <div className="tl-card-mid">
        <span className="tl-version">{release.version}</span>
        <span className="tl-branch">{release.branch}</span>
        <span className="tl-time">{relativeTime}</span>
      </div>

      <div className="tl-card-bot">
        <select
          className={`tl-status tl-status--${release.status.toLowerCase().replace(/\s+/g, '-')}`}
          value={release.status}
          onChange={(e) => onStatusChange(release.id, e.target.value as ReleaseStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ReleaseTimelineCard;

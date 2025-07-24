import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { Release, ReleaseStatus } from '../types';

interface ReleaseGroupedViewProps {
  releases: Release[];
  onReleaseUpdate?: (releases: Release[]) => void;
}

const ReleaseGroupedView: React.FC<ReleaseGroupedViewProps> = ({ releases, onReleaseUpdate }) => {
  const [expandedTags, setExpandedTags] = useState<string[]>([]);
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ReleaseStatus>('In Review');
  const [isUpdating, setIsUpdating] = useState(false);

  const groupedReleases = useMemo(() => {
    const groups: Record<string, Release[]> = {};
    
    releases.forEach(release => {
      if (!groups[release.tag]) {
        groups[release.tag] = [];
      }
      groups[release.tag].push(release);
    });

    // Sort releases within each group by upload date (newest first)
    Object.keys(groups).forEach(tag => {
      groups[tag].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    });

    return groups;
  }, [releases]);

  const sortedTags = Object.keys(groupedReleases).sort((a, b) => {
    // Sort tags by latest release date in each group
    const aLatest = Math.max(...groupedReleases[a].map(r => new Date(r.uploadDate).getTime()));
    const bLatest = Math.max(...groupedReleases[b].map(r => new Date(r.uploadDate).getTime()));
    return bLatest - aLatest;
  });

  const toggleTag = (tag: string) => {
    setExpandedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSelectRelease = (releaseId: number) => {
    setSelectedReleases(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  const handleSelectTag = (tag: string) => {
    const tagReleases = groupedReleases[tag].map(r => r.id);
    const allSelected = tagReleases.every(id => selectedReleases.includes(id));
    
    if (allSelected) {
      setSelectedReleases(prev => prev.filter(id => !tagReleases.includes(id)));
    } else {
      setSelectedReleases(prev => [...new Set([...prev, ...tagReleases])]);
    }
  };

  const updateMultipleReleases = async () => {
    if (selectedReleases.length === 0) {
      alert('Please select at least one release to update');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/releases/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedReleases, status: bulkStatus })
      });
      
      if (response.ok) {
        setSelectedReleases([]);
        window.location.reload();
      } else {
        alert('Failed to update releases');
      }
    } catch (error) {
      console.error('Error updating releases:', error);
      alert('Failed to update releases');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateReleaseStatus = async (releaseId: number, newStatus: ReleaseStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/releases/${releaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to update release status');
      }
    } catch (error) {
      console.error('Error updating release status:', error);
      alert('Failed to update release status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'iOS': return '#007AFF';
      case 'Android': return '#3DDC84';
      case 'Web': return '#FF6B6B';
      default: return '#999';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return '#4CAF50';
      case 'Ready to publish': return '#2196F3';
      case 'In Review': return '#FF9800';
      default: return '#999';
    }
  };

  const statuses: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];

  return (
    <div className="release-grouped-view">
      {/* Bulk Actions */}
      {selectedReleases.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">
            {selectedReleases.length} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ReleaseStatus)}
            className="filter-select"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button 
            onClick={updateMultipleReleases}
            disabled={isUpdating}
            className="bulk-update-btn"
          >
            {isUpdating ? 'Updating...' : 'Update Selected'}
          </button>
        </div>
      )}

      {/* Tag Groups */}
      <div className="tag-groups">
        {sortedTags.map(tag => {
          const tagReleases = groupedReleases[tag];
          const isExpanded = expandedTags.includes(tag);
          const tagReleaseIds = tagReleases.map(r => r.id);
          const selectedCount = tagReleaseIds.filter(id => selectedReleases.includes(id)).length;
          
          return (
            <div key={tag} className="tag-group">
              <div className="tag-header">
                <div className="tag-header-left">
                  <input
                    type="checkbox"
                    checked={selectedCount === tagReleases.length && tagReleases.length > 0}
                    onChange={() => handleSelectTag(tag)}
                    className="tag-checkbox"
                  />
                  <button
                    onClick={() => toggleTag(tag)}
                    className="tag-toggle"
                  >
                    <span className="tag-name">{tag}</span>
                    <span className="tag-count">({tagReleases.length} releases)</span>
                    <span className="expand-arrow">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                </div>
                <div className="tag-header-right">
                  <span className="tag-latest">
                    Latest: {formatDate(tagReleases[0]?.uploadDate)}
                  </span>
                  {selectedCount > 0 && (
                    <span className="selected-in-tag">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="tag-releases">
                  {tagReleases.map(release => (
                    <div key={release.id} className="release-item">
                      <div className="release-item-left">
                        <input
                          type="checkbox"
                          checked={selectedReleases.includes(release.id)}
                          onChange={() => handleSelectRelease(release.id)}
                          className="release-checkbox"
                        />
                        <div className="release-info">
                          <div className="release-app">
                            <span className="app-name">{release.appName}</span>
                            <span className="organization">({release.organization})</span>
                          </div>
                          <div className="release-details">
                            <span 
                              className="platform-badge"
                              style={{ backgroundColor: getPlatformColor(release.platform) }}
                            >
                              {release.platform}
                            </span>
                            <span className="version">v{release.version}</span>
                            <span className="branch">{release.branch}</span>
                            <span className="date">{formatDate(release.uploadDate)}</span>
                            <span className="force-update">Force Update: {release.forceUpdate || 'No'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="release-item-right">
                        <select
                          value={release.status}
                          onChange={(e) => updateReleaseStatus(release.id, e.target.value as ReleaseStatus)}
                          disabled={isUpdating}
                          className="status-select"
                          style={{ borderColor: getStatusColor(release.status) }}
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReleaseGroupedView;
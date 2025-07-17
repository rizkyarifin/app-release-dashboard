import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { Release, ReleaseStatus } from '../types';

interface ReleaseTableProps {
  releases: Release[];
  onReleaseUpdate?: (releases: Release[]) => void;
}

const ReleaseTable: React.FC<ReleaseTableProps> = ({ releases, onReleaseUpdate }) => {
  const [sortField, setSortField] = useState<keyof Release>('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ReleaseStatus>('In Review');
  const [isUpdating, setIsUpdating] = useState(false);

  const organizations = [...new Set(releases.map(r => r.organization))].sort();
  const platforms = [...new Set(releases.map(r => r.platform))].sort();
  const tags = [...new Set(releases.map(r => r.tag))].sort();
  const statuses: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];
  const filterStatuses = ['All', 'In Review', 'Ready to publish', 'Published'];

  const filteredAndSortedReleases = useMemo(() => {
    let filtered = releases.filter(release => {
      const matchesOrg = !filterOrg || release.organization === filterOrg;
      const matchesPlatform = !filterPlatform || release.platform === filterPlatform;
      const matchesStatus = !filterStatus || filterStatus === 'All' || release.status === filterStatus;
      const matchesTag = !filterTag || release.tag === filterTag;
      const matchesSearch = !searchTerm || 
        release.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.version.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesOrg && matchesPlatform && matchesStatus && matchesTag && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [releases, sortField, sortDirection, filterOrg, filterPlatform, filterStatus, filterTag, searchTerm]);

  const handleSort = (field: keyof Release) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const clearFilters = () => {
    setFilterOrg('');
    setFilterPlatform('');
    setFilterStatus('');
    setFilterTag('');
    setSearchTerm('');
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
        // Refresh the page to get updated data
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
        // Refresh the page to get updated data
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

  const handleSelectAll = () => {
    if (selectedReleases.length === filteredAndSortedReleases.length) {
      setSelectedReleases([]);
    } else {
      setSelectedReleases(filteredAndSortedReleases.map(r => r.id));
    }
  };

  const handleSelectRelease = (releaseId: number) => {
    setSelectedReleases(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  return (
    <div className="release-table-container">
      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="filter-select"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="filter-select"
          >
            <option value="">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {filterStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="filter-select"
          >
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        
        <button onClick={clearFilters} className="clear-btn">
          Clear Filters
        </button>
      </div>

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

      {/* Results info */}
      <div className="results-info">
        Showing {filteredAndSortedReleases.length} of {releases.length} releases
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="release-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedReleases.length === filteredAndSortedReleases.length && filteredAndSortedReleases.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('appName')} className="sortable">
                App Name
                {sortField === 'appName' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('organization')} className="sortable">
                Organization
                {sortField === 'organization' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('platform')} className="sortable">
                Platform
                {sortField === 'platform' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('version')} className="sortable">
                Version
                {sortField === 'version' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('branch')} className="sortable">
                Branch
                {sortField === 'branch' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status
                {sortField === 'status' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('tag')} className="sortable">
                Tag
                {sortField === 'tag' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('uploadDate')} className="sortable">
                Upload Date
                {sortField === 'uploadDate' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedReleases.map((release) => (
              <tr key={release.id}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedReleases.includes(release.id)}
                    onChange={() => handleSelectRelease(release.id)}
                  />
                </td>
                <td className="app-name">{release.appName}</td>
                <td className="organization">{release.organization}</td>
                <td className="platform">
                  <span 
                    className="platform-badge"
                    style={{ backgroundColor: getPlatformColor(release.platform) }}
                  >
                    {release.platform}
                  </span>
                </td>
                <td className="version">v{release.version}</td>
                <td className="branch">{release.branch}</td>
                <td className="status">
                  <select
                    value={release.status}
                    onChange={(e) => updateReleaseStatus(release.id, e.target.value as ReleaseStatus)}
                    disabled={isUpdating}
                    className="status-select"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="tag">{release.tag}</td>
                <td className="date">{formatDate(release.uploadDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedReleases.length === 0 && (
        <div className="no-results">
          <p>No releases found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ReleaseTable;
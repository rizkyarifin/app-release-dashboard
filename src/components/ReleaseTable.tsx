import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { Release, ReleaseStatus } from '../types';
import { exportToCSV } from '../utils/csvExport';

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
  const [filterForceUpdate, setFilterForceUpdate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ReleaseStatus>('In Review');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const organizations = [...new Set(releases.map(r => r.organization))].sort();
  const platforms = [...new Set(releases.map(r => r.platform))].sort();
  const tags = [...new Set(releases.map(r => r.tag))].sort();
  const statuses: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];
  const filterStatuses = ['All', 'In Review', 'Ready to publish', 'Published'];
  const forceUpdateOptions = ['All', 'Yes', 'No'];

  const filteredAndSortedReleases = useMemo(() => {
    let filtered = releases.filter(release => {
      const matchesOrg = !filterOrg || release.organization === filterOrg;
      const matchesPlatform = !filterPlatform || release.platform === filterPlatform;
      const matchesStatus = !filterStatus || filterStatus === 'All' || release.status === filterStatus;
      const matchesTag = !filterTag || release.tag === filterTag;
      const matchesForceUpdate = !filterForceUpdate || filterForceUpdate === 'All' || (release.forceUpdate || 'No') === filterForceUpdate;
      const matchesSearch = !searchTerm || 
        release.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.version.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesOrg && matchesPlatform && matchesStatus && matchesTag && matchesForceUpdate && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [releases, sortField, sortDirection, filterOrg, filterPlatform, filterStatus, filterTag, filterForceUpdate, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedReleases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReleases = filteredAndSortedReleases.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterPlatform, filterStatus, filterTag, filterForceUpdate, searchTerm, itemsPerPage]);

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
    setFilterForceUpdate('');
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
    const currentPageIds = paginatedReleases.map(r => r.id);
    const isAllSelected = currentPageIds.every(id => selectedReleases.includes(id));
    
    if (isAllSelected) {
      setSelectedReleases(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedReleases(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleSelectRelease = (releaseId: number) => {
    setSelectedReleases(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `releases-export-${timestamp}.csv`;
    exportToCSV(filteredAndSortedReleases, filename);
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
        
        <div className="filter-group">
          <select
            value={filterForceUpdate}
            onChange={(e) => setFilterForceUpdate(e.target.value)}
            className="filter-select"
          >
            <option value="">All Force Updates</option>
            {forceUpdateOptions.slice(1).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button onClick={clearFilters} className="clear-btn">
          Clear Filters
        </button>
        
        <button onClick={handleExportCSV} className="export-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
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
                  checked={paginatedReleases.length > 0 && paginatedReleases.every(r => selectedReleases.includes(r.id))}
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
              <th onClick={() => handleSort('forceUpdate')} className="sortable">
                Force Update
                {sortField === 'forceUpdate' && (
                  <span className="sort-arrow">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedReleases.map((release) => (
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
                <td className="tag">
                  <span className="tag-badge">
                    <svg className="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    {release.tag}
                  </span>
                </td>
                <td className="date">{formatDate(release.uploadDate)}</td>
                <td className="force-update">{release.forceUpdate || 'No'}</td>
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

      {/* Pagination Controls */}
      {filteredAndSortedReleases.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedReleases.length)} of {filteredAndSortedReleases.length} releases
            </span>
            <div className="items-per-page">
              <label>Items per page:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="per-page-select"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          <div className="pagination-buttons">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="pagination-btn"
              title="First page"
            >
              ««
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Previous page"
            >
              «
            </button>
            
            {/* Page numbers */}
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Next page"
            >
              »
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseTable;
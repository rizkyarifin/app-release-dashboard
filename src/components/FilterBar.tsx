import React from 'react';
import type { Release } from '../types';

interface FilterBarProps {
  releases: Release[];
  selectedOrganization: string;
  selectedPlatform: string;
  searchTerm: string;
  onOrganizationChange: (org: string) => void;
  onPlatformChange: (platform: string) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  releases,
  selectedOrganization,
  selectedPlatform,
  searchTerm,
  onOrganizationChange,
  onPlatformChange,
  onSearchChange,
  onClearFilters,
}) => {
  const organizations = [...new Set(releases.map(r => r.organization))].sort();
  const platforms = [...new Set(releases.map(r => r.platform))].sort();

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <input
          type="text"
          placeholder="Search apps..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-section">
        <select
          value={selectedOrganization}
          onChange={(e) => onOrganizationChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Organizations</option>
          {organizations.map(org => (
            <option key={org} value={org}>{org}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-section">
        <select
          value={selectedPlatform}
          onChange={(e) => onPlatformChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Platforms</option>
          {platforms.map(platform => (
            <option key={platform} value={platform}>{platform}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-section">
        <button onClick={onClearFilters} className="clear-button">
          Clear Filters
        </button>
      </div>

    </div>
  );
};

export default FilterBar;
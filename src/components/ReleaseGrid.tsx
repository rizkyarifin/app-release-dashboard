import React, { useState, useMemo } from 'react';
import ReleaseCard from './ReleaseCard';
import FilterBar from './FilterBar';
import type { Release } from '../types';

interface ReleaseGridProps {
  releases: Release[];
}

const ReleaseGrid: React.FC<ReleaseGridProps> = ({ releases }) => {
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReleases = useMemo(() => {
    return releases.filter(release => {
      const matchesOrganization = !selectedOrganization || release.organization?.name === selectedOrganization;
      const matchesPlatform = !selectedPlatform || release.platform === selectedPlatform;
      const matchesSearch = !searchTerm || 
        release.app?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.version.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesOrganization && matchesPlatform && matchesSearch;
    });
  }, [releases, selectedOrganization, selectedPlatform, searchTerm]);

  const handleClearFilters = () => {
    setSelectedOrganization('');
    setSelectedPlatform('');
    setSearchTerm('');
  };

  // Group releases by organization and app
  const groupedReleases = useMemo(() => {
    const groups: Record<string, Record<string, Release[]>> = {};
    
    filteredReleases.forEach(release => {
      if (!groups[release.organization?.name]) {
        groups[release.organization?.name] = {};
      }
      if (!groups[release.organization?.name][release.app?.name]) {
        groups[release.organization?.name][release.app?.name] = [];
      }
      groups[release.organization?.name][release.app?.name].push(release);
    });
    
    return groups;
  }, [filteredReleases]);

  return (
    <div className="release-grid">
      <FilterBar
        releases={releases}
        selectedOrganization={selectedOrganization}
        selectedPlatform={selectedPlatform}
        searchTerm={searchTerm}
        onOrganizationChange={setSelectedOrganization}
        onPlatformChange={setSelectedPlatform}
        onSearchChange={setSearchTerm}
        onClearFilters={handleClearFilters}
      />
      
      <div className="results-info">
        <p>Showing {filteredReleases.length} of {releases.length} releases</p>
      </div>

      {filteredReleases.length === 0 ? (
        <div className="no-results">
          <h3>No releases found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="organizations">
          {Object.entries(groupedReleases).map(([orgName, apps]) => (
            <div key={orgName} className="organization-group">
              <h2 className="organization-title">{orgName}</h2>
              
              {Object.entries(apps).map(([appName, appReleases]) => (
                <div key={appName} className="app-group">
                  <h3 className="app-title">{appName}</h3>
                  <div className="releases-grid">
                    {appReleases.map(release => (
                      <ReleaseCard key={release.id} release={release} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ReleaseGrid;
import React, { useState, useEffect } from 'react';
import ReleaseTable from './ReleaseTable';
import ReleaseGroupedView from './ReleaseGroupedView';
import type { Release } from '../types';
import '../styles/dashboard.css';
import '../styles/table.css';
import '../styles/grouped-view.css';

const Dashboard: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/releases');
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data = await response.json();
      setReleases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading releases...</p>
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchReleases}>Retry</button>
        
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>App Release Dashboard</h1>
        <p className="subtitle">Track all your app releases in one place</p>
        <div className="stats">
          <div className="stat">
            <span className="stat-number">{releases.length}</span>
            <span className="stat-label">Total Releases</span>
          </div>
          <div className="stat">
            <span className="stat-number">{new Set(releases.map(r => r.organization)).size}</span>
            <span className="stat-label">Organizations</span>
          </div>
          <div className="stat">
            <span className="stat-number">{new Set(releases.map(r => r.appName)).size}</span>
            <span className="stat-label">Apps</span>
          </div>
          <div className="stat">
            <span className="stat-number">{new Set(releases.map(r => r.tag)).size}</span>
            <span className="stat-label">Tags</span>
          </div>
        </div>
      </header>
      
      {/* View Mode Toggle */}
      <div className="view-toggle">
        <button 
          onClick={() => setViewMode('table')}
          className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
        >
          Table View
        </button>
        <button 
          onClick={() => setViewMode('grouped')}
          className={`toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
        >
          Grouped by Tag
        </button>
      </div>
      
      {releases.length === 0 ? (
        <div className="empty-state">
          <h2>No releases yet</h2>
          <p>Upload your first release to get started</p>
        </div>
      ) : (
        viewMode === 'table' ? (
          <ReleaseTable releases={releases} />
        ) : (
          <ReleaseGroupedView releases={releases} />
        )
      )}
      
    </div>
  );
};

export default Dashboard;
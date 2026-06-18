import React, { useState, useEffect, useMemo } from 'react';
import { startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import ReleaseTimeline from './ReleaseTimeline';
import type { Release, ReleaseStatus } from '../types';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/releases');
      if (!response.ok) throw new Error('Failed to fetch releases');
      const data = await response.json();
      setReleases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: ReleaseStatus) => {
    // Optimistic update
    setReleases((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    try {
      const res = await fetch(`/api/releases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      fetchReleases();
    }
  };

  // Derived data
  const orgs = useMemo(
    () => [...new Set(releases.map((r) => r.organization?.name).filter(Boolean))] as string[],
    [releases],
  );
  const platforms = useMemo(
    () => [...new Set(releases.map((r) => r.platform).filter(Boolean))],
    [releases],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;

    if (datePreset === 'this-week') {
      dateFrom = startOfWeek(now, { weekStartsOn: 1 });
    } else if (datePreset === 'this-month') {
      dateFrom = startOfMonth(now);
    } else if (datePreset === 'custom') {
      if (startDate) dateFrom = new Date(startDate);
      if (endDate) dateTo = endOfDay(new Date(endDate));
    }

    return releases.filter((r) => {
      if (search && !(r.app?.name || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (orgFilter && r.organization?.name !== orgFilter) return false;
      if (platformFilter && r.platform !== platformFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (dateFrom || dateTo) {
        const uploadTime = new Date(r.uploadDate).getTime();
        if (dateFrom && uploadTime < dateFrom.getTime()) return false;
        if (dateTo && uploadTime > dateTo.getTime()) return false;
      }
      return true;
    });
  }, [releases, search, orgFilter, platformFilter, statusFilter, datePreset, startDate, endDate]);

  const stats = useMemo(() => {
    const published = filtered.filter((r) => r.status === 'Published').length;
    const inReview = filtered.filter((r) => r.status === 'In Review').length;
    const ready = filtered.filter((r) => r.status === 'Ready to publish').length;
    const uniqueApps = new Set(filtered.map((r) => r.app?.name)).size;
    return { total: filtered.length, published, inReview, ready, uniqueApps };
  }, [filtered]);

  const handleDelete = async (id: number) => {
    // Optimistic update
    setReleases((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/releases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      fetchReleases();
    }
  };

  const hasFilters = search || orgFilter || platformFilter || statusFilter || datePreset;

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading releases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button className="dash-retry" onClick={fetchReleases}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-header">
        <h1 className="dash-title">App Release Dashboard</h1>
        <p className="dash-subtitle">Track all your app releases in one place</p>
      </header>

      <main className="dash-main">
        {/* Filters */}
        <div className="filter-row">
          <input
            className="filter-search"
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
          >
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            className="filter-select"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="In Review">In Review</option>
            <option value="Ready to publish">Ready to Publish</option>
            <option value="Published">Published</option>
          </select>
          <select
            className="filter-select"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value);
              if (e.target.value !== 'custom') { setStartDate(''); setEndDate(''); }
            }}
          >
            <option value="">All Dates</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {datePreset === 'custom' && (
            <>
              <input
                className="filter-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                className="filter-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
          {hasFilters && (
            <button
              className="filter-clear"
              onClick={() => { setSearch(''); setOrgFilter(''); setPlatformFilter(''); setStatusFilter(''); setDatePreset(''); setStartDate(''); setEndDate(''); }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Releases</span>
          </div>
          <div className="stat-card stat-card--green">
            <span className="stat-value">{stats.published}</span>
            <span className="stat-label">Published</span>
          </div>
          <div className="stat-card stat-card--amber">
            <span className="stat-value">{stats.inReview}</span>
            <span className="stat-label">In Review</span>
          </div>
          <div className="stat-card stat-card--blue">
            <span className="stat-value">{stats.ready}</span>
            <span className="stat-label">Ready to Publish</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.uniqueApps}</span>
            <span className="stat-label">Unique Apps</span>
          </div>
        </div>

        {/* Timeline */}
        {releases.length === 0 ? (
          <div className="dash-empty">
            <h2>No releases yet</h2>
            <p>Upload your first release to get started</p>
          </div>
        ) : (
          <ReleaseTimeline releases={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;

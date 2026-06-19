import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import ReleaseTable from './ReleaseTable';
import type { Release, ReleaseStatus } from '../types';
import '../styles/dashboard.css';

const STATUS_OPTIONS: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];

const Dashboard: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
      fetchReleases();
    }
  };

  const handleDelete = async (id: number) => {
    setReleases((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const res = await fetch(`/api/releases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
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
    return { total: filtered.length, published, inReview, ready };
  }, [filtered]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const p = r.platform || 'Unknown';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Selection handlers
  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const filteredIds = filtered.map((r) => r.id);
      const allSelected = filteredIds.length > 0 && filteredIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(filteredIds);
    });
  }, [filtered]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} selected release(s)?`)) return;
    const ids = [...selectedIds];
    setReleases((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    try {
      const res = await fetch('/api/releases/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchReleases();
    }
  };

  const handleBulkStatusChange = async (status: ReleaseStatus) => {
    const ids = [...selectedIds];
    setReleases((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, status } : r)),
    );
    try {
      const res = await fetch('/api/releases/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
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
        </div>

        {/* Platform Distribution Chart */}
        {platformCounts.length > 0 && (
          <div className="platform-chart">
            <h3 className="platform-chart-title">Releases by Platform</h3>
            {platformCounts.map(([platform, count]) => {
              const max = platformCounts[0][1];
              const pct = max > 0 ? (count / max) * 100 : 0;
              const colorVar = platform.toLowerCase() === 'android'
                ? 'var(--color-green)'
                : platform.toLowerCase() === 'ios'
                  ? 'var(--color-blue)'
                  : 'var(--color-indigo)';
              return (
                <div className="platform-chart-bar-row" key={platform}>
                  <span className="platform-chart-label">{platform}</span>
                  <div className="platform-chart-track">
                    <div
                      className="platform-chart-bar"
                      style={{ width: `${pct}%`, backgroundColor: colorVar }}
                    />
                  </div>
                  <span className="platform-chart-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span className="bulk-bar-count">{selectedIds.size} selected</span>
            <select
              className="bulk-bar-status"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as ReleaseStatus);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>Set status...</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="bulk-bar-delete" onClick={handleBulkDelete}>Delete</button>
            <button className="bulk-bar-deselect" onClick={handleDeselectAll}>Deselect all</button>
          </div>
        )}

        {/* Table */}
        {releases.length === 0 ? (
          <div className="dash-empty">
            <h2>No releases yet</h2>
            <p>Upload your first release to get started</p>
          </div>
        ) : (
          <ReleaseTable
            releases={filtered}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;

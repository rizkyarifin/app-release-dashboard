import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Release, ReleaseStatus } from '../types';

const STATUS_OPTIONS: ReleaseStatus[] = ['In Review', 'Ready to publish', 'Published'];
const BATCH_SIZE = 20;

interface ReleaseTableProps {
  releases: Release[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
  onStatusChange: (id: number, status: ReleaseStatus) => void;
  onDelete: (id: number) => void;
}

const ReleaseTable: React.FC<ReleaseTableProps> = ({
  releases,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onStatusChange,
  onDelete,
}) => {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...releases].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()),
    [releases],
  );

  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const hasMore = visibleCount < sorted.length;
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));

  if (sorted.length === 0) {
    return <div className="rt-empty">No releases match your filters.</div>;
  }

  return (
    <div className="rt-wrapper">
      <table className="release-table">
        <thead>
          <tr>
            <th className="rt-th rt-th-check">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={onToggleAll}
              />
            </th>
            <th className="rt-th">App</th>
            <th className="rt-th">Organization</th>
            <th className="rt-th">Platform</th>
            <th className="rt-th">Version</th>
            <th className="rt-th">Branch</th>
            <th className="rt-th">Status</th>
            <th className="rt-th">Date</th>
            <th className="rt-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const isSelected = selectedIds.has(r.id);
            const platform = r.platform || 'Unknown';
            const isAndroid = platform.toLowerCase() === 'android';
            const relativeTime = (() => {
              try {
                return formatDistanceToNow(new Date(r.uploadDate), { addSuffix: true });
              } catch {
                return r.uploadDate;
              }
            })();

            return (
              <tr key={r.id} className={`rt-row ${isSelected ? 'rt-row--selected' : ''}`}>
                <td className="rt-td rt-td-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(r.id)}
                  />
                </td>
                <td className="rt-td rt-td-app">{r.app?.name || 'Unknown App'}</td>
                <td className="rt-td rt-td-org">{r.organization?.name || 'Unknown Org'}</td>
                <td className="rt-td">
                  <span className={`rt-platform ${isAndroid ? 'rt-platform--android' : 'rt-platform--ios'}`}>
                    {platform}
                  </span>
                </td>
                <td className="rt-td">
                  <span className="rt-version">{r.version}</span>
                </td>
                <td className="rt-td rt-td-branch">{r.branch}</td>
                <td className="rt-td">
                  <select
                    className={`rt-status rt-status--${r.status.toLowerCase().replace(/\s+/g, '-')}`}
                    value={r.status}
                    onChange={(e) => onStatusChange(r.id, e.target.value as ReleaseStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="rt-td rt-td-date" title={r.uploadDate}>{relativeTime}</td>
                <td className="rt-td rt-td-actions">
                  {confirmingId === r.id ? (
                    <span className="rt-delete-confirm">
                      <button className="rt-delete-yes" onClick={() => { onDelete(r.id); setConfirmingId(null); }}>Yes</button>
                      <button className="rt-delete-no" onClick={() => setConfirmingId(null)}>No</button>
                    </span>
                  ) : (
                    <button className="rt-delete-btn" onClick={() => setConfirmingId(r.id)}>Delete</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hasMore && (
        <div className="rt-load-more">
          <button className="rt-load-btn" onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}>
            Load more ({sorted.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default ReleaseTable;

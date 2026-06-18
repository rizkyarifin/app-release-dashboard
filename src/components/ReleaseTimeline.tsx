import React, { useMemo, useState } from 'react';
import { startOfDay, subDays, isToday, isYesterday } from 'date-fns';
import ReleaseTimelineCard from './ReleaseTimelineCard';
import type { Release, ReleaseStatus } from '../types';

interface DateGroup {
  label: string;
  releases: Release[];
}

interface ReleaseTimelineProps {
  releases: Release[];
  onStatusChange: (id: number, status: ReleaseStatus) => void;
  onDelete: (id: number) => void;
}

const BATCH_SIZE = 20;

function groupByDate(releases: Release[]): DateGroup[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const weekStart = startOfDay(subDays(now, 7));

  const groups: Record<string, Release[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  for (const r of releases) {
    const d = new Date(r.uploadDate);
    if (isToday(d)) {
      groups['Today'].push(r);
    } else if (isYesterday(d)) {
      groups['Yesterday'].push(r);
    } else if (d >= weekStart) {
      groups['This Week'].push(r);
    } else {
      groups['Older'].push(r);
    }
  }

  return ['Today', 'Yesterday', 'This Week', 'Older']
    .map((label) => ({ label, releases: groups[label] }))
    .filter((g) => g.releases.length > 0);
}

const ReleaseTimeline: React.FC<ReleaseTimelineProps> = ({ releases, onStatusChange, onDelete }) => {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  const sorted = useMemo(
    () => [...releases].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()),
    [releases],
  );

  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const groups = useMemo(() => groupByDate(visible), [visible]);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="timeline">
      {groups.map((group) => (
        <div className="tl-group" key={group.label}>
          <div className="tl-group-header">
            <span className="tl-dot" />
            <h3 className="tl-group-label">{group.label}</h3>
            <span className="tl-group-count">{group.releases.length}</span>
          </div>
          <div className="tl-group-items">
            {group.releases.map((r) => (
              <ReleaseTimelineCard key={r.id} release={r} onStatusChange={onStatusChange} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <div className="tl-empty">No releases match your filters.</div>
      )}

      {hasMore && (
        <div className="tl-load-more">
          <button
            className="tl-load-btn"
            onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
          >
            Load more ({sorted.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default ReleaseTimeline;

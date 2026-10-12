/**
 * Activity Feed Component
 * Shows recent creator activity including announcements, tips, verification updates, and live events
 */

'use client';

import { useState, useMemo } from 'react';
import { ActivityFeedItem, ActivityFeedFilters, ActivityType } from '@/types';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bell,
  Gift,
  CheckCircle,
  Radio,
  Film,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  filters?: ActivityFeedFilters;
  onFilterChange?: (filters: ActivityFeedFilters) => void;
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  announcement: 'Announcement',
  tip: 'Tip',
  verification: 'Verification',
  live: 'Live',
  content: 'Content',
};

const ACTIVITY_TYPE_ICONS: Record<ActivityType, React.ReactNode> = {
  announcement: <Bell className="w-4 h-4" />,
  tip: <Gift className="w-4 h-4" />,
  verification: <CheckCircle className="w-4 h-4" />,
  live: <Radio className="w-4 h-4" />,
  content: <Film className="w-4 h-4" />,
};

const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  announcement: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  tip: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  verification: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  live: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  content: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export function ActivityFeed({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  filters,
  onFilterChange,
}: ActivityFeedProps): JSX.Element {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredItems = useMemo(() => {
    if (!filters?.type) return items;
    return items.filter((item) => item.type === filters.type);
  }, [items, filters?.type]);

  const handleFilterChange = (type: ActivityType | undefined) => {
    onFilterChange?.({ ...filters, type });
    setShowFilterDropdown(false);
  };

  return (
    <div className="bg-background border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Activity Feed
        </h2>

        {/* Filter Button */}
        {onFilterChange && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {filters?.type ? ACTIVITY_TYPE_LABELS[filters.type] : 'All Activity'}
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-10 p-2 space-y-1">
                <button
                  onClick={() => handleFilterChange(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    !filters?.type ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  All Activity
                </button>
                {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center gap-2 ${
                      filters?.type === type ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    {ACTIVITY_TYPE_ICONS[type]}
                    {ACTIVITY_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center p-8" role="status" aria-label="Loading activity">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No recent activity"
          description="Check back later or follow more creators to see their latest updates and announcements."
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ item }: { item: ActivityFeedItem }): JSX.Element {
  const typeColor = ACTIVITY_TYPE_COLORS[item.type];
  const typeIcon = ACTIVITY_TYPE_ICONS[item.type];
  const typeLabel = ACTIVITY_TYPE_LABELS[item.type];

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-muted hover:bg-muted/50 transition">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColor}`}>
        {typeIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold">{item.creatorName}</p>
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
              {item.isPublic === false && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium mb-1">{item.title}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
            )}
            {item.amount !== undefined && (
              <p className="text-sm font-bold text-green-600">{formatCurrency(item.amount)}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

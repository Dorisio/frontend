/**
 * Content Moderation Dashboard
 * Comprehensive moderation tool for creators to manage comments, tips, and user interactions
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Trash2,
  EyeOff,
  Check,
  UserX,
  History,
  Search,
  MoreVertical,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  ModerationItem,
  ModerationStatus,
  ModerationItemType,
  UserBlock,
  ModerationActionLog,
  ModerationStats,
} from '@/types';
import { formatDateTime } from '@/utils/formatters';

export interface ModerationDashboardProps {
  username: string;
}

const STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  hidden: 'Hidden',
  deleted: 'Deleted',
};

const STATUS_COLORS: Record<ModerationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  hidden: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  deleted: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

const TYPE_LABELS: Record<ModerationItemType, string> = {
  comment: 'Comment',
  tip_message: 'Tip Message',
  announcement: 'Announcement',
};

export function ModerationDashboard({ username }: ModerationDashboardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'items' | 'blocked' | 'history'>('items');
  const [filterStatus, setFilterStatus] = useState<ModerationStatus | undefined>();
  const [filterType, setFilterType] = useState<ModerationItemType | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Mock data - in production this would come from API
  const [stats, setStats] = useState<ModerationStats>({
    totalItems: 15,
    pendingItems: 3,
    blockedUsers: 1,
    reportsThisWeek: 5,
    actionsThisMonth: 8,
  });

  const [items, setItems] = useState<ModerationItem[]>([
    {
      id: '1',
      type: 'comment',
      content: 'Great content! Love your work!',
      authorId: 'user1',
      authorName: 'Fan123',
      creatorId: username,
      status: 'approved',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: '2',
      type: 'tip_message',
      content: 'This is inappropriate content that should be moderated',
      authorId: 'user2',
      authorName: 'SpamUser',
      creatorId: username,
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      reportCount: 3,
      isReported: true,
    },
    {
      id: '3',
      type: 'comment',
      content: 'Thanks for the amazing tutorial!',
      authorId: 'user3',
      authorName: 'Learner456',
      creatorId: username,
      status: 'approved',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: '4',
      type: 'announcement',
      content: 'Harassment message that needs to be removed',
      authorId: 'user4',
      authorName: 'Harasser789',
      creatorId: username,
      status: 'hidden',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      reportCount: 5,
      isReported: true,
    },
  ]);

  const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([
    {
      id: '1',
      creatorId: username,
      blockedUserId: 'user4',
      blockedUserName: 'Harasser789',
      reason: 'Harassment and inappropriate content',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      blockedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ]);

  const [actionLogs, setActionLogs] = useState<ModerationActionLog[]>([
    {
      id: '1',
      itemId: '4',
      action: 'hide_content',
      performedBy: username,
      performedByName: 'Creator Admin',
      targetUserId: 'user4',
      targetUserName: 'Harasser789',
      reason: 'Harassment',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: '2',
      itemId: '4',
      action: 'block_user',
      performedBy: username,
      performedByName: 'Creator Admin',
      targetUserId: 'user4',
      targetUserName: 'Harasser789',
      reason: 'Harassment and inappropriate content',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    const base = `/api/creators/${encodeURIComponent(username)}/moderation?action=`;
    void Promise.all([
      fetch(`${base}items`).then((response) => response.json()),
      fetch(`${base}blocked-users`).then((response) => response.json()),
      fetch(`${base}action-logs`).then((response) => response.json()),
      fetch(`${base}stats`).then((response) => response.json()),
    ]).then(([itemData, blockData, logData, statsData]) => {
      if (cancelled) return;
      setItems(itemData.items ?? []);
      setBlockedUsers(blockData.blockedUsers ?? []);
      setActionLogs(logData.actionLogs ?? []);
      setStats(statsData);
    }).catch(() => {
      if (!cancelled) setRequestError('Could not load moderation data. Please refresh and try again.');
    });
    return () => { cancelled = true; };
  }, [username]);

  const submitAction = async (action: string, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/creators/${encodeURIComponent(username)}/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, action }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error ?? `Moderation action failed (${response.status})`);
    }
    const result = await response.json();
    const auditResponse = await fetch(`/api/creators/${encodeURIComponent(username)}/moderation?action=action-logs`);
    if (auditResponse.ok) {
      const auditData = await auditResponse.json();
      setActionLogs(auditData.actionLogs ?? []);
    }
    return result;
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterType && item.type !== filterType) return false;
      if (searchQuery && !item.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, filterStatus, filterType, searchQuery]);

  const handleApprove = async (itemId: string) => {
    setLoading(true);
    try {
      await submitAction('approve-content', { itemId });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'approved' as ModerationStatus, updatedAt: new Date().toISOString() } : item
        )
      );
    } catch (error) {
      console.error('Failed to approve content:', error);
      setRequestError('Could not approve this item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (itemId: string) => {
    setLoading(true);
    try {
      await submitAction('hide-content', { itemId });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'hidden' as ModerationStatus, updatedAt: new Date().toISOString() } : item
        )
      );
    } catch (error) {
      console.error('Failed to hide content:', error);
      setRequestError('Could not hide this item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await submitAction('delete-content', { itemId });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'deleted' as ModerationStatus, updatedAt: new Date().toISOString() } : item
        )
      );
    } catch (error) {
      console.error('Failed to delete content:', error);
      setRequestError('Could not delete this item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    const reason = prompt('Enter reason for blocking this user:');
    if (!reason) return;

    setLoading(true);
    try {
      const result = await submitAction('block-user', { userId, userName, reason });
      const newBlock: UserBlock = result.block;

      setBlockedUsers((prev) => [...prev, newBlock]);

      // Add action log
      const newLog: ModerationActionLog = {
        id: Date.now().toString(),
        itemId: userId,
        action: 'block_user',
        performedBy: username,
        performedByName: username,
        targetUserId: userId,
        targetUserName: userName,
        reason,
        createdAt: new Date().toISOString(),
      };

      setActionLogs((prev) => [newLog, ...prev]);
    } catch (error) {
      console.error('Failed to block user:', error);
      setRequestError('Could not block this user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (blockId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    setLoading(true);
    try {
      const block = blockedUsers.find((entry) => entry.id === blockId);
      if (!block) return;
      await submitAction('unblock-user', { userId: block.blockedUserId });
      setBlockedUsers((prev) => prev.filter((block) => block.id !== blockId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      setRequestError('Could not unblock this user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Content Moderation
        </h2>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      {requestError && <p role="alert" className="text-sm text-destructive">{requestError}</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-background border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Items</div>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Blocked Users</div>
          <div className="text-2xl font-bold text-red-600">{stats.blockedUsers}</div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Reports This Week</div>
          <div className="text-2xl font-bold text-orange-600">{stats.reportsThisWeek}</div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Actions This Month</div>
          <div className="text-2xl font-bold text-blue-600">{stats.actionsThisMonth}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'items'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Content Items
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'blocked'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Blocked Users ({blockedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Action History
          </button>
        </div>
      </div>

      {/* Content Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value as ModerationStatus | undefined)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="hidden">Hidden</option>
              <option value="deleted">Deleted</option>
            </select>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value as ModerationItemType | undefined)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="">All Types</option>
              <option value="comment">Comments</option>
              <option value="tip_message">Tip Messages</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No content items found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <ModerationItemCard
                  key={item.id}
                  item={item}
                  onApprove={() => handleApprove(item.id)}
                  onHide={() => handleHide(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  onBlockUser={() => handleBlockUser(item.authorId, item.authorName)}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocked Users Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-3">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No blocked users
            </div>
          ) : (
            blockedUsers.map((block) => (
              <BlockedUserCard
                key={block.id}
                block={block}
                onUnblock={() => handleUnblockUser(block.id)}
                loading={loading}
              />
            ))
          )}
        </div>
      )}

      {/* Action History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {actionLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No action history
            </div>
          ) : (
            actionLogs.map((log) => (
              <ActionLogCard key={log.id} log={log} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ModerationItemCard({
  item,
  onApprove,
  onHide,
  onDelete,
  onBlockUser,
  loading,
}: {
  item: ModerationItem;
  onApprove: () => void;
  onHide: () => void;
  onDelete: () => void;
  onBlockUser: () => void;
  loading: boolean;
}): JSX.Element {
  const statusColor = STATUS_COLORS[item.status];
  const statusLabel = STATUS_LABELS[item.status];
  const typeLabel = TYPE_LABELS[item.type];

  return (
    <div className="bg-background border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {typeLabel}
            </Badge>
            <Badge className={`text-xs ${statusColor}`}>
              {statusLabel}
            </Badge>
            {item.isReported && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Reported ({item.reportCount})
              </Badge>
            )}
          </div>
          <p className="text-sm mb-2">{item.content}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>By {item.authorName}</span>
            <span>{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={loading}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status === 'pending' && (
              <DropdownMenuItem onClick={onApprove}>
                <Check className="w-4 h-4 mr-2" />
                Approve
              </DropdownMenuItem>
            )}
            {item.status !== 'hidden' && item.status !== 'deleted' && (
              <DropdownMenuItem onClick={onHide}>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlockUser} className="text-red-600">
              <Ban className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function BlockedUserCard({
  block,
  onUnblock,
  loading,
}: {
  block: UserBlock;
  onUnblock: () => void;
  loading: boolean;
}): JSX.Element {
  return (
    <div className="bg-background border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <UserX className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <div className="font-semibold">{block.blockedUserName}</div>
          <div className="text-sm text-muted-foreground">{block.reason}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Blocked {formatDateTime(block.blockedAt)}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onUnblock} disabled={loading}>
        Unblock
      </Button>
    </div>
  );
}

function ActionLogCard({ log }: { log: ModerationActionLog }): JSX.Element {
  const actionLabels: Record<string, string> = {
    block_user: 'Blocked User',
    unblock_user: 'Unblocked User',
    delete_content: 'Deleted Content',
    hide_content: 'Hidden Content',
    approve_content: 'Approved Content',
  };

  return (
    <div className="bg-background border rounded-lg p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
        <History className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">{actionLabels[log.action] || log.action}</div>
        {log.targetUserName && (
          <div className="text-sm text-muted-foreground">
            Target: {log.targetUserName}
          </div>
        )}
        {log.reason && (
          <div className="text-sm text-muted-foreground">Reason: {log.reason}</div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          {formatDateTime(log.createdAt)} by {log.performedByName}
        </div>
      </div>
    </div>
  );
}

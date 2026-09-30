/**
 * Moderation API Route
 * Handles content moderation for creators including comments, tips, and user blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ModerationItem,
  ModerationActionLog,
  UserBlock,
  ContentReport,
  ModerationStats,
  ModerationFilters,
} from '@/types';

// Mock data - in production this would come from a database
const mockModerationItems: ModerationItem[] = [
  {
    id: '1',
    type: 'comment',
    content: 'Great content! Love your work!',
    authorId: 'user1',
    authorName: 'Fan123',
    creatorId: 'creator1',
    status: 'approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    type: 'tip_message',
    content: 'This is inappropriate content that should be moderated',
    authorId: 'user2',
    authorName: 'SpamUser',
    creatorId: 'creator1',
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
    creatorId: 'creator1',
    status: 'approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    type: 'announcement',
    content: 'Harassment message that needs to be removed',
    authorId: 'user4',
    authorName: 'Harasser789',
    creatorId: 'creator1',
    status: 'hidden',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reportCount: 5,
    isReported: true,
  },
];

const mockBlockedUsers: UserBlock[] = [
  {
    id: '1',
    creatorId: 'creator1',
    blockedUserId: 'user4',
    blockedUserName: 'Harasser789',
    reason: 'Harassment and inappropriate content',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    blockedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const mockActionLogs: ModerationActionLog[] = [
  {
    id: '1',
    itemId: '4',
    action: 'hide_content',
    performedBy: 'creator1',
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
    performedBy: 'creator1',
    performedByName: 'Creator Admin',
    targetUserId: 'user4',
    targetUserName: 'Harasser789',
    reason: 'Harassment and inappropriate content',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const mockReports: ContentReport[] = [
  {
    id: '1',
    itemId: '2',
    itemType: 'tip_message',
    reportedBy: 'user5',
    reportedByName: 'ConcernedUser',
    reason: 'spam',
    description: 'This looks like spam content',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

const mockStats: ModerationStats = {
  totalItems: 15,
  pendingItems: 3,
  blockedUsers: 1,
  reportsThisWeek: 5,
  actionsThisMonth: 8,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Handle different actions
    if (action === 'items') {
      return getModerationItems(searchParams, username);
    } else if (action === 'blocked-users') {
      return getBlockedUsers(username);
    } else if (action === 'action-logs') {
      return getActionLogs(username);
    } else if (action === 'reports') {
      return getReports(username);
    } else if (action === 'stats') {
      return getStats(username);
    } else {
      // Return stats by default
      return getStats(username);
    }
  } catch (error) {
    console.error('Error fetching moderation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const body = await request.json();
    const { action } = body;

    if (action === 'block-user') {
      return blockUser(body, username);
    } else if (action === 'unblock-user') {
      return unblockUser(body, username);
    } else if (action === 'delete-content') {
      return deleteContent(body, username);
    } else if (action === 'hide-content') {
      return hideContent(body, username);
    } else if (action === 'approve-content') {
      return approveContent(body, username);
    } else if (action === 'report-content') {
      return reportContent(body, username);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing moderation action:', error);
    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}

function getModerationItems(searchParams: URLSearchParams, username: string) {
  const status = searchParams.get('status') as ModerationFilters['status'] | null;
  const type = searchParams.get('type') as ModerationFilters['type'] | null;
  const reportedOnly = searchParams.get('reportedOnly') === 'true';

  let filteredItems = [...mockModerationItems];

  if (status) {
    filteredItems = filteredItems.filter((item) => item.status === status);
  }

  if (type) {
    filteredItems = filteredItems.filter((item) => item.type === type);
  }

  if (reportedOnly) {
    filteredItems = filteredItems.filter((item) => item.isReported);
  }

  // Sort by creation date (newest first)
  filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items: filteredItems, total: filteredItems.length });
}

function getBlockedUsers(username: string) {
  return NextResponse.json({ blockedUsers: mockBlockedUsers, total: mockBlockedUsers.length });
}

function getActionLogs(username: string) {
  return NextResponse.json({ actionLogs: mockActionLogs, total: mockActionLogs.length });
}

function getReports(username: string) {
  return NextResponse.json({ reports: mockReports, total: mockReports.length });
}

function getStats(username: string) {
  return NextResponse.json(mockStats);
}

function blockUser(body: any, username: string) {
  const { userId, userName, reason } = body;

  const newBlock: UserBlock = {
    id: Date.now().toString(),
    creatorId: username,
    blockedUserId: userId,
    blockedUserName: userName,
    reason,
    createdAt: new Date().toISOString(),
    blockedAt: new Date().toISOString(),
  };

  mockBlockedUsers.push(newBlock);

  // Add action log
  const actionLog: ModerationActionLog = {
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

  mockActionLogs.push(actionLog);

  return NextResponse.json({ success: true, block: newBlock });
}

function unblockUser(body: any, username: string) {
  const { userId } = body;

  const index = mockBlockedUsers.findIndex((block) => block.blockedUserId === userId);
  if (index !== -1) {
    mockBlockedUsers.splice(index, 1);
  }

  return NextResponse.json({ success: true });
}

function deleteContent(body: any, username: string) {
  const { itemId } = body;

  const index = mockModerationItems.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    mockModerationItems[index].status = 'deleted';
    mockModerationItems[index].updatedAt = new Date().toISOString();
    recordAction(username, itemId, 'delete_content');
  }

  return NextResponse.json({ success: true });
}

function hideContent(body: any, username: string) {
  const { itemId } = body;

  const index = mockModerationItems.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    mockModerationItems[index].status = 'hidden';
    mockModerationItems[index].updatedAt = new Date().toISOString();
    recordAction(username, itemId, 'hide_content');
  }

  return NextResponse.json({ success: true });
}

function approveContent(body: any, username: string) {
  const { itemId } = body;

  const index = mockModerationItems.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    mockModerationItems[index].status = 'approved';
    mockModerationItems[index].updatedAt = new Date().toISOString();
    recordAction(username, itemId, 'approve_content');
  }

  return NextResponse.json({ success: true });
}

function recordAction(
  username: string,
  itemId: string,
  action: ModerationActionLog['action'],
  reason?: string
) {
  const item = mockModerationItems.find((entry) => entry.id === itemId);
  mockActionLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    action,
    performedBy: username,
    performedByName: username,
    targetUserId: item?.authorId,
    targetUserName: item?.authorName,
    reason,
    createdAt: new Date().toISOString(),
  });
}

function reportContent(body: any, username: string) {
  const { itemId, itemType, reason, description, reportedBy, reportedByName } = body;

  const newReport: ContentReport = {
    id: Date.now().toString(),
    itemId,
    itemType,
    reportedBy,
    reportedByName,
    reason,
    description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  mockReports.push(newReport);

  // Update item report count
  const itemIndex = mockModerationItems.findIndex((item) => item.id === itemId);
  if (itemIndex !== -1) {
    mockModerationItems[itemIndex].isReported = true;
    mockModerationItems[itemIndex].reportCount = (mockModerationItems[itemIndex].reportCount || 0) + 1;
  }

  return NextResponse.json({ success: true, report: newReport });
}

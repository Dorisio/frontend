import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const params = { params: { username: 'creator1' } };

describe('creator moderation API', () => {
  it('persists a moderation action in the action history', async () => {
    const request = new NextRequest('http://localhost/api/creators/creator1/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hide-content', itemId: '3' }),
    });

    const response = await POST(request, params);
    expect(response.status).toBe(200);

    const historyResponse = await GET(
      new NextRequest('http://localhost/api/creators/creator1/moderation?action=action-logs'),
      params
    );
    const history = await historyResponse.json();

    expect(history.actionLogs[0]).toMatchObject({
      itemId: '3',
      action: 'hide_content',
      performedBy: 'creator1',
    });
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommissionRequests } from './commission-requests';
import {
  COMMISSIONS_STORAGE_KEY,
  createCommissionRequest,
  getCommissionById,
  getCommissionsForSupporter,
} from '@/lib/commissions';

const creator = {
  creatorId: 'creator-a',
  creatorUserId: 'user-a',
  creatorUsername: 'alpha',
  creatorName: 'Alpha Creator',
};

const supporterViewer = {
  viewerId: 'supporter-b',
  viewerUserId: 'user-b',
  viewerUsername: 'beta',
  viewerName: 'Beta Supporter',
};

const creatorViewer = {
  viewerId: 'creator-a',
  viewerUserId: 'user-a',
  viewerUsername: 'alpha',
  viewerName: 'Alpha Creator',
};

function seedRequest(price = 75) {
  return createCommissionRequest({
    ...creator,
    supporterId: supporterViewer.viewerId,
    supporterUserId: supporterViewer.viewerUserId,
    supporterUsername: supporterViewer.viewerUsername,
    supporterName: supporterViewer.viewerName,
    title: 'Custom portrait',
    description: 'A portrait of my character in your style.',
    price,
  });
}

beforeEach(() => {
  window.localStorage.removeItem(COMMISSIONS_STORAGE_KEY);
});

afterEach(() => {
  window.localStorage.removeItem(COMMISSIONS_STORAGE_KEY);
});

describe('CommissionRequests', () => {
  it('submits a commission request from the supporter form', () => {
    render(<CommissionRequests {...creator} {...supporterViewer} role="supporter" />);

    fireEvent.change(screen.getByTestId('commission-title-input'), {
      target: { value: 'Custom portrait' },
    });
    fireEvent.change(screen.getByTestId('commission-description-input'), {
      target: { value: 'A portrait of my character.' },
    });
    fireEvent.change(screen.getByTestId('commission-price-input'), { target: { value: '75' } });
    fireEvent.click(screen.getByTestId('commission-submit-button'));

    expect(screen.getByText(/request sent to @alpha/i)).toBeInTheDocument();
    expect(screen.getByText('Custom portrait')).toBeInTheDocument();

    const [stored] = getCommissionsForSupporter(supporterViewer.viewerId);
    expect(stored).toMatchObject({ title: 'Custom portrait', price: 75, status: 'pending' });
  });

  it('shows a validation error when the form is incomplete', () => {
    render(<CommissionRequests {...creator} {...supporterViewer} role="supporter" />);

    fireEvent.change(screen.getByTestId('commission-title-input'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('commission-submit-button'));

    expect(screen.getByRole('alert')).toHaveTextContent(/title/i);
  });

  it('runs the full approve, pay, and complete workflow across both parties', () => {
    const request = seedRequest();

    const supporter = render(
      <CommissionRequests {...creator} {...supporterViewer} role="supporter" />
    );
    expect(screen.getByTestId(`commission-row-${request.id}`)).toHaveTextContent('pending');
    expect(screen.queryByTestId(`commission-pay-${request.id}`)).not.toBeInTheDocument();
    supporter.unmount();

    const creatorPanel = render(
      <CommissionRequests {...creator} {...creatorViewer} role="creator" />
    );
    expect(screen.getByTestId(`commission-incoming-${request.id}`)).toHaveTextContent('Custom portrait');
    fireEvent.click(screen.getByTestId(`commission-approve-${request.id}`));
    expect(getCommissionById(request.id)?.status).toBe('approved');
    creatorPanel.unmount();

    const supporterAgain = render(
      <CommissionRequests {...creator} {...supporterViewer} role="supporter" />
    );
    fireEvent.click(screen.getByTestId(`commission-pay-${request.id}`));
    expect(getCommissionById(request.id)?.paymentStatus).toBe('paid');
    supporterAgain.unmount();

    render(<CommissionRequests {...creator} {...creatorViewer} role="creator" />);
    fireEvent.click(screen.getByTestId(`commission-complete-${request.id}`));
    expect(getCommissionById(request.id)?.status).toBe('completed');
    expect(screen.getByTestId(`commission-row-${request.id}`)).toHaveTextContent('completed');
  });

  it('lets a creator decline a request with a reason visible to the supporter', () => {
    const request = seedRequest();

    const creatorPanel = render(
      <CommissionRequests {...creator} {...creatorViewer} role="creator" />
    );
    fireEvent.change(screen.getByTestId(`commission-decline-reason-${request.id}`), {
      target: { value: 'Fully booked this month' },
    });
    fireEvent.click(screen.getByTestId(`commission-decline-${request.id}`));
    expect(getCommissionById(request.id)?.status).toBe('declined');
    creatorPanel.unmount();

    render(<CommissionRequests {...creator} {...supporterViewer} role="supporter" />);
    expect(screen.getByText('Fully booked this month')).toBeInTheDocument();
    expect(screen.queryByTestId(`commission-pay-${request.id}`)).not.toBeInTheDocument();
  });

  it('shows an empty state for each party', () => {
    render(<CommissionRequests {...creator} {...supporterViewer} role="supporter" />);
    expect(screen.getByTestId('commission-empty-state')).toBeInTheDocument();
  });
});

'use client';

/**
 * Scheduled Tips Dashboard Component
 * Displays scheduled and recurring tips with live countdowns, edit, cancel, and execution controls
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useScheduledTips } from '@/hooks/use-scheduled-tips';
import { useSafeTimeout } from '@/hooks/use-timeout';
import { getCountdown, CountdownInfo } from '@/stores/scheduled-tips-store';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ScheduledTip, ScheduledTipFrequency } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Calendar, Clock, Edit2, XCircle, Play, CheckCircle } from 'lucide-react';

interface ScheduledTipsDashboardProps {
  creatorId: string;
}

export function ScheduledTipsDashboard({ creatorId }: ScheduledTipsDashboardProps): JSX.Element {
  const { scheduledTips, pendingTips, editScheduledTip, cancelScheduledTip, executeScheduledTip } =
    useScheduledTips(creatorId);
  const { schedule } = useSafeTimeout();

  // Live countdown timer state (ticks every 10 seconds for real-time update)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return (): void => clearInterval(timer);
  }, []);

  // Editing state
  const [editingTip, setEditingTip] = useState<ScheduledTip | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editFrequency, setEditFrequency] = useState<ScheduledTipFrequency>('once');
  const [editMessage, setEditMessage] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showStatus = (msg: string): void => {
    setActionSuccess(msg);
    // Tracked so the timer is cleared if the dashboard unmounts first.
    schedule(() => setActionSuccess(null), 4000);
  };

  const handleStartEdit = (tip: ScheduledTip): void => {
    setEditingTip(tip);
    setEditAmount(tip.amount.toString());
    setEditDate(new Date(tip.scheduledDate));
    setEditFrequency(tip.frequency);
    setEditMessage(tip.message || '');
    setEditError(null);
  };

  const handleCancelEdit = (): void => {
    setEditingTip(null);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!editingTip) return;

    const amountNum = parseFloat(editAmount.trim());
    if (isNaN(amountNum) || amountNum <= 0) {
      setEditError('Please enter a valid amount greater than $0.');
      return;
    }

    if (!editDate) {
      setEditError('Please select a valid scheduled date.');
      return;
    }

    if (editDate.getTime() <= Date.now()) {
      setEditError('Scheduled date must be in the future.');
      return;
    }

    const success = editScheduledTip(editingTip.id, {
      amount: amountNum,
      scheduledDate: editDate,
      frequency: editFrequency,
      message: editMessage || undefined,
    });

    if (success) {
      showStatus(`Updated scheduled tip to $${amountNum}`);
      setEditingTip(null);
    } else {
      setEditError('Failed to update scheduled tip.');
    }
  };

  const handleCancelTip = (tipId: string): void => {
    const success = cancelScheduledTip(tipId);
    if (success) {
      showStatus('Cancelled scheduled tip.');
    }
  };

  const handleExecuteNow = async (tipId: string): Promise<void> => {
    const success = await executeScheduledTip(tipId);
    if (success) {
      showStatus('Successfully processed scheduled tip!');
    }
  };

  const getFrequencyBadgeVariant = (freq: ScheduledTipFrequency): 'default' | 'secondary' | 'outline' => {
    switch (freq) {
      case 'daily':
        return 'secondary';
      case 'weekly':
        return 'default';
      case 'monthly':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="p-6 mb-6" data-testid="scheduled-tips-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Scheduled & Recurring Tips</h2>
            {pendingTips.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingTips.length} Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Planned surprise tips and automated recurring creator support with countdowns.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div
          role="status"
          className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Edit Form Modal/Drawer */}
      {editingTip && (
        <div
          className="mb-6 p-4 border rounded-lg bg-card shadow-sm space-y-4 animate-fade-in"
          data-testid="edit-scheduled-tip-form"
        >
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-sm">Edit Scheduled Tip</h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tip-amount">Amount (USDC)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="edit-tip-amount"
                    type="number"
                    min="0.01"
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="pl-7"
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-tip-date">Scheduled Date & Time</Label>
                <div className="mt-1">
                  <DateTimePicker
                    id="edit-tip-date"
                    selected={editDate}
                    onChange={(d: Date | null) => setEditDate(d)}
                    minDate={new Date()}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Frequency</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {(['once', 'daily', 'weekly', 'monthly'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setEditFrequency(f)}
                    className={`py-1.5 px-2 text-xs font-medium rounded border capitalize transition ${
                      editFrequency === f
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tip-message">Message (Optional)</Label>
              <Input
                id="edit-tip-message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Add a surprise note"
                className="mt-1"
              />
            </div>

            {editError && (
              <p role="alert" className="text-xs text-destructive">
                {editError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Tips List */}
      {scheduledTips.length === 0 ? (
        <div className="p-8 border border-dashed rounded-lg text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-medium text-sm">No scheduled tips yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tips scheduled for birthdays, anniversaries, or recurring dates will appear here with
            live countdowns.
          </p>
        </div>
      ) : (
        <div className="space-y-3" aria-label="Scheduled tips list">
          {scheduledTips.map((tip) => {
            const countdown: CountdownInfo = getCountdown(tip.scheduledDate);
            const isPending = tip.status === 'pending';

            return (
              <div
                key={tip.id}
                className={`p-4 border rounded-lg transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isPending
                    ? 'bg-background hover:border-primary/50'
                    : tip.status === 'executed'
                      ? 'bg-muted/20 opacity-80'
                      : 'bg-muted/10 opacity-60'
                }`}
                data-testid={`scheduled-tip-item-${tip.id}`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-lg">{formatCurrency(tip.amount)}</span>
                    <Badge variant={getFrequencyBadgeVariant(tip.frequency)} className="capitalize text-xs">
                      {tip.frequency}
                    </Badge>
                    <Badge
                      variant={
                        tip.status === 'executed'
                          ? 'success'
                          : tip.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="capitalize text-xs"
                    >
                      {tip.status}
                    </Badge>
                  </div>

                  {tip.message && (
                    <p className="text-sm text-muted-foreground truncate" title={tip.message}>
                      &quot;{tip.message}&quot;
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(tip.scheduledDate)}</span>
                    </div>

                    {isPending && (
                      <div
                        className="flex items-center gap-1 font-semibold text-primary"
                        aria-label={`Countdown: ${countdown.formatted}`}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Due {countdown.formatted}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions for pending tips */}
                {isPending && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(tip)}
                      className="h-8 px-2.5 text-xs flex items-center gap-1"
                      aria-label={`Edit scheduled tip ${tip.id}`}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelTip(tip.id)}
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-1"
                      aria-label={`Cancel scheduled tip ${tip.id}`}
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Cancel</span>
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleExecuteNow(tip.id)}
                      className="h-8 px-2.5 text-xs flex items-center gap-1"
                      title="Simulate / Trigger immediate execution"
                    >
                      <Play className="h-3 w-3" />
                      <span>Execute</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

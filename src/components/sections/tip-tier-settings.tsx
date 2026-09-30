'use client';

/**
 * Tip Tier Settings Component
 * Allows creators to configure suggested tip presets in their dashboard
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTipTiers } from '@/hooks/use-tip-tiers';
import { useSafeTimeout } from '@/hooks/use-timeout';

interface TipTierSettingsProps {
  creatorId: string;
}

export function TipTierSettings({ creatorId }: TipTierSettingsProps): JSX.Element {
  const { tiers, addTier, removeTier, resetTiers } = useTipTiers(creatorId);
  const { schedule } = useSafeTimeout();
  const [newTierAmount, setNewTierAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showNotification = (message: string): void => {
    setSuccessMessage(message);
    schedule(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleAddTier = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    const amount = parseFloat(newTierAmount.trim());

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }

    if (tiers.includes(amount)) {
      setError(`$${amount} is already in your preset tiers.`);
      return;
    }

    if (tiers.length >= 8) {
      setError('You can have at most 8 preset tiers. Remove one first.');
      return;
    }

    addTier(amount);
    setNewTierAmount('');
    setError(null);
    showNotification(`Added $${amount} to preset tiers`);
  };

  const handleRemoveTier = (amount: number): void => {
    if (tiers.length <= 1) {
      setError('You must have at least one preset tip tier.');
      return;
    }
    removeTier(amount);
    setError(null);
    showNotification(`Removed $${amount} from preset tiers`);
  };

  const handleReset = (): void => {
    resetTiers();
    setError(null);
    showNotification('Reset preset tiers to default ($1, $5, $10, $25)');
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold">Suggested Tip Presets</h2>
          <p className="text-sm text-muted-foreground">
            Configure preset quick-tip buttons displayed to supporters (ordered low to high).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="self-start sm:self-auto text-xs"
        >
          Reset to Defaults
        </Button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm"
        >
          {successMessage}
        </div>
      )}

      {/* Active Tiers Display */}
      <div className="space-y-3 mb-6">
        <Label>Current Presets ({tiers.length})</Label>
        <div
          className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-lg border min-h-[52px] items-center"
          aria-label="Configured tip tiers"
        >
          {tiers.map((tier) => (
            <div
              key={tier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-md text-sm font-semibold shadow-sm"
            >
              <span>${tier}</span>
              <button
                type="button"
                onClick={() => handleRemoveTier(tier)}
                aria-label={`Remove $${tier} tier`}
                className="text-muted-foreground hover:text-destructive rounded p-0.5 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Tier Form */}
      <form noValidate onSubmit={handleAddTier} className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <Label htmlFor="new-tier-input" className="sr-only">
              Add tier amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="new-tier-input"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 50"
                value={newTierAmount}
                onChange={(e) => {
                  setNewTierAmount(e.target.value);
                  setError(null);
                }}
                className="pl-7"
              />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Add Preset Tier
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      {/* Live Preview */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
            Supporter View Preview (Mobile Layout)
          </Label>
          <span className="text-xs text-muted-foreground">
            {tiers.length} preset buttons + Custom
          </span>
        </div>
        <div className="p-4 bg-muted/20 border rounded-lg space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <div
                key={`preview-${tier}`}
                className="py-2 px-3 border rounded text-center font-semibold text-sm bg-background text-foreground shadow-xs"
              >
                ${tier}
              </div>
            ))}
            <div className="py-2 px-3 border border-dashed rounded text-center text-sm font-medium text-muted-foreground">
              Custom
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

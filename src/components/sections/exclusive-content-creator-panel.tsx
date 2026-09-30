'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSafeTimeout } from '@/hooks/use-timeout';
import {
  useExclusiveContentStore,
  type SupporterTierLevel,
  DEFAULT_TIER_THRESHOLDS,
} from '@/stores/exclusive-content-store';

export interface ExclusiveContentCreatorPanelProps {
  creatorId: string;
}

export function ExclusiveContentCreatorPanel({
  creatorId,
}: ExclusiveContentCreatorPanelProps): JSX.Element {
  const contentList = useExclusiveContentStore((state) =>
    state.getContentForCreator(creatorId)
  );
  const addContent = useExclusiveContentStore((state) => state.addContent);
  const deleteContent = useExclusiveContentStore((state) => state.deleteContent);
  const { schedule } = useSafeTimeout();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [previewSnippet, setPreviewSnippet] = useState('');
  const [tier, setTier] = useState<SupporterTierLevel>('bronze');
  const [amount, setAmount] = useState<number>(DEFAULT_TIER_THRESHOLDS.bronze);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTierChange = (selectedTier: SupporterTierLevel) => {
    setTier(selectedTier);
    setAmount(DEFAULT_TIER_THRESHOLDS[selectedTier]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addContent(creatorId, {
      title: title.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
      previewSnippet: previewSnippet.trim() || undefined,
      requiredTier: tier,
      requiredAmount: Number(amount) || DEFAULT_TIER_THRESHOLDS[tier],
    });

    setTitle('');
    setDescription('');
    setContent('');
    setPreviewSnippet('');
    setIsOpenForm(false);
    setSuccessMessage('Tier-exclusive content published successfully!');
    schedule(() => setSuccessMessage(null), 4000);
  };

  return (
    <Card className="border border-border/80 shadow-sm" data-testid="exclusive-content-creator-panel">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Tier-Locked & Exclusive Content
          </CardTitle>
          <CardDescription>
            Reward your highest-tier supporters with exclusive posts, downloads, and insider updates.
          </CardDescription>
        </div>

        <Button
          onClick={() => setIsOpenForm(!isOpenForm)}
          className="flex items-center gap-1.5"
          data-testid="create-exclusive-content-button"
        >
          <Plus className="h-4 w-4" />
          {isOpenForm ? 'Cancel' : 'Create Exclusive Post'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Creation Form */}
        {isOpenForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 rounded-lg bg-card/50 border border-primary/20"
            data-testid="exclusive-content-form"
          >
            <h3 className="font-semibold text-base">New Tier-Exclusive Content</h3>

            <div className="space-y-1.5">
              <Label htmlFor="content-title">Post Title *</Label>
              <Input
                id="content-title"
                placeholder="e.g. Unreleased Track Download & Stems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="content-title-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="required-tier">Required Supporter Tier</Label>
                <select
                  id="required-tier"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={tier}
                  onChange={(e) => handleTierChange(e.target.value as SupporterTierLevel)}
                  data-testid="tier-select"
                >
                  <option value="bronze">Bronze ($5+)</option>
                  <option value="silver">Silver ($15+)</option>
                  <option value="gold">Gold ($30+)</option>
                  <option value="platinum">Platinum ($50+)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="required-amount">Minimum Required Tip ($)</Label>
                <Input
                  id="required-amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  data-testid="amount-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preview-snippet">Public Teaser / Preview Snippet</Label>
              <Input
                id="preview-snippet"
                placeholder="Brief teaser visible before unlocking..."
                value={previewSnippet}
                onChange={(e) => setPreviewSnippet(e.target.value)}
                data-testid="preview-snippet-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exclusive-body">Exclusive Content (Locked) *</Label>
              <textarea
                id="exclusive-body"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write the exclusive content, attach secret links, or provide supporter instructions..."
                rows={4}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                required
                data-testid="content-body-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="publish-exclusive-content-button">
                Publish to Tier
              </Button>
            </div>
          </form>
        )}

        {/* Existing Content Items List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Active Tier-Exclusive Posts ({contentList.length})
          </h4>

          {contentList.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm">No tier-locked content created yet</p>
              <p className="text-xs mt-1">
                Reward your top tippers with exclusive posts by clicking "Create Exclusive Post".
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {contentList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border bg-card/40 hover:bg-card/70 transition-colors"
                  data-testid={`creator-content-item-${item.id}`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {item.title}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {item.requiredTier} (${item.requiredAmount})
                      </Badge>
                    </div>
                    {item.previewSnippet && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Teaser: {item.previewSnippet}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteContent(creatorId, item.id)}
                    aria-label={`Delete ${item.title}`}
                    data-testid={`delete-content-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

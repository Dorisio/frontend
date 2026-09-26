'use client';

import { useRef } from 'react';
import { Bold, Italic, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CREATOR_BIO_MAX_LENGTH, renderCreatorBio } from '@/utils/creator-bio';

interface CreatorBioProps {
  value: string;
  className?: string;
}

export function CreatorBio({ value, className = '' }: CreatorBioProps): JSX.Element | null {
  if (!value.trim()) return null;

  return (
    <div
      className={`creator-bio prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: renderCreatorBio(value) }}
    />
  );
}

interface CreatorBioEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CreatorBioEditor({ value, onChange }: CreatorBioEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(nextValue.slice(0, CREATOR_BIO_MAX_LENGTH));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = Math.min(start + before.length + selected.length + after.length, CREATOR_BIO_MAX_LENGTH);
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Bio formatting">
        <Button type="button" variant="outline" size="icon" title="Bold" aria-label="Bold" onClick={() => insertMarkdown('**', '**', 'bold text')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" title="Italic" aria-label="Italic" onClick={() => insertMarkdown('*', '*', 'italic text')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" title="Link" aria-label="Link" onClick={() => insertMarkdown('[', '](https://)', 'link text')}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        maxLength={CREATOR_BIO_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value.slice(0, CREATOR_BIO_MAX_LENGTH))}
        placeholder="Tell supporters about yourself (Markdown is supported)"
        rows={6}
        className="mt-2 w-full resize-y rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Creator bio"
      />
      <div className="flex justify-end text-xs text-muted-foreground">
        {value.length}/{CREATOR_BIO_MAX_LENGTH}
      </div>
      <div className="rounded-lg border bg-muted/30 p-4" aria-label="Bio preview">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
        {value.trim() ? <CreatorBio value={value} /> : <p className="text-sm text-muted-foreground">Your formatted bio will appear here.</p>}
      </div>
    </div>
  );
}

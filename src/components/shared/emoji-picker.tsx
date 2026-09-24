/**
 * Emoji Picker Component
 * Provides common emojis for quick tip message enhancement
 */

'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';

const POPULAR_EMOJIS = [
  '❤️',
  '😍',
  '🔥',
  '💯',
  '👏',
  '🎉',
  '✨',
  '🚀',
  '💪',
  '🙏',
  '😊',
  '😎',
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string): void => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-muted rounded transition"
        title="Add emoji"
        aria-label="Open emoji picker"
      >
        <Smile className="w-5 h-5" style={{ color: 'var(--body)' }} />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 p-3 border rounded-lg shadow-lg grid grid-cols-6 gap-2 z-50"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--hairline)',
          }}
        >
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-xl hover:scale-125 transition-transform cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

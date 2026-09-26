export const TIP_MESSAGE_MAX_LENGTH = 255;

const FLAGGED_WORDS = ['scam', 'spam', 'fraud', 'hate', 'idiot', 'stupid'];

export function normalizeTipMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}

export function validateTipMessage(message: string): string | null {
  const normalized = normalizeTipMessage(message);

  if (normalized.length > TIP_MESSAGE_MAX_LENGTH) {
    return `Message must be ${TIP_MESSAGE_MAX_LENGTH} characters or fewer.`;
  }

  const hasFlaggedWord = FLAGGED_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(normalized);
  });

  if (hasFlaggedWord) {
    return 'Message contains flagged language. Please edit it before sending.';
  }

  return null;
}

export function appendEmoji(message: string, emoji: string): string {
  const separator = message.length > 0 && !message.endsWith(' ') ? ' ' : '';
  return `${message}${separator}${emoji}`.slice(0, TIP_MESSAGE_MAX_LENGTH);
}

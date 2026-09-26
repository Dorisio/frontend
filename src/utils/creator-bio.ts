import DOMPurify from 'dompurify';
import { marked } from 'marked';

export const CREATOR_BIO_MAX_LENGTH = 500;

const bareUrlPattern = /(^|\s)(https?:\/\/[^\s<]+)/g;

function linkifyBareUrls(value: string): string {
  return value.replace(bareUrlPattern, (_match, prefix: string, url: string) => {
    const trailingPunctuation = url.match(/[.,!?;:)]*$/)?.[0] ?? '';
    const cleanUrl = trailingPunctuation ? url.slice(0, -trailingPunctuation.length) : url;
    return `${prefix}[${cleanUrl}](${cleanUrl})${trailingPunctuation}`;
  });
}

function removeUnsafeMarkup(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\[([^\]]+)\]\(\s*(?:javascript|data|vbscript):[^)]*\)/gi, '$1');
}

export function renderCreatorBio(value: string): string {
  const source = removeUnsafeMarkup(value.slice(0, CREATOR_BIO_MAX_LENGTH));
  const html = marked.parse(linkifyBareUrls(source), { gfm: true, breaks: true }) as string;

  return DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_TAGS: ['a', 'br', 'em', 'h1', 'h2', 'h3', 'li', 'ol', 'p', 'strong', 'ul'],
  }).replace(/<a href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
}

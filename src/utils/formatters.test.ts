import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPublicKey,
  formatTransactionHash,
  getStatusColor,
  getStatusLabel,
  getUserTimezone,
  getUserTimezoneShort,
} from './formatters';

describe('Formatters', () => {
  describe('formatDate', () => {
    it('formats a date string consistently', () => {
      const result = formatDate('2025-01-12T15:45:00Z');
      expect(result).toMatch(/Jan 12, 2025/);
    });

    it('formats a Date object consistently', () => {
      const date = new Date('2025-06-20T10:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jun 20, 2025/);
    });

    it('includes timezone label when option is set', () => {
      const result = formatDate('2025-01-12T15:45:00Z', { includeTimezone: true });
      expect(result).toMatch(/Jan 12, 2025 \(.+\)/);
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time in user timezone with timezone indicator', () => {
      const result = formatDateTime('2025-01-12T15:45:00Z');
      expect(result).toMatch(/Jan 12, 2025/);
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      // timezone short indicator is included
      expect(result.length).toBeGreaterThan('Jan 12, 2025, 3:45 PM'.length);
    });

    it('allows excluding timezone indicator', () => {
      const result = formatDateTime('2025-01-12T15:45:00Z', { includeTimezone: false });
      expect(result).toMatch(/Jan 12, 2025/);
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDateTime('')).toBe('');
      expect(formatDateTime('invalid-date')).toBe('');
    });
  });

  describe('timezone helpers', () => {
    it('returns a valid user timezone', () => {
      const tz = getUserTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });

    it('returns a valid short timezone', () => {
      const shortTz = getUserTimezoneShort();
      expect(typeof shortTz).toBe('string');
      expect(shortTz.length).toBeGreaterThan(0);
    });
  });

  describe('other formatters', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
    });

    it('formats numbers correctly', () => {
      expect(formatNumber(1500)).toBe('1.50K');
      expect(formatNumber(2000000)).toBe('2.00M');
      expect(formatNumber(42)).toBe('42.00');
    });

    it('formats public keys', () => {
      expect(formatPublicKey('GBVPUBKEY1234567890')).toBe('GBVP...7890');
      expect(formatPublicKey('short')).toBe('short');
    });

    it('formats transaction hashes', () => {
      expect(formatTransactionHash('0123456789abcdef0123456789abcdef')).toBe('01234567...89abcdef');
      expect(formatTransactionHash('short')).toBe('short');
    });

    it('returns correct status color and label', () => {
      expect(getStatusColor('confirmed')).toBe('green');
      expect(getStatusColor('pending')).toBe('yellow');
      expect(getStatusColor('failed')).toBe('red');

      expect(getStatusLabel('confirmed')).toBe('Confirmed');
      expect(getStatusLabel('pending')).toBe('Pending');
    });
  });
});

/**
 * Timezone Utility Tests
 * 
 * FIXED: Simplified tests without direct Temporal API usage
 */

import {
  validateTimezone,
  isFutureTime,
  calculateDelay,
  toUserTimezone,
  toUtcIsoString,
  normalizeToUtc,
  isSameInstant,
  nowUtc,
  addDuration,
  subtractDuration,
  formatForDisplay,
} from '../src/utils/timezone.util';
import { BadRequestError } from '../src/utils/errors.util';

describe('Timezone Utilities', () => {
  describe('validateTimezone', () => {
    it('should validate correct IANA timezone identifiers', () => {
      expect(() => validateTimezone('America/New_York')).not.toThrow();
      expect(() => validateTimezone('Europe/London')).not.toThrow();
      expect(() => validateTimezone('Asia/Tokyo')).not.toThrow();
      expect(() => validateTimezone('UTC')).not.toThrow();
    });

    it('should throw BadRequestError for invalid timezones', () => {
      expect(() => validateTimezone('Invalid/Timezone')).toThrow(BadRequestError);
      expect(() => validateTimezone('NotATimezone')).toThrow(BadRequestError);
      expect(() => validateTimezone('')).toThrow(BadRequestError);
    });
  });

  describe('isFutureTime', () => {
    it('should return true for future times', () => {
      const futureTime = new Date(Date.now() + 60000).toISOString();
      expect(isFutureTime(futureTime)).toBe(true);
    });

    it('should return false for past times', () => {
      const pastTime = new Date(Date.now() - 60000).toISOString();
      expect(isFutureTime(pastTime)).toBe(false);
    });

    it('should throw BadRequestError for invalid ISO strings', () => {
      expect(() => isFutureTime('not-a-date')).toThrow(BadRequestError);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate correct delay for future times', () => {
      const futureTime = new Date(Date.now() + 5000).toISOString();
      const delay = calculateDelay(futureTime);
      
      // Allow small margin for test execution time
      expect(delay).toBeGreaterThanOrEqual(4900);
      expect(delay).toBeLessThanOrEqual(5100);
    });

    it('should throw BadRequestError for past times', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString();
      expect(() => calculateDelay(pastTime)).toThrow(BadRequestError);
      expect(() => calculateDelay(pastTime)).toThrow('must be in the future');
    });
  });

  describe('toUserTimezone', () => {
    it('should convert UTC to user timezone correctly', () => {
      const utcTime = '2025-01-20T20:00:00Z';
      const nyTime = toUserTimezone(utcTime, 'America/New_York');
      
      // January 20 is EST (UTC-5)
      expect(nyTime.hour).toBe(15); // 3 PM in New York
      expect(nyTime.timeZoneId).toBe('America/New_York');
    });

    it('should throw for invalid timezone', () => {
      const utcTime = '2025-01-20T20:00:00Z';
      expect(() => toUserTimezone(utcTime, 'Invalid/Zone')).toThrow(BadRequestError);
    });
  });

  describe('toUtcIsoString', () => {
    it('should convert ISO string with timezone offset to UTC', () => {
      const nyTime = '2025-01-20T15:00:00-05:00'; // 3 PM EST
      const utcString = toUtcIsoString(nyTime);
      
      expect(utcString).toBe('2025-01-20T20:00:00Z');
    });

    it('should preserve UTC time when converting UTC input', () => {
      const utcInput = '2025-01-20T20:00:00Z';
      const utcOutput = toUtcIsoString(utcInput);
      
      expect(utcOutput).toBe('2025-01-20T20:00:00Z');
    });

    it('should throw BadRequestError for invalid input', () => {
      expect(() => toUtcIsoString('invalid-date')).toThrow(BadRequestError);
    });
  });

  describe('normalizeToUtc', () => {
    it('should convert Date object to UTC ISO string', () => {
      const date = new Date('2025-01-20T20:00:00Z');
      const normalized = normalizeToUtc(date);
      
      expect(normalized).toBe('2025-01-20T20:00:00.000Z');
    });

    it('should convert ISO string to UTC', () => {
      const input = '2025-01-20T15:00:00-05:00';
      const normalized = normalizeToUtc(input);
      
      expect(normalized).toBe('2025-01-20T20:00:00Z');
    });

    it('should return undefined for undefined input', () => {
      expect(normalizeToUtc(undefined)).toBeUndefined();
    });

    it('should throw BadRequestError for invalid input', () => {
      expect(() => normalizeToUtc('not-a-date')).toThrow(BadRequestError);
    });
  });

  describe('isSameInstant', () => {
    it('should return true for same instant in different timezones', () => {
      const utcTime = '2025-01-20T20:00:00Z';
      const nyTime = '2025-01-20T15:00:00-05:00'; // Same instant
      
      expect(isSameInstant(utcTime, nyTime)).toBe(true);
    });

    it('should return false for different instants', () => {
      const time1 = '2025-01-20T20:00:00Z';
      const time2 = '2025-01-20T21:00:00Z';
      
      expect(isSameInstant(time1, time2)).toBe(false);
    });
  });

  describe('nowUtc', () => {
    it('should return current UTC time as ISO string', () => {
      const now = nowUtc();
      
      expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(isFutureTime(now)).toBe(false);
    });

    it('should be very close to Date.now()', () => {
      const tiempoNow = new Date(nowUtc()).getTime();
      const jsNow = Date.now();
      
      // Should be within 100ms
      expect(Math.abs(tiempoNow - jsNow)).toBeLessThan(100);
    });
  });

  describe('addDuration', () => {
    it('should add milliseconds correctly', () => {
      const baseTime = '2025-01-20T10:00:00.000Z';
      const result = addDuration(baseTime, 2 * 60 * 60 * 1000); // 2 hours
      
      expect(result).toBe('2025-01-20T12:00:00.000Z');
    });

    it('should handle day boundaries', () => {
      const baseTime = '2025-01-20T23:00:00.000Z';
      const result = addDuration(baseTime, 2 * 60 * 60 * 1000); // 2 hours
      
      expect(result).toBe('2025-01-21T01:00:00.000Z');
    });
  });

  describe('subtractDuration', () => {
    it('should subtract milliseconds correctly', () => {
      const baseTime = '2025-01-20T10:00:00.000Z';
      const result = subtractDuration(baseTime, 2 * 60 * 60 * 1000); // 2 hours
      
      expect(result).toBe('2025-01-20T08:00:00.000Z');
    });

    it('should handle day boundaries', () => {
      const baseTime = '2025-01-20T01:00:00.000Z';
      const result = subtractDuration(baseTime, 2 * 60 * 60 * 1000); // 2 hours
      
      expect(result).toBe('2025-01-19T23:00:00.000Z');
    });
  });

  describe('formatForDisplay', () => {
    it('should format UTC time in specified timezone', () => {
      const utcTime = '2025-01-20T20:00:00Z';
      const formatted = formatForDisplay(utcTime, 'America/New_York');
      
      expect(formatted).toContain('January');
      expect(formatted).toContain('20');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('3:00 PM');
    });

    it('should throw for invalid timezone', () => {
      const utcTime = '2025-01-20T20:00:00Z';
      expect(() => formatForDisplay(utcTime, 'Invalid/Zone')).toThrow(BadRequestError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year correctly', () => {
      // 2024 is a leap year
      const leapDay = '2024-02-29T12:00:00.000Z';
      const nextDay = addDuration(leapDay, 24 * 60 * 60 * 1000); // 1 day
      
      expect(nextDay).toBe('2024-03-01T12:00:00.000Z');
    });

    it('should handle timezone offsets at year boundary', () => {
      // New Year's Eve in New York is still Dec 31 UTC
      const nyeNY = '2024-12-31T23:59:00-05:00';
      const utcString = toUtcIsoString(nyeNY);
      
      expect(utcString).toBe('2025-01-01T04:59:00Z');
    });

    it('should handle extreme future dates', () => {
      const farFuture = '2100-01-01T00:00:00Z';
      expect(isFutureTime(farFuture)).toBe(true);
    });
  });
});
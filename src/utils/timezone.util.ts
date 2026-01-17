

import { toZonedTime, toUtcString, toUtc } from '@gobrand/tiempo';
import { BadRequestError } from './errors.util';

/**
 * Validate if a timezone string is a valid IANA identifier
 * 
 * @param timezone - IANA timezone identifier to validate
 * @throws BadRequestError if timezone is invalid
 */
export function validateTimezone(timezone: string): void {
  // Empty string is invalid
  if (!timezone || timezone.trim() === '') {
    throw new BadRequestError(
      `Invalid timezone: "${timezone}". Must be a valid IANA timezone identifier (e.g., "America/New_York", "Europe/London").`
    );
  }
  
  try {
    // Test conversion - will throw if invalid timezone
    toZonedTime('2025-01-01T00:00:00Z', timezone);
  } catch (error) {
    throw new BadRequestError(
      `Invalid timezone: "${timezone}". Must be a valid IANA timezone identifier (e.g., "America/New_York", "Europe/London").`
    );
  }
}

/**
 * Check if a given time is in the future
 * 
 * @param isoString - UTC ISO 8601 string to check
 * @returns true if the time is in the future
 */
export function isFutureTime(isoString: string): boolean {
  try {
    const scheduledTime = new Date(isoString).getTime();
    
    // Invalid date returns NaN
    if (isNaN(scheduledTime)) {
      throw new BadRequestError(`Invalid ISO 8601 date string: "${isoString}"`);
    }
    
    const now = Date.now();
    return scheduledTime > now;
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Invalid ISO 8601 date string: "${isoString}"`);
  }
}

/**
 * Calculate delay in milliseconds from now to a future UTC time
 * 
 * @param isoString - UTC ISO 8601 string representing future time
 * @returns Delay in milliseconds
 * @throws BadRequestError if time is not in the future
 */
export function calculateDelay(isoString: string): number {
  if (!isFutureTime(isoString)) {
    throw new BadRequestError('Scheduled time must be in the future');
  }

  const scheduledTime = new Date(isoString).getTime();
  const now = Date.now();
  
  return Math.floor(scheduledTime - now);
}

/**
 * Convert a UTC ISO string to a user's timezone
 * 
 * @param utcIsoString - UTC ISO 8601 string from database
 * @param userTimezone - User's IANA timezone identifier
 * @returns ZonedDateTime in user's timezone
 */
export function toUserTimezone(
  utcIsoString: string,
  userTimezone: string
): ReturnType<typeof toZonedTime> {
  validateTimezone(userTimezone);
  return toZonedTime(utcIsoString, userTimezone);
}

/**
 * Convert a user's timezone input to UTC ISO string for database storage
 * 
 * This is the critical function that ensures all database times are UTC.
 * 
 * @param input - ISO string (with timezone offset)
 * @param userTimezone - Optional user timezone for validation
 * @returns UTC ISO 8601 string (e.g., "2025-01-20T20:00:00Z")
 */
export function toUtcIsoString(
  input: string,
  userTimezone?: string
): string {
  try {
    if (userTimezone) {
      validateTimezone(userTimezone);
    }
    
    // Convert to UTC using tiempo
    const instant = toUtc(input);
    return toUtcString(instant);
  } catch (error) {
    throw new BadRequestError(
      `Invalid date input: "${input}". Expected ISO 8601 string with timezone offset (e.g., "2025-01-20T15:00:00-05:00").`
    );
  }
}

/**
 * Normalize a date input to UTC ISO string
 * 
 * Handles various input formats:
 * - Date objects (converted to UTC)
 * - ISO strings with timezone offsets
 * - ISO strings without timezone (assumed UTC)
 * 
 * @param input - Date, string, or undefined
 * @returns UTC ISO string or undefined
 */
export function normalizeToUtc(input: Date | string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  try {
    if (input instanceof Date) {
      // Convert JavaScript Date to ISO string
      return input.toISOString();
    } else if (typeof input === 'string') {
      // Parse string to UTC using tiempo
      return toUtcIsoString(input);
    }
    return undefined;
  } catch (error) {
    throw new BadRequestError(`Invalid date input: "${input}"`);
  }
}

/**
 * Check if two times represent the same instant (ignoring timezone)
 * 
 * @param time1 - First time (ISO string)
 * @param time2 - Second time (ISO string)
 * @returns true if both represent the same UTC instant
 */
export function isSameInstant(time1: string, time2: string): boolean {
  const instant1 = new Date(time1).getTime();
  const instant2 = new Date(time2).getTime();
  
  return instant1 === instant2;
}

/**
 * Get current UTC time as ISO string
 * 
 * @returns Current UTC time in ISO 8601 format
 */
export function nowUtc(): string {
  return new Date().toISOString();
}

/**
 * Add duration to a UTC time
 * 
 * @param utcIsoString - Base UTC ISO string
 * @param durationMs - Duration to add in milliseconds
 * @returns New UTC ISO string with duration added
 */
export function addDuration(
  utcIsoString: string,
  durationMs: number
): string {
  const baseTime = new Date(utcIsoString).getTime();
  const newTime = new Date(baseTime + durationMs);
  return newTime.toISOString();
}

/**
 * Subtract duration from a UTC time
 * 
 * @param utcIsoString - Base UTC ISO string
 * @param durationMs - Duration to subtract in milliseconds
 * @returns New UTC ISO string with duration subtracted
 */
export function subtractDuration(
  utcIsoString: string,
  durationMs: number
): string {
  const baseTime = new Date(utcIsoString).getTime();
  const newTime = new Date(baseTime - durationMs);
  return newTime.toISOString();
}

/**
 * Format a UTC ISO string for display in a specific timezone
 * 
 * @param utcIsoString - UTC ISO 8601 string from database
 * @param userTimezone - IANA timezone identifier
 * @returns Formatted date string for display
 * 
 * @example
 * formatForDisplay("2025-01-20T20:00:00Z", "America/New_York")
 * // => "January 20, 2025 at 3:00 PM EST"
 */
export function formatForDisplay(
  utcIsoString: string,
  userTimezone: string
): string {
  validateTimezone(userTimezone);
  
  // Use native Intl.DateTimeFormat for display
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  
  return formatter.format(new Date(utcIsoString));
}
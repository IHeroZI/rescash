/**
 * Utility functions for handling dates with Thailand timezone (UTC+7)
 */

const THAILAND_TIMEZONE = 'Asia/Bangkok';

/**
 * Get current date/time in Thailand timezone
 * @returns Date object representing current time in Thailand
 */
export function getThailandDate(): Date {
  // Create a date in Thailand timezone
  const now = new Date();
  // Convert to Thailand timezone using Intl API
  const thailandTime = new Date(now.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE }));
  return thailandTime;
}

/**
 * Get current date/time in Thailand timezone as ISO string
 * This is useful for storing in database
 * @returns ISO string with Thailand timezone offset
 */
export function getThailandDateISO(): string {
  const thailandDate = getThailandDate();
  // Get the ISO string but adjust for Thailand timezone
  // We need to create a proper ISO string with the correct offset
  const year = thailandDate.getFullYear();
  const month = String(thailandDate.getMonth() + 1).padStart(2, '0');
  const day = String(thailandDate.getDate()).padStart(2, '0');
  const hours = String(thailandDate.getHours()).padStart(2, '0');
  const minutes = String(thailandDate.getMinutes()).padStart(2, '0');
  const seconds = String(thailandDate.getSeconds()).padStart(2, '0');
  const milliseconds = String(thailandDate.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

/**
 * Convert a Date object to Thailand timezone ISO string
 * @param date - The date to convert
 * @returns ISO string with Thailand timezone
 */
export function toThailandISO(date: Date): string {
  const thailandTime = new Date(date.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE }));
  const year = thailandTime.getFullYear();
  const month = String(thailandTime.getMonth() + 1).padStart(2, '0');
  const day = String(thailandTime.getDate()).padStart(2, '0');
  const hours = String(thailandTime.getHours()).padStart(2, '0');
  const minutes = String(thailandTime.getMinutes()).padStart(2, '0');
  const seconds = String(thailandTime.getSeconds()).padStart(2, '0');
  const milliseconds = String(thailandTime.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

/**
 * Get start of day in Thailand timezone
 * @param date - Optional date, defaults to today
 * @returns Date object representing start of day (00:00:00) in Thailand timezone
 */
export function getThailandStartOfDay(date?: Date): Date {
  const targetDate = date || getThailandDate();
  const thailandTime = new Date(targetDate.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE }));
  
  thailandTime.setHours(0, 0, 0, 0);
  return thailandTime;
}

/**
 * Get end of day in Thailand timezone
 * @param date - Optional date, defaults to today
 * @returns Date object representing end of day (23:59:59.999) in Thailand timezone
 */
export function getThailandEndOfDay(date?: Date): Date {
  const targetDate = date || getThailandDate();
  const thailandTime = new Date(targetDate.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE }));
  
  thailandTime.setHours(23, 59, 59, 999);
  return thailandTime;
}

/**
 * Parse a date string in Thailand timezone
 * @param dateString - Date string to parse
 * @returns Date object in Thailand timezone
 */
export function parseThailandDate(dateString: string): Date {
  const date = new Date(dateString);
  return new Date(date.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE }));
}

/**
 * Format date to Thailand locale string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Thai
 */
export function formatThailandDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString('th-TH', { 
    timeZone: THAILAND_TIMEZONE,
    ...options 
  });
}

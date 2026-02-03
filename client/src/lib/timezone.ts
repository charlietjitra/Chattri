import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";

/**
 * Convert a date from a specific timezone to UTC
 * Used when sending times from client to server
 */
export function convertToUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Convert a UTC date to a specific timezone
 * Used when displaying times from server to client
 */
export function convertFromUTC(utcDate: Date | string, timezone: string): Date {
  const dateObj = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return toZonedTime(dateObj, timezone);
}

/**
 * Format a date in a specific timezone with timezone indicator
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = "MMMM dd, yyyy h:mm a zzz"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatTz(dateObj, formatStr, { timeZone: timezone });
}

/**
 * Get timezone abbreviation
 */
export function getTimezoneName(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tz = parts.find((part) => part.type === "timeZoneName");
    return tz?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Format time with timezone indicator
 * Example: "2:00 PM EST"
 */
export function formatTimeWithTimezone(
  date: Date | string,
  timezone: string
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const timeStr = formatTz(dateObj, "h:mm a", { timeZone: timezone });
  const tzName = getTimezoneName(timezone);
  return `${timeStr} ${tzName}`;
}

/**
 * Format date and time with timezone indicator
 * Example: "December 20, 2024 2:00 PM EST"
 */
export function formatFullDateTimeWithTimezone(
  date: Date | string,
  timezone: string
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateStr = formatTz(dateObj, "MMMM dd, yyyy", { timeZone: timezone });
  const timeStr = formatTz(dateObj, "h:mm a", { timeZone: timezone });
  const tzName = getTimezoneName(timezone);
  return `${dateStr} at ${timeStr} ${tzName}`;
}

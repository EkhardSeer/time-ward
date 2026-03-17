import { DateTime } from 'luxon';
import { ROWS_PER_HOUR } from '../constants';

/**
 * Convert a DateTime to a grid row index (0–95) within its day.
 * Each row represents one 15-minute slot (ROWS_PER_HOUR slots per hour).
 */
export function timeToRow(time: DateTime, rowsPerHour = ROWS_PER_HOUR): number {
  return time.hour * rowsPerHour + Math.floor(time.minute / (60 / rowsPerHour));
}

/**
 * Calculate the row span (number of 15-min rows) for a duration between two DateTimes.
 * Always returns at least 1.
 */
export function durationToRowSpan(
  start: DateTime,
  end: DateTime,
  rowsPerHour = ROWS_PER_HOUR,
): number {
  const mins = end.diff(start, 'minutes').minutes;
  return Math.max(1, Math.ceil(mins / (60 / rowsPerHour)));
}

/**
 * Returns the fraction of the day (0–1) for a given DateTime's time component.
 * Used by the month layout engine to compute fractional-day offsets.
 */
export function hourFraction(dt: DateTime): number {
  return (dt.hour + dt.minute / 60) / 24;
}

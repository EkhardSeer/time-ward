import { DateTime } from 'luxon';

/**
 * Tracks which time intervals have already been placed in a single visual row
 * of a day cell in the month view.
 *
 * The month layout engine maintains a `RowState[][][]` cube indexed by
 * `[weekIndex][dayIndex][row]`. Before assigning a new event to a row the
 * engine checks whether the event's effective interval overlaps any of the
 * intervals already recorded in `RowState.intervals`. This enables
 * non-overlapping same-day events (e.g. a morning and an afternoon meeting)
 * to share the same visual row rather than being pushed to separate rows.
 */
export interface RowState {
  /**
   * Time intervals of events already placed in this row.
   * Each entry covers the effective time span of one event (which may be
   * expanded to a full day for short events — see `effectiveInterval` in
   * `CalendarMonthLayout`).
   */
  intervals: Array<{ start: DateTime; end: DateTime }>;
}

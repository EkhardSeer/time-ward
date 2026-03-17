import { CalendarEvent } from '../../../models/calendar-event';

/**
 * Internal representation of one event clipped to a single day within a
 * 7-day week grid, used by `CalendarWeekLayout` before column assignment.
 *
 * Multi-day events produce one `WeekSlice` per day they span so that each
 * day column can be laid out independently.
 */
export interface WeekSlice {
  /** The source event this slice was derived from. */
  event: CalendarEvent;
  /**
   * Identifier for this slice.
   * For single-day events this equals `event.id`.
   * For multi-day events each per-day slice gets a unique suffix (`"<id>-dayN"`).
   */
  sliceId: string;
  /**
   * Grid row at which the (clipped) event starts within its day column.
   * Computed via `timeToRow` from the clipped start time.
   */
  startRow: number;
  /**
   * Number of 15-minute grid rows this slice occupies.
   * Computed via `durationToRowSpan`; minimum value is 1.
   */
  rowSpan: number;
  /**
   * Zero-based index of the day column this slice belongs to.
   * 0 = first day of the week (Monday in ISO weeks), 6 = last day (Sunday).
   */
  dayNum: number;
}

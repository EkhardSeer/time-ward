import { CalendarEvent } from '../../../models/calendar-event';

/**
 * Internal representation of one event clipped to the boundaries of a single
 * day, used by `CalendarDayLayout` before column assignment.
 *
 * The original event is preserved so that its full metadata (unclipped times,
 * color, id) can be propagated to the final `PositionedEvent`.
 */
export interface DaySlice {
  /** The source event this slice was derived from. */
  event: CalendarEvent;
  /**
   * Grid row at which the (clipped) event starts.
   * Computed via `timeToRow` from the clipped start time.
   */
  startRow: number;
  /**
   * Number of 15-minute grid rows this slice occupies.
   * Computed via `durationToRowSpan`; minimum value is 1.
   */
  rowSpan: number;
  /**
   * Position of the source event in the input `events` array passed to the
   * layout engine. Used as a stable tiebreaker in the sort so that events
   * from earlier calendar sources are always assigned lower column indices
   * (i.e. rendered further to the left) than events from later sources.
   */
  sourceOrder: number;
}

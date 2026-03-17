/**
 * Describes the grid position of a calendar event within the visible month.
 *
 * Computed once per event by `findEventGridRange` in `CalendarMonthLayout`.
 * Events that start or end outside the visible grid are clamped and the
 * `eventStartsBeforeVisible` / `eventEndsAfterVisible` flags are set so that
 * the bounds calculation can extend the rendered segment all the way to the
 * grid edge.
 */
export interface EventGridRange {
  /**
   * Week-row index (0-based) of the cell containing the event's start day.
   * Clamped to `0` when the event starts before the first visible day.
   */
  startWeekIndex: number;
  /**
   * Day-column index (0–6) within `startWeekIndex` for the event's start day.
   * Clamped to `0` when the event starts before the first visible day.
   */
  startDayIndex: number;
  /**
   * Week-row index (0-based) of the cell containing the event's end day.
   * Clamped to the last week index when the event ends after the last visible day.
   */
  endWeekIndex: number;
  /**
   * Day-column index (0–6) within `endWeekIndex` for the event's end day.
   * Clamped to `6` when the event ends after the last visible day.
   */
  endDayIndex: number;
  /**
   * `true` when the event's start precedes the first visible grid cell.
   * Used by segment-bounds helpers to draw the segment flush with the left
   * edge of the grid instead of starting mid-column.
   */
  eventStartsBeforeVisible: boolean;
  /**
   * `true` when the event's end falls after the last visible grid cell.
   * Used by segment-bounds helpers to draw the segment flush with the right
   * edge of the grid instead of ending mid-column.
   */
  eventEndsAfterVisible: boolean;
}

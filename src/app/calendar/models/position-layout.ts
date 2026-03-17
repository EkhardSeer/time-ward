/**
 * Describes the horizontal position and CSS Grid placement of a rendered event.
 *
 * All percentage values are relative to the full width of the calendar grid
 * (100 % = the entire calendar area). The CSS Grid properties (`colStart`,
 * `colSpan`, `weekIndex`) are used by the month view to place events inside
 * the week-row grid; time views use only `left`, `width`, and `row`.
 */
export interface PositionLayout {
  /** Horizontal offset from the left edge of the calendar, in percent. */
  left: number;
  /** Rendered width of the event, in percent. */
  width: number;
  /**
   * Vertical row index (0-based).
   * - Day / week views: 15-minute slot index (0–95, where 0 = 00:00).
   * - Month view: stacking row index within a day cell (0 = topmost).
   */
  row: number;
  /**
   * Zero-based index of the week row this event belongs to.
   * Only meaningful in month view; always 0 in day / week views.
   */
  weekIndex: number;
  /**
   * CSS `grid-column-start` value (1-based day column).
   * Used by the month view grid to span multi-day events across columns.
   */
  colStart: number;
  /**
   * Number of day columns this event spans.
   * `1` for single-day events; greater values for multi-day segments.
   */
  colSpan: number;
}

/**
 * One contiguous horizontal segment of an event within a single week row.
 *
 * Multi-week events are split into one `WeekSegment` per week they span so
 * that each segment can be positioned independently within its week row.
 * Single-week events produce exactly one segment.
 */
export interface WeekSegment {
  /** Zero-based index of the week row this segment belongs to. */
  weekIndex: number;
  /**
   * Day-column index (0–6) at which this segment starts within `weekIndex`.
   * `0` for every segment after the first (subsequent week rows always
   * start from Monday).
   */
  firstDayIndex: number;
  /**
   * Day-column index (0–6) at which this segment ends within `weekIndex`.
   * `6` for every segment before the last (earlier week rows always
   * extend to Sunday).
   */
  lastDayIndex: number;
}

import { DateTime } from 'luxon';
import { PositionedEvent } from '../../../models/positioned-event';
import { RowState } from './row-state';

/**
 * Shared mutable context threaded through the month layout pipeline.
 *
 * `CalendarMonthLayout.layoutMonth` creates one context per layout run and
 * passes it by reference to every private helper. All output accumulates in
 * `positioned` and `hiddenEventsMap`; the collision-detection state lives in
 * `rowsPerDay`.
 */
export interface MonthLayoutContext {
  /** The visible week grid: `weeks[weekIndex][dayIndex]` → `DateTime`. */
  weeks: DateTime[][];
  /**
   * Height of one week row as a percentage of the total calendar height.
   * Equal to `100 / weeks.length`.
   */
  weekHeightPercent: number;
  /**
   * Height of the day-number chip area at the top of each day cell, in percent.
   * Derived from `weekHeightPercent × MONTH_DAY_HEADER_FRACTION`.
   */
  dayHeaderHeightPercent: number;
  /**
   * Height of one stacking event row within a day cell, in percent.
   * Derived from the remaining week height after the header, divided by the
   * maximum number of visible rows (4).
   */
  eventRowHeightPercent: number;
  /**
   * Width of one day column as a percentage of the total calendar width.
   * Always `100 / 7 ≈ 14.286 %`.
   */
  dayWidth: number;
  /**
   * Collision-detection state cube: `rowsPerDay[weekIdx][dayIdx][row]`.
   * Each cell holds the time intervals already placed in that visual row,
   * allowing the engine to detect overlaps before assigning a new event.
   */
  rowsPerDay: RowState[][][];
  /**
   * Accumulates hidden-event counts keyed by `"<weekIndex>-<dayKey>"` for
   * each day that has more events than `MAX_VISIBLE_EVENTS_PER_ROW`.
   * After all events are processed, one overflow badge is emitted per entry.
   */
  hiddenEventsMap: Map<string, { count: number; weekIndex: number; dayKey: number }>;
  /** Output array; positioned events are pushed here during the layout run. */
  positioned: PositionedEvent[];
}

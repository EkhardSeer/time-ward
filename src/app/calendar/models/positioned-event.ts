import { CalendarEvent } from './calendar-event';
import { PositionLayout } from './position-layout';
import { SizingConfig } from './sizing-config';
import { ViewMetadata } from './view-metadata';

/**
 * A `CalendarEvent` enriched with the layout data produced by a layout engine.
 *
 * Layout engines (`CalendarDayLayout`, `CalendarWeekLayout`,
 * `CalendarMonthLayout`) consume `CalendarEvent[]` and emit
 * `PositionedEvent[]`. The template then reads `layout`, `sizing`, and
 * `metadata` to render each chip at the correct position.
 *
 * A single source event may produce **multiple** `PositionedEvent` instances
 * when it spans several days or weeks — each instance covers one contiguous
 * segment within a single row.
 */
export interface PositionedEvent extends CalendarEvent {
  /** Horizontal position and CSS Grid placement within the calendar grid. */
  layout: PositionLayout;
  /** View-specific height and vertical offset. */
  sizing: SizingConfig;
  /** Auxiliary data used by the template for edge-case rendering decisions. */
  metadata: ViewMetadata;
}

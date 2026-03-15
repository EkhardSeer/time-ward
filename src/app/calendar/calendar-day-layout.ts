import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase } from './calendar-layout-base';

/**
 * Layout engine for the single-day calendar view.
 *
 * Converts an array of `CalendarEvent` objects into `PositionedEvent` objects
 * with absolute positioning data for a 24-hour, 96-row grid (15-min slots).
 * Overlapping events are placed side-by-side in sub-columns using the
 * inherited greedy column-assignment algorithm.
 */
export class CalendarDayLayout extends CalendarLayoutBase {
  /**
   * Layout events for a single day view.
   * Overlapping events are placed side-by-side within the full column width.
   */
  layoutDay(events: CalendarEvent[], day: DateTime): PositionedEvent[] {
    const dayStart = day.startOf('day');
    const dayEnd = day.endOf('day');

    const slices: Array<{ event: CalendarEvent; startRow: number; rowSpan: number }> = [];
    for (const event of events) {
      if (event.end <= dayStart || event.start >= dayEnd) continue;
      const clippedStart = event.start < dayStart ? dayStart : event.start;
      const clippedEnd = event.end > dayEnd ? dayEnd : event.end;
      const startRow = this.timeToRow(clippedStart);
      const rowSpan = this.durationToRowSpan(clippedStart, clippedEnd);
      slices.push({ event, startRow, rowSpan });
    }

    slices.sort((a, b) =>
      a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
    );

    const columns = this.assignColumns(slices);
    const positioned: PositionedEvent[] = [];

    for (let si = 0; si < slices.length; si++) {
      const { event, startRow, rowSpan } = slices[si];
      const { colIndex, totalColumns } = columns[si];
      const paddingLeft = colIndex === 0 ? 6 : 1;
      const paddingRight = colIndex === totalColumns - 1 ? 6 : 1;
      const left = colIndex * (100 / totalColumns);
      const width = 100 / totalColumns;

      positioned.push({
        ...event,
        layout: this.buildPositionLayout(left, width, startRow, 0, 1, 1),
        sizing: this.buildSizing({
          heightPercent: rowSpan * (100 / this.MAX_ROWS),
          topPercent: startRow * (100 / this.MAX_ROWS),
        }),
        metadata: this.buildViewMetadata(
          0,
          undefined,
          event.start,
          event.end,
          rowSpan,
          paddingLeft,
          paddingRight,
        ),
      });
    }

    return positioned;
  }
}

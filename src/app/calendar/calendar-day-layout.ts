import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase } from './calendar-layout-base';

interface DaySlice {
  event: CalendarEvent;
  startRow: number;
  rowSpan: number;
}

/**
 * Layout engine for the single-day calendar view.
 *
 * Converts an array of `CalendarEvent` objects into `PositionedEvent` objects
 * with absolute positioning data for a 24-hour, 96-row grid (15-min slots).
 * Overlapping events are placed side-by-side in sub-columns using the
 * inherited greedy column-assignment algorithm.
 */
export class CalendarDayLayout extends CalendarLayoutBase {
  /** Layout events for a single day view. */
  layoutDay(events: CalendarEvent[], day: DateTime): PositionedEvent[] {
    const slices = this.collectSlices(events, day);
    slices.sort((a, b) =>
      a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
    );
    return this.positionSlices(slices);
  }

  /** Clip events to the day boundaries and convert to grid slices. */
  private collectSlices(events: CalendarEvent[], day: DateTime): DaySlice[] {
    const dayStart = day.startOf('day');
    const dayEnd = day.endOf('day');
    const slices: DaySlice[] = [];
    for (const event of events) {
      if (event.end <= dayStart || event.start >= dayEnd) continue;
      const clippedStart = event.start < dayStart ? dayStart : event.start;
      const clippedEnd = event.end > dayEnd ? dayEnd : event.end;
      slices.push({
        event,
        startRow: this.timeToRow(clippedStart),
        rowSpan: this.durationToRowSpan(clippedStart, clippedEnd),
      });
    }
    return slices;
  }

  /** Assign sub-columns and build positioned events. */
  private positionSlices(slices: DaySlice[]): PositionedEvent[] {
    const columns = this.assignColumns(slices);
    return slices.map((slice, i) => {
      const { event, startRow, rowSpan } = slice;
      const { colIndex, totalColumns } = columns[i];
      return {
        ...event,
        layout: this.buildPositionLayout(
          colIndex * (100 / totalColumns),
          100 / totalColumns,
          startRow,
          0,
          1,
          1,
        ),
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
          colIndex === 0 ? 6 : 1,
          colIndex === totalColumns - 1 ? 6 : 1,
        ),
      };
    });
  }
}

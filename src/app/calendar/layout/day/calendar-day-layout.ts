import { DateTime } from 'luxon';
import { CalendarEvent } from '../../models/calendar-event';
import { PositionedEvent } from '../../models/positioned-event';
import { CalendarLayoutBase } from '../base/calendar-layout-base';
import { DaySlice } from './types/day-slice';
import { timeToRow, durationToRowSpan } from '../utils/time-utils';
import { assignColumns } from '../utils/assign-columns';
import {
  MAX_ROWS,
  EVENT_EDGE_PADDING_LEFT,
  EVENT_EDGE_PADDING_RIGHT,
  EVENT_INNER_PADDING,
} from '../constants';

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
        startRow: timeToRow(clippedStart),
        rowSpan: durationToRowSpan(clippedStart, clippedEnd),
      });
    }
    return slices;
  }

  /** Assign sub-columns and build positioned events. Day view shows all events — no overflow cap. */
  private positionSlices(slices: DaySlice[]): PositionedEvent[] {
    const columns = assignColumns(slices);
    const { visible } = this.capAndSplit(slices, columns, Infinity);

    return visible.map(({ slice, colIndex, totalColumns }) => {
      const { event, startRow, rowSpan } = slice;
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
          heightPercent: rowSpan * (100 / MAX_ROWS),
          topPercent: startRow * (100 / MAX_ROWS),
        }),
        metadata: this.buildViewMetadata(
          0,
          undefined,
          event.start,
          event.end,
          rowSpan,
          colIndex === 0 ? EVENT_EDGE_PADDING_LEFT : EVENT_INNER_PADDING,
          colIndex === totalColumns - 1 ? EVENT_EDGE_PADDING_RIGHT : EVENT_INNER_PADDING,
        ),
      };
    });
  }
}

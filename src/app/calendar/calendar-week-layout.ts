import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase } from './calendar-layout-base';

/**
 * Layout engine for the 7-day week calendar view.
 *
 * Each day occupies one column (1/7 of the total width). Events are sliced
 * per day they span and positioned on a 96-row grid (15-min slots).
 * Overlapping events within the same day column are placed side-by-side
 * using the inherited greedy column-assignment algorithm.
 */
export class CalendarWeekLayout extends CalendarLayoutBase {
  /** Generate a single week grid starting from the ISO week of `date`. */
  generateWeek(date: DateTime): DateTime[] {
    const startOfWeek = date.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.plus({ days: i }));
  }

  /**
   * Layout events for week view with side-by-side rendering for overlapping events.
   * Events that overlap in time on the same day are placed in adjacent sub-columns
   * within the day column, narrowing proportionally as more events overlap.
   */
  layoutWeek(events: CalendarEvent[], week: DateTime[]): PositionedEvent[] {
    const dayWidth = 100 / 7;
    const weekStart = week[0].startOf('day');

    interface Slice {
      event: CalendarEvent;
      sliceId: string;
      startRow: number;
      rowSpan: number;
      dayNum: number;
    }

    // Step 1: Collect one slice per event per day it occupies within the week
    const slicesPerDay: Slice[][] = Array.from({ length: 7 }, () => []);

    for (const event of events) {
      const dayIndex = Math.floor(event.start.diff(weekStart, 'days').days);
      const endDayIndex = Math.floor(event.end.diff(weekStart, 'days').days);

      if (endDayIndex < 0 || dayIndex >= 7) continue;

      const firstDay = Math.max(0, dayIndex);
      const lastDay = Math.min(6, endDayIndex);

      for (let dayNum = firstDay; dayNum <= lastDay; dayNum++) {
        const dayStart = weekStart.plus({ days: dayNum }).startOf('day');
        const dayEnd = dayStart.endOf('day');
        const clippedStart = event.start > dayStart ? event.start : dayStart;
        const clippedEnd = event.end < dayEnd ? event.end : dayEnd;

        const startRow = this.timeToRow(clippedStart);
        const rowSpan = this.durationToRowSpan(clippedStart, clippedEnd);

        slicesPerDay[dayNum].push({
          event,
          sliceId: dayIndex === endDayIndex ? event.id : `${event.id}-day${dayNum}`,
          startRow,
          rowSpan,
          dayNum,
        });
      }
    }

    // Step 2: For each day column, assign horizontal sub-columns and build positioned events
    const positioned: PositionedEvent[] = [];

    for (let dayNum = 0; dayNum < 7; dayNum++) {
      const slices = slicesPerDay[dayNum];
      if (!slices.length) continue;

      slices.sort((a, b) =>
        a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
      );

      const columns = this.assignColumns(slices);

      for (let si = 0; si < slices.length; si++) {
        const { event, sliceId, startRow, rowSpan } = slices[si];
        const { colIndex, totalColumns } = columns[si];

        const paddingLeft = colIndex === 0 ? 6 : 1;
        const paddingRight = colIndex === totalColumns - 1 ? 6 : 1;

        const left = dayNum * dayWidth + colIndex * (dayWidth / totalColumns);
        const width = dayWidth / totalColumns;

        positioned.push({
          ...event,
          id: sliceId,
          layout: this.buildPositionLayout(left, width, startRow, 0, dayNum + 1, 1),
          sizing: this.buildSizing({
            heightPercent: rowSpan * (100 / this.MAX_ROWS),
            topPercent: startRow * (100 / this.MAX_ROWS),
          }),
          metadata: {
            ...this.buildViewMetadata(
              dayNum,
              undefined,
              event.start,
              event.end,
              rowSpan,
              paddingLeft,
              paddingRight,
            ),
            sourceId: event.id,
          },
        });
      }
    }

    return positioned;
  }
}

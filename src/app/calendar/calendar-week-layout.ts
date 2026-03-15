import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase, ColumnAssignment } from './calendar-layout-base';

interface WeekSlice {
  event: CalendarEvent;
  sliceId: string;
  startRow: number;
  rowSpan: number;
  dayNum: number;
}

const DAYS_IN_WEEK = 7;

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
    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => startOfWeek.plus({ days: i }));
  }

  /** Layout events for week view with side-by-side overlap handling. */
  layoutWeek(events: CalendarEvent[], week: DateTime[]): PositionedEvent[] {
    const weekStart = week[0].startOf('day');
    const slicesPerDay = this.collectSlices(events, weekStart);
    return this.positionSlices(slicesPerDay);
  }

  /** Collect one slice per event per day it occupies within the week. */
  private collectSlices(events: CalendarEvent[], weekStart: DateTime): WeekSlice[][] {
    const slicesPerDay: WeekSlice[][] = Array.from({ length: DAYS_IN_WEEK }, () => []);
    for (const event of events) {
      const dayIndex = Math.floor(event.start.diff(weekStart, 'days').days);
      const endDayIndex = Math.floor(event.end.diff(weekStart, 'days').days);
      if (endDayIndex < 0 || dayIndex >= DAYS_IN_WEEK) continue;
      const firstDay = Math.max(0, dayIndex);
      const lastDay = Math.min(6, endDayIndex);
      for (let dayNum = firstDay; dayNum <= lastDay; dayNum++) {
        const dayStart = weekStart.plus({ days: dayNum }).startOf('day');
        const clippedStart = event.start > dayStart ? event.start : dayStart;
        const clippedEnd = event.end < dayStart.endOf('day') ? event.end : dayStart.endOf('day');
        slicesPerDay[dayNum].push({
          event,
          sliceId: dayIndex === endDayIndex ? event.id : `${event.id}-day${dayNum}`,
          startRow: this.timeToRow(clippedStart),
          rowSpan: this.durationToRowSpan(clippedStart, clippedEnd),
          dayNum,
        });
      }
    }
    return slicesPerDay;
  }

  /** Assign sub-columns per day and build positioned events. */
  private positionSlices(slicesPerDay: WeekSlice[][]): PositionedEvent[] {
    const dayWidth = 100 / DAYS_IN_WEEK;
    const positioned: PositionedEvent[] = [];
    for (let dayNum = 0; dayNum < DAYS_IN_WEEK; dayNum++) {
      const slices = slicesPerDay[dayNum];
      if (!slices.length) continue;
      slices.sort((a, b) =>
        a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
      );
      const columns = this.assignColumns(slices);
      for (let si = 0; si < slices.length; si++) {
        positioned.push(this.buildEvent(slices[si], columns[si], dayWidth));
      }
    }
    return positioned;
  }

  /** Build a single positioned event from a slice and its column assignment. */
  private buildEvent(slice: WeekSlice, col: ColumnAssignment, dayWidth: number): PositionedEvent {
    const { event, sliceId, startRow, rowSpan, dayNum } = slice;
    const { colIndex, totalColumns } = col;
    return {
      ...event,
      id: sliceId,
      layout: this.buildPositionLayout(
        dayNum * dayWidth + colIndex * (dayWidth / totalColumns),
        dayWidth / totalColumns,
        startRow,
        0,
        dayNum + 1,
        1,
      ),
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
          colIndex === 0 ? 6 : 1,
          colIndex === totalColumns - 1 ? 6 : 1,
        ),
        sourceId: event.id,
      },
    };
  }
}

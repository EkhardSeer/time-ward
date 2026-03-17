import { DateTime } from 'luxon';
import { CalendarEvent } from '../../models/calendar-event';
import { PositionedEvent } from '../../models/positioned-event';
import { CalendarLayoutBase } from '../base/calendar-layout-base';
import { ColumnAssignment } from '../base/types/column-assignment';
import { WeekSlice } from './types/week-slice';
import { timeToRow, durationToRowSpan } from '../utils/time-utils';
import { assignColumns } from '../utils/assign-columns';
import {
  DAYS_IN_WEEK,
  MAX_ROWS,
  EVENT_EDGE_PADDING_LEFT,
  EVENT_EDGE_PADDING_RIGHT,
  EVENT_INNER_PADDING,
  MAX_VISIBLE_TIME_EVENTS,
} from '../constants';

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
  layoutWeek(
    events: CalendarEvent[],
    week: DateTime[],
    maxColumns = MAX_VISIBLE_TIME_EVENTS,
  ): PositionedEvent[] {
    const weekStart = week[0].startOf('day');
    const slicesPerDay = this.collectSlices(events, weekStart);
    return this.positionSlices(slicesPerDay, maxColumns);
  }

  /** Collect one slice per event per day it occupies within the week. */
  private collectSlices(events: CalendarEvent[], weekStart: DateTime): WeekSlice[][] {
    const slicesPerDay: WeekSlice[][] = Array.from({ length: DAYS_IN_WEEK }, () => []);
    for (let ei = 0; ei < events.length; ei++) {
      const event = events[ei];
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
          startRow: timeToRow(clippedStart),
          rowSpan: durationToRowSpan(clippedStart, clippedEnd),
          dayNum,
          sourceOrder: ei,
        });
      }
    }
    return slicesPerDay;
  }

  /** Assign sub-columns per day, cap overflow, and build positioned events. */
  private positionSlices(slicesPerDay: WeekSlice[][], cap: number): PositionedEvent[] {
    const dayWidth = 100 / DAYS_IN_WEEK;
    const positioned: PositionedEvent[] = [];

    for (let dayNum = 0; dayNum < DAYS_IN_WEEK; dayNum++) {
      const slices = slicesPerDay[dayNum];
      if (!slices.length) continue;
      slices.sort((a, b) =>
        a.sourceOrder !== b.sourceOrder
          ? a.sourceOrder - b.sourceOrder
          : a.startRow !== b.startRow
            ? a.startRow - b.startRow
            : b.rowSpan - a.rowSpan,
      );
      const columns = assignColumns(slices);
      const { visible, badges } = this.capAndSplit(slices, columns, cap);

      for (const { slice, colIndex, totalColumns } of visible) {
        positioned.push(this.buildEvent(slice, { colIndex, totalColumns }, dayWidth));
      }

      for (const { event, startRow, rowSpan, count } of badges) {
        const totalColumns = cap + 1;
        positioned.push({
          ...event,
          id: `overflow-time-${dayNum}-${event.id}-${startRow}`,
          layout: this.buildPositionLayout(
            dayNum * dayWidth + cap * (dayWidth / totalColumns),
            dayWidth / totalColumns,
            startRow,
            0,
            dayNum + 1,
            1,
          ),
          sizing: this.buildSizing({
            heightPercent: rowSpan * (100 / MAX_ROWS),
            topPercent: startRow * (100 / MAX_ROWS),
          }),
          metadata: {
            ...this.buildViewMetadata(dayNum, count, event.start, event.end, rowSpan),
            sourceId: event.id,
          },
        });
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
        heightPercent: rowSpan * (100 / MAX_ROWS),
        topPercent: startRow * (100 / MAX_ROWS),
      }),
      metadata: {
        ...this.buildViewMetadata(
          dayNum,
          undefined,
          event.start,
          event.end,
          rowSpan,
          colIndex === 0 ? EVENT_EDGE_PADDING_LEFT : EVENT_INNER_PADDING,
          colIndex === totalColumns - 1 ? EVENT_EDGE_PADDING_RIGHT : EVENT_INNER_PADDING,
        ),
        sourceId: event.id,
      },
    };
  }
}

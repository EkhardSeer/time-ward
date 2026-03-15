import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase } from './calendar-layout-base';

/**
 * Tracks occupied rows for collision detection.
 * Stores time intervals to detect actual overlap, not just day occupancy.
 */
interface RowState {
  intervals: Array<{ start: DateTime; end: DateTime }>;
}

interface MonthLayoutContext {
  weeks: DateTime[][];
  weekHeightPercent: number;
  rowHeightPercent: number;
  dayWidth: number;
  rowsPerDay: RowState[][][];
  hiddenEventsMap: Map<string, { count: number; weekIndex: number; dayKey: number }>;
  positioned: PositionedEvent[];
}

interface EventGridRange {
  startWeekIndex: number;
  startDayIndex: number;
  endWeekIndex: number;
  endDayIndex: number;
  eventStartsBeforeVisible: boolean;
  eventEndsAfterVisible: boolean;
}

interface WeekSegment {
  weekIndex: number;
  firstDayIndex: number;
  lastDayIndex: number;
}

/**
 * Layout engine for the month calendar view.
 *
 * Positions events on a grid of week-rows × 7-day columns.
 * Multi-day and multi-week events are split into one positioned segment
 * per week they span. Collision detection uses time-interval overlap
 * (not just day occupancy) so events on the same day but at different
 * times can share a visual row.
 *
 * Up to `MAX_VISIBLE_EVENTS_PER_ROW` events are rendered per day;
 * additional events are collapsed into an overflow "+N more" badge.
 */
export class CalendarMonthLayout extends CalendarLayoutBase {
  /** Maximum visible events per day cell before showing an overflow badge. */
  private readonly MAX_VISIBLE_EVENTS_PER_ROW = 3;

  // ========== Generator Functions ==========

  /**
   * Generate a month grid as an array of weeks, where each week is an array of 7 days.
   * Pads weeks with the previous month's last days and next month's first days to fill 7-day weeks.
   */
  generateMonth(date: DateTime): DateTime[][] {
    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');

    // Start from the beginning of the week containing the 1st of the month
    let current = startOfMonth.startOf('week');

    const weeks: DateTime[][] = [];

    while (current <= endOfMonth) {
      const week = Array.from({ length: 7 }, (_, i) => current.plus({ days: i }));
      weeks.push(week);
      current = current.plus({ weeks: 1 });
    }

    return weeks;
  }

  // ========== Layout Functions ==========

  /** Layout events for month view with collision detection. */
  layoutMonth(events: CalendarEvent[], weeks: DateTime[][]): PositionedEvent[] {
    const ctx = this.initContext(weeks);
    for (const event of events) {
      this.processEvent(event, ctx);
    }
    this.emitOverflowBadges(ctx);
    return ctx.positioned;
  }

  private initContext(weeks: DateTime[][]): MonthLayoutContext {
    const weekHeightPercent = 100 / weeks.length;
    return {
      weeks,
      weekHeightPercent,
      rowHeightPercent: weekHeightPercent / 4,
      dayWidth: 100 / 7,
      rowsPerDay: weeks.map(() => Array.from({ length: 7 }, () => Array(10).fill(null))),
      hiddenEventsMap: new Map(),
      positioned: [],
    };
  }

  private processEvent(event: CalendarEvent, ctx: MonthLayoutContext): void {
    const eventStart = event.start.startOf('day');
    const eventEnd = event.end.equals(event.end.startOf('day'))
      ? event.end.minus({ days: 1 }).startOf('day')
      : event.end.startOf('day');

    const range = this.findEventGridRange(eventStart, eventEnd, ctx.weeks);
    if (!range) return;

    const segments = this.buildWeekSegments(range);
    const rowPerWeek = this.assignRowsPerWeek(event, segments, ctx);
    this.recordOccupiedIntervals(event, segments, rowPerWeek, ctx);

    for (const seg of segments) {
      this.renderSegment(event, seg, range, rowPerWeek, ctx);
    }
  }

  private findEventGridRange(
    eventStart: DateTime,
    eventEnd: DateTime,
    weeks: DateTime[][],
  ): EventGridRange | null {
    const firstVisibleDay = weeks[0][0].startOf('day');
    const lastVisibleDay = weeks[weeks.length - 1][6].startOf('day');

    if (
      eventEnd.toMillis() < firstVisibleDay.toMillis() ||
      eventStart.toMillis() > lastVisibleDay.toMillis()
    ) {
      return null;
    }

    let startWeekIndex = -1,
      startDayIndex = -1;
    let endWeekIndex = -1,
      endDayIndex = -1;

    for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = weeks[weekIdx][dayIdx].startOf('day');
        if (cellDate.equals(eventStart)) {
          startWeekIndex = weekIdx;
          startDayIndex = dayIdx;
        }
        if (cellDate.equals(eventEnd)) {
          endWeekIndex = weekIdx;
          endDayIndex = dayIdx;
        }
      }
    }

    if (startWeekIndex === -1) {
      startWeekIndex = 0;
      startDayIndex = 0;
    }
    if (endWeekIndex === -1) {
      endWeekIndex = weeks.length - 1;
      endDayIndex = 6;
    }

    return {
      startWeekIndex,
      startDayIndex,
      endWeekIndex,
      endDayIndex,
      eventStartsBeforeVisible: eventStart.toMillis() < firstVisibleDay.toMillis(),
      eventEndsAfterVisible: eventEnd.toMillis() > lastVisibleDay.toMillis(),
    };
  }

  private buildWeekSegments(range: EventGridRange): WeekSegment[] {
    const {
      startWeekIndex,
      startDayIndex,
      endWeekIndex,
      endDayIndex,
      eventStartsBeforeVisible,
      eventEndsAfterVisible,
    } = range;

    if (endWeekIndex === startWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible) {
      return [
        { weekIndex: startWeekIndex, firstDayIndex: startDayIndex, lastDayIndex: endDayIndex },
      ];
    }

    const segments: WeekSegment[] = [];
    for (let wIdx = startWeekIndex; wIdx <= endWeekIndex; wIdx++) {
      segments.push({
        weekIndex: wIdx,
        firstDayIndex: wIdx === startWeekIndex ? startDayIndex : 0,
        lastDayIndex: wIdx === endWeekIndex ? endDayIndex : 6,
      });
    }
    return segments;
  }

  private assignRowsPerWeek(
    event: CalendarEvent,
    segments: WeekSegment[],
    ctx: MonthLayoutContext,
  ): Map<number, number> {
    const rowPerWeek = new Map<number, number>();

    for (const seg of segments) {
      let assignedRow = -1;
      for (let tryRow = 0; tryRow < 10; tryRow++) {
        if (this.isRowAvailable(event, seg, tryRow, ctx)) {
          assignedRow = tryRow;
          break;
        }
      }
      if (assignedRow === -1) assignedRow = 0;
      rowPerWeek.set(seg.weekIndex, assignedRow);
    }

    return rowPerWeek;
  }

  private isRowAvailable(
    event: CalendarEvent,
    seg: WeekSegment,
    row: number,
    ctx: MonthLayoutContext,
  ): boolean {
    for (let dayIdx = seg.firstDayIndex; dayIdx <= seg.lastDayIndex; dayIdx++) {
      const dayRows = ctx.rowsPerDay[seg.weekIndex][dayIdx];
      if (!dayRows[row]) dayRows[row] = { intervals: [] };

      for (const interval of dayRows[row].intervals) {
        if (
          event.start.toMillis() < interval.end.toMillis() &&
          event.end.toMillis() > interval.start.toMillis()
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private recordOccupiedIntervals(
    event: CalendarEvent,
    segments: WeekSegment[],
    rowPerWeek: Map<number, number>,
    ctx: MonthLayoutContext,
  ): void {
    for (const seg of segments) {
      const row = rowPerWeek.get(seg.weekIndex)!;
      for (let dayIdx = seg.firstDayIndex; dayIdx <= seg.lastDayIndex; dayIdx++) {
        const dayRows = ctx.rowsPerDay[seg.weekIndex][dayIdx];
        if (!dayRows[row]) dayRows[row] = { intervals: [] };
        dayRows[row].intervals.push({ start: event.start, end: event.end });
      }
    }
  }

  private renderSegment(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    rowPerWeek: Map<number, number>,
    ctx: MonthLayoutContext,
  ): void {
    const weekAssignedRow = rowPerWeek.get(seg.weekIndex) ?? 0;
    const topPercent =
      seg.weekIndex * ctx.weekHeightPercent + weekAssignedRow * ctx.rowHeightPercent;
    const { leftPercent, widthPercent } = this.calculateSegmentBounds(
      event,
      seg,
      range,
      ctx.dayWidth,
    );
    const spanDays = seg.lastDayIndex - seg.firstDayIndex + 1;

    const layout = this.buildPositionLayout(
      leftPercent,
      widthPercent,
      weekAssignedRow,
      seg.weekIndex,
      seg.firstDayIndex + 1,
      spanDays,
    );

    const dayKey =
      range.startWeekIndex === range.endWeekIndex ? range.startDayIndex : seg.firstDayIndex;

    if (weekAssignedRow >= this.MAX_VISIBLE_EVENTS_PER_ROW) {
      const mapKey = `${seg.weekIndex}-${dayKey}`;
      const existing = ctx.hiddenEventsMap.get(mapKey);
      if (existing) {
        existing.count++;
      } else {
        ctx.hiddenEventsMap.set(mapKey, { count: 1, weekIndex: seg.weekIndex, dayKey });
      }
      return;
    }

    ctx.positioned.push({
      ...event,
      layout,
      sizing: this.buildSizing({ topPercent, heightPercentMonth: ctx.rowHeightPercent * 0.7 }),
      metadata: this.buildViewMetadata(seg.firstDayIndex, 0, event.start, event.end),
    });
  }

  private calculateSegmentBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    const {
      startWeekIndex,
      startDayIndex,
      endWeekIndex,
      eventStartsBeforeVisible,
      eventEndsAfterVisible,
    } = range;
    const isSingleWeek =
      startWeekIndex === endWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible;

    if (isSingleWeek) {
      return this.singleWeekBounds(event, startDayIndex, dayWidth);
    }
    if (seg.weekIndex === startWeekIndex) {
      return this.firstWeekBounds(event, seg, range, dayWidth);
    }
    if (seg.weekIndex === endWeekIndex) {
      return this.lastWeekBounds(event, seg, range, dayWidth);
    }
    // Middle week: span entire week
    const leftPercent = seg.firstDayIndex * dayWidth;
    return { leftPercent, widthPercent: (seg.lastDayIndex - seg.firstDayIndex + 1) * dayWidth };
  }

  private singleWeekBounds(
    event: CalendarEvent,
    startDayIndex: number,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    const leftPercent = startDayIndex * dayWidth + this.hourFraction(event.start) * dayWidth;
    const durationHours = event.end.diff(event.start, 'minutes').minutes / 60;
    return { leftPercent, widthPercent: (durationHours / 24) * dayWidth };
  }

  private firstWeekBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    if (range.eventStartsBeforeVisible) {
      const leftPercent = 0;
      if (seg.weekIndex === range.endWeekIndex && !range.eventEndsAfterVisible) {
        const endPercent = seg.lastDayIndex * dayWidth + this.hourFraction(event.end) * dayWidth;
        return { leftPercent, widthPercent: endPercent };
      }
      return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth };
    }
    const leftPercent = seg.firstDayIndex * dayWidth + this.hourFraction(event.start) * dayWidth;
    return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth - leftPercent };
  }

  private lastWeekBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    const leftPercent = seg.firstDayIndex * dayWidth;
    if (range.eventEndsAfterVisible) {
      return { leftPercent, widthPercent: 100 - leftPercent };
    }
    const endPercent = seg.lastDayIndex * dayWidth + this.hourFraction(event.end) * dayWidth;
    return { leftPercent, widthPercent: endPercent - leftPercent };
  }

  private hourFraction(dt: DateTime): number {
    return (dt.hour + dt.minute / 60) / 24;
  }

  private emitOverflowBadges(ctx: MonthLayoutContext): void {
    for (const { count, weekIndex, dayKey } of ctx.hiddenEventsMap.values()) {
      const topPercent =
        weekIndex * ctx.weekHeightPercent + this.MAX_VISIBLE_EVENTS_PER_ROW * ctx.rowHeightPercent;

      ctx.positioned.push({
        id: `overflow-${weekIndex}-${dayKey}`,
        title: '',
        start: ctx.weeks[weekIndex][dayKey].startOf('day'),
        end: ctx.weeks[weekIndex][dayKey].endOf('day'),
        color: 'transparent',
        layout: this.buildPositionLayout(
          dayKey * ctx.dayWidth,
          ctx.dayWidth,
          this.MAX_VISIBLE_EVENTS_PER_ROW,
          weekIndex,
          dayKey + 1,
          1,
        ),
        sizing: this.buildSizing({
          topPercent,
          heightPercentMonth: ctx.rowHeightPercent * 0.7,
        }),
        metadata: this.buildViewMetadata(dayKey, count),
      });
    }
  }
}
